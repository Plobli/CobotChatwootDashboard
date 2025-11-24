# Cobot Dashboard App für Chatwoot

## 🎯 Übersicht

Diese Dashboard-App zeigt Cobot-Mitgliedsdaten direkt in der Chatwoot-Kontakt-Sidebar an:

- **Mitgliedsstatus** und aktueller Tarif
- **Rechnungsinformationen** (letzte und nächste Rechnung)
- **Buchungshistorie** der letzten Wochen
- **Kontaktdaten** und Adresse
- **Custom Fields** aus Cobot

## 📦 Installation

1. **Dependencies installieren:**
```bash
cd /opt/cobot-chatwoot-sync/dashboard-app
npm install
```

2. **Server starten:**
```bash
node server.js
```

Oder mit PM2:
```bash
pm2 start server.js --name cobot-dashboard
pm2 save
```

3. **In Chatwoot einrichten:**

   - Gehe zu **Einstellungen → Applications → Dashboard Apps**
   - Klicke auf **Add Dashboard App**
   - Füge folgende URL ein:
     ```
     http://YOUR-SERVER-IP:3003
     ```
   - Name: `Cobot Mitglieds-Dashboard`
   - Speichern

4. **Testen:**
   - Öffne einen Kontakt mit Cobot-Daten
   - Das Dashboard sollte in der rechten Sidebar erscheinen

## 🚀 Features

### Statistiken
- Mitgliedsstatus (Aktiv/Gekündigt)
- Aktueller Tarif
- Letzte Rechnungssumme und Status
- Nächstes Rechnungsdatum

### Mitgliedsinformationen
- Mitglied seit Datum
- Telefon und Adresse
- Direkter Link zum Cobot-Profil

### Buchungen
- Letzte Buchung (Ressource + Datum)
- Historie der letzten 5 Buchungen

### Custom Fields
- Automatische Anzeige aller Cobot Custom Fields
- Formatierung: `cobot_cf_feldname` → "Feldname"

## 🔧 Konfiguration

Port ändern in `server.js`:
```javascript
const PORT = process.env.DASHBOARD_PORT || 3003;
```

Oder via Umgebungsvariable:
```bash
DASHBOARD_PORT=3004 node server.js
```

## 📝 Hinweise

- Die App läuft auf Port **3003** (standardmäßig)
- CORS ist für alle Origins aktiviert (für Chatwoot notwendig)
- Die App benötigt keine Datenbank - sie liest nur Chatwoot Custom Attributes
- Nur Kontakte mit `cobot_id` werden angezeigt

## 🐛 Troubleshooting

**Dashboard wird nicht angezeigt:**
- Prüfe ob der Server läuft: `curl http://localhost:3003/health`
- Prüfe die Browser-Konsole auf Fehler
- Stelle sicher, dass die URL in Chatwoot korrekt ist

**Keine Daten sichtbar:**
- Kontakt muss Custom Attribute `cobot_id` haben
- Sync muss mindestens einmal durchgelaufen sein

**CORS-Fehler:**
- Der Server muss von außen erreichbar sein
- Prüfe Firewall-Einstellungen für Port 3003
