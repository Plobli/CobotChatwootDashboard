const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// .env Datei laden
dotenv.config();

const app = express();
const PORT = process.env.DASHBOARD_PORT || 3003;

// Cobot API Konfiguration aus .env
const COBOT_BASE_URL = process.env.COBOT_BASE_URL;
const COBOT_ACCESS_TOKEN = process.env.COBOT_ACCESS_TOKEN;

// Validierung
if (!COBOT_BASE_URL || !COBOT_ACCESS_TOKEN) {
    console.error('❌ Fehler: COBOT_BASE_URL und COBOT_ACCESS_TOKEN müssen in .env gesetzt sein');
    process.exit(1);
}

// CORS für Chatwoot
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Statische Dateien
app.use(express.static(path.join(__dirname)));

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== COBOT API HELPER FUNCTIONS =====

async function fetchFromCobot(endpoint) {
    const response = await fetch(`${COBOT_BASE_URL}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${COBOT_ACCESS_TOKEN}`,
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Cobot API Error: ${response.status}`);
    }
    
    return response.json();
}

// Mitgliedsdaten abrufen
async function getMemberData(memberId) {
    return fetchFromCobot(`/api/memberships/${memberId}`);
}

// Custom Fields abrufen
async function getMemberCustomFields(memberId) {
    try {
        const result = await fetchFromCobot(`/api/memberships/${memberId}/custom_fields`);
        return result.fields || [];
    } catch (e) {
        console.error('Fehler beim Abrufen der Custom Fields:', e.message);
        return [];
    }
}

// Rechnungen abrufen
async function getMemberInvoices(memberId) {
    try {
        const invoices = await fetchFromCobot(`/api/memberships/${memberId}/invoices`);
        return Array.isArray(invoices) ? invoices : [];
    } catch (e) {
        console.error('Fehler beim Abrufen der Rechnungen:', e.message);
        return [];
    }
}

// Buchungen abrufen (letzte 30 Tage)
async function getMemberBookings(memberId) {
    try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const from = thirtyDaysAgo.toISOString().split('T')[0];
        const to = today.toISOString().split('T')[0];
        
        const bookings = await fetchFromCobot(`/api/memberships/${memberId}/bookings?from=${from}&to=${to}`);
        return Array.isArray(bookings) ? bookings : [];
    } catch (e) {
        console.error('Fehler beim Abrufen der Buchungen:', e.message);
        return [];
    }
}

// Zukünftige Buchungen abrufen
async function getMemberFutureBookings(memberId) {
    try {
        const today = new Date();
        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        
        const from = today.toISOString().split('T')[0];
        const to = thirtyDaysLater.toISOString().split('T')[0];
        
        const bookings = await fetchFromCobot(`/api/memberships/${memberId}/bookings?from=${from}&to=${to}`);
        return Array.isArray(bookings) ? bookings : [];
    } catch (e) {
        console.error('Fehler beim Abrufen der zukünftigen Buchungen:', e.message);
        return [];
    }
}

// ===== API ENDPOINT: Live Cobot Daten =====

app.get('/api/member/:memberId', async (req, res) => {
    const { memberId } = req.params;
    
    console.log(`📊 Live-Daten angefordert für Member: ${memberId}`);
    
    try {
        // Alle Daten parallel abrufen für beste Performance
        const [member, customFields, invoices, pastBookings, futureBookings] = await Promise.all([
            getMemberData(memberId),
            getMemberCustomFields(memberId),
            getMemberInvoices(memberId),
            getMemberBookings(memberId),
            getMemberFutureBookings(memberId)
        ]);
        
        // Letzte Rechnung finden
        const sortedInvoices = invoices.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const lastInvoice = sortedInvoices[0];
        
        // Nächste offene Rechnung finden
        const openInvoices = invoices.filter(inv => inv.state === 'open' || inv.state === 'pending');
        const nextDueInvoice = openInvoices.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
        
        // Buchungen kombinieren und sortieren
        const allBookings = [...pastBookings, ...futureBookings];
        const sortedBookings = allBookings.sort((a, b) => new Date(b.from) - new Date(a.from));
        const lastBooking = pastBookings.sort((a, b) => new Date(b.from) - new Date(a.from))[0];
        
        // Booking History formatieren (letzte 5)
        const bookingHistory = sortedBookings.slice(0, 5).map(b => {
            const date = new Date(b.from).toLocaleDateString('de-DE');
            return `${b.resource?.name || 'Unbekannt'} am ${date}`;
        });
        
        // Adresse formatieren
        let formattedAddress = '';
        if (member.address) {
            const addr = member.address;
            const parts = [
                addr.company,
                addr.name,
                addr.full_address
            ].filter(Boolean);
            formattedAddress = parts.join('\n');
        }
        
        // Response zusammenstellen
        const response = {
            success: true,
            data: {
                // Basis-Info
                id: member.id,
                name: member.name,
                email: member.email,
                phone: member.phone || '',
                address: formattedAddress,
                
                // Status
                status: member.canceled_to ? `Gekündigt zum ${new Date(member.canceled_to).toLocaleDateString('de-DE')}` : 'Aktiv',
                isCanceled: !!member.canceled_to,
                memberSince: member.confirmed_at,
                
                // Plan
                plan: member.plan?.name || 'Unbekannt',
                planPrice: member.plan?.price_display || '',
                
                // URLs
                profileUrl: `https://mitglieder.lieblingsarbeitsort.de/admin/memberships/${member.id}`,
                
                // Rechnungen
                lastInvoice: lastInvoice ? {
                    amount: `${lastInvoice.total_amount} ${lastInvoice.currency}`,
                    date: lastInvoice.created_at ? new Date(lastInvoice.created_at).toLocaleDateString('de-DE') : '',
                    status: lastInvoice.paid ? 'Bezahlt' : 
                            lastInvoice.paid_status === 'written_off' ? 'Abgeschrieben' :
                            lastInvoice.paid_status === 'open' ? 'Offen' : 
                            lastInvoice.paid_status || 'Unbekannt',
                    isPaid: lastInvoice.paid === true
                } : null,
                
                nextInvoice: nextDueInvoice ? {
                    amount: `${nextDueInvoice.total_amount} ${nextDueInvoice.currency}`,
                    dueDate: nextDueInvoice.due_date ? new Date(nextDueInvoice.due_date).toLocaleDateString('de-DE') : ''
                } : null,
                
                // Buchungen
                lastBooking: lastBooking ? {
                    resource: lastBooking.resource?.name || lastBooking.resource_name || 'Unbekannt',
                    date: new Date(lastBooking.from).toLocaleDateString('de-DE'),
                    time: new Date(lastBooking.from).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                } : null,
                
                bookingHistory: bookingHistory,
                totalBookingsLast30Days: pastBookings.length,
                upcomingBookings: futureBookings.length,
                
                // Custom Fields aus Cobot
                customFields: customFields.reduce((acc, field) => {
                    if (field.value) {
                        acc[field.label] = field.value;
                    }
                    return acc;
                }, {})
            },
            fetchedAt: new Date().toISOString()
        };
        
        console.log(`✅ Live-Daten erfolgreich für ${member.name}`);
        res.json(response);
        
    } catch (error) {
        console.error(`❌ Fehler beim Abrufen der Daten für ${memberId}:`, error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ===== API ENDPOINT: Custom Fields zu Cobot schreiben =====

// Cobot Custom Field IDs (aus Space-Konfiguration)
const COBOT_CUSTOM_FIELD_IDS = {
    'zugang_24_stunden': 'b799594101de60d2c5904a6a72fd580a',
    'nachsendeadresse': '3ac66a448db77c40f5bba11379aa5cdd',
    'firmenbezeichnung_briefkasten': '01e9f41eac032de45ee760dd197d12f7',
    'fix_desk': 'aeb42929e950a92a4754f3313e44dfba'
};

app.use(express.json());

app.put('/api/member/:memberId/custom_fields', async (req, res) => {
    const { memberId } = req.params;
    const fields = req.body;
    
    console.log(`📝 Custom Fields Update für Member: ${memberId}`);
    console.log('📤 Empfangene Felder:', fields);
    
    try {
        // Felder in Cobot-Format umwandeln
        const cobotFields = [];
        
        if (fields.zugang_24_stunden !== undefined) {
            cobotFields.push({
                id: COBOT_CUSTOM_FIELD_IDS.zugang_24_stunden,
                value: fields.zugang_24_stunden
            });
        }
        
        if (fields.nachsendeadresse !== undefined) {
            cobotFields.push({
                id: COBOT_CUSTOM_FIELD_IDS.nachsendeadresse,
                value: fields.nachsendeadresse
            });
        }
        
        if (fields.firmenbezeichnung_briefkasten !== undefined) {
            cobotFields.push({
                id: COBOT_CUSTOM_FIELD_IDS.firmenbezeichnung_briefkasten,
                value: fields.firmenbezeichnung_briefkasten
            });
        }
        
        if (fields.fix_desk !== undefined) {
            cobotFields.push({
                id: COBOT_CUSTOM_FIELD_IDS.fix_desk,
                value: fields.fix_desk
            });
        }
        
        if (cobotFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Keine gültigen Felder zum Aktualisieren'
            });
        }
        
        // An Cobot senden
        const response = await fetch(`${COBOT_BASE_URL}/api/memberships/${memberId}/custom_fields`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${COBOT_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cobotFields)
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cobot API Error: ${response.status} - ${error}`);
        }
        
        const result = await response.json();
        console.log(`✅ Custom Fields erfolgreich aktualisiert für Member: ${memberId}`);
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error(`❌ Fehler beim Aktualisieren der Custom Fields:`, error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Cobot Dashboard App');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 Dashboard URL: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`📡 API Endpoint: http://localhost:${PORT}/api/member/:id`);
    console.log(`📝 Custom Fields: PUT http://localhost:${PORT}/api/member/:id/custom_fields`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
