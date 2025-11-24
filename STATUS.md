# ✅ Dashboard-App Setup - Status

## 🎉 Alles fertig und einsatzbereit!

1. ✅ Dashboard-App erstellt (`/opt/cobot-chatwoot-sync/dashboard-app/`)
2. ✅ Server läuft auf Port 3003
3. ✅ Caddy Reverse Proxy konfiguriert als Unterverzeichnis
4. ✅ CORS-Header gesetzt
5. ✅ SSL-Zertifikat vorhanden (über hilfe.lieblingsarbeitsort.de)
6. ✅ **Keine separate Domain nötig!**

## 📍 Dashboard-URL

Das Dashboard läuft als Unterverzeichnis von Chatwoot:

```
https://hilfe.lieblingsarbeitsort.de/dashboard/
```

**Vorteile:**
- ✅ Keine separate Domain nötig
- ✅ Gleiches SSL-Zertifikat wie Chatwoot
- ✅ Nicht öffentlich zugänglich (nur über Chatwoot)
- ✅ Einfacheres Setup

## 🚀 Jetzt: In Chatwoot einrichten

1. Gehe zu **Einstellungen → Applications → Dashboard Apps**
2. Klicke auf **"Add a new dashboard app"**
3. Fülle aus:
   - **Name:** `Cobot Mitglieds-Dashboard`
   - **Content URL:** `https://hilfe.lieblingsarbeitsort.de/dashboard/`
   - **Height:** `600`
4. Speichern

## Testen

1. Öffne einen Kontakt mit Cobot-Daten (z.B. Jaqueline Oppermann)
2. Das Dashboard sollte in der rechten Sidebar erscheinen
3. Es zeigt:
   - Mitgliedsstatus
   - Tarif
   - Rechnungen
   - Buchungen
   - Custom Fields

## Troubleshooting

**Dashboard lädt nicht:**
```bash
# Prüfe ob Server läuft
curl http://localhost:3003/health

# Prüfe Caddy
systemctl status caddy

# Prüfe Logs
tail -f /var/log/caddy/dashboard.log
```

**SSL-Fehler:**
```bash
# Prüfe Caddy SSL Status
journalctl -u caddy -f | grep dashboard

# DNS testen
dig dashboard.lieblingsarbeitsort.de
```

**Keine Daten sichtbar:**
- Kontakt muss `cobot_id` Custom Attribute haben
- Sync muss durchgelaufen sein
- Browser-Konsole auf Fehler prüfen
