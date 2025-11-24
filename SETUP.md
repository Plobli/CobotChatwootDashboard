# Chatwoot Dashboard App - Einrichtungsanleitung

## 🎯 Was ist eine Dashboard App?

Dashboard Apps in Chatwoot ermöglichen es, externe Daten direkt in der Kontakt-Sidebar anzuzeigen. In diesem Fall werden alle Cobot-Mitgliedsdaten übersichtlich präsentiert, ohne zwischen verschiedenen Tools wechseln zu müssen.

## 📋 Schritt-für-Schritt Anleitung

### 1. Dashboard App in Chatwoot registrieren

1. **Melde dich in Chatwoot an** und gehe zu:
   ```
   Einstellungen → Applications → Dashboard Apps
   ```

2. **Klicke auf "Add a new dashboard app"**

3. **Fülle das Formular aus:**
   - **Name:** `Cobot Mitglieds-Dashboard`
   - **Description:** `Zeigt Cobot-Mitgliedsdaten, Tarife, Rechnungen und Buchungen`
   - **Content URL:** `https://hilfe.lieblingsarbeitsort.de/dashboard/`
   - **Height:** `600` (empfohlen, kann angepasst werden)

4. **Speichern**

### 2. Dashboard testen

1. **Öffne einen Kontakt** der mit Cobot synchronisiert ist (z.B. Jaqueline Oppermann)

2. **Das Dashboard sollte in der rechten Sidebar erscheinen** und folgende Daten anzeigen:
   - ✅ Mitgliedsstatus (Aktiv/Gekündigt)
   - 💰 Aktueller Tarif
   - 🧾 Letzte Rechnung (Betrag, Datum, Status)
   - 📅 Nächste Rechnung
   - 👤 Kontaktdaten (Telefon, Adresse)
   - 📚 Buchungshistorie
   - 🔗 Link zum Cobot-Profil
   - 📝 Custom Fields

### 3. Firewall-Einstellungen (falls nötig)

Falls das Dashboard nicht lädt, muss Port 3003 möglicherweise geöffnet werden:

```bash
# UFW (Ubuntu/Debian)
sudo ufw allow 3003/tcp

# Oder für firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=3003/tcp
sudo firewall-cmd --reload
```

## 🎨 Was zeigt das Dashboard?

### Oberer Bereich - Statistiken
4 große Karten mit den wichtigsten Kennzahlen:
- **Mitgliedsstatus** mit farbigem Badge (grün=aktiv, rot=gekündigt)
- **Aktueller Tarif** (z.B. "Tagespass & Räume")
- **Letzte Rechnung** (Betrag + Status)
- **Nächste Rechnung** (Datum)

### Mitgliedsinformationen
- Mitglied seit
- Telefonnummer
- Postadresse
- Direktlink zum Cobot-Profil (öffnet in neuem Tab)

### Buchungen
- Letzte Buchung mit Ressource und Datum
- Historie der letzten 5 Buchungen in chronologischer Reihenfolge

### Custom Fields
- Alle benutzerdefinierten Felder aus Cobot
- Automatische Formatierung (z.B. "zugang_24_stunden" → "Zugang 24 Stunden")

## 🔄 Automatische Updates

Die Dashboard-Daten werden automatisch aktualisiert:
- Bei jedem Webhook-Event von Cobot
- Beim manuellen Sync eines Mitglieds
- Beim Initial-Sync aller Mitglieder

## 💡 Vorteile des Dashboards

1. **Alle Infos auf einen Blick** - Kein Wechsel zu Cobot nötig
2. **Kontextbezogen** - Zeigt nur Daten des aktuellen Kontakts
3. **Echtzeit** - Daten werden via Webhook synchronisiert
4. **Übersichtlich** - Strukturierte Darstellung mit Icons und Farben
5. **Klickbar** - Direkter Link zum Cobot-Profil für Details

## 🚨 Hinweise

- **Nur Cobot-Mitglieder:** Das Dashboard zeigt nur Daten für Kontakte mit `cobot_id`
- **Erster Sync erforderlich:** Kontakt muss mindestens einmal synchronisiert worden sein
- **Keine Daten?** Prüfe ob der Kontakt in Chatwoot Custom Attributes hat

## 🛠️ Wartung

**Server-Status prüfen:**
```bash
curl http://localhost:3003/health
```

**Logs ansehen:**
```bash
tail -f /opt/cobot-chatwoot-sync/dashboard-app/dashboard.log
```

**Server neu starten:**
```bash
pkill -f "node server.js"
cd /opt/cobot-chatwoot-sync/dashboard-app && node server.js > dashboard.log 2>&1 &
```

## 📸 Beispiel-Screenshot

Das Dashboard zeigt z.B. für Jaqueline Oppermann:
- Status: **Aktiv** (grünes Badge)
- Tarif: **Tagespass & Räume (Basisplan)**
- Letzte Rechnung: **1.19 EUR** (10.07.2023 - Bezahlt)
- Nächste Rechnung: **01.12.2025**
- Letzte Buchung: **Meetingraum** am 29.11.2025 (10:00-15:00)

---

**Bei Fragen oder Problemen:** Siehe README.md im dashboard-app Ordner
