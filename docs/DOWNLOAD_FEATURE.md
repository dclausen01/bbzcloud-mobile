# BBZCloud Mobile - Download Funktionalität

## Übersicht

Die Download-Funktionalität ermöglicht es Benutzern, Dateien aus den in InAppBrowser geöffneten Web-Apps herunterzuladen. Downloads werden automatisch erkannt und im nativen Kontext durchgeführt.

**Version:** 1.0.0  
**Datum:** 16.10.2025

## Architektur

### Komponenten

1. **InjectionScripts.ts** - Download-Interception im WebView
2. **DownloadService.ts** - Native Download-Verwaltung
3. **BrowserService.ts** - Koordination zwischen WebView und Native

### Ablauf

```
1. User klickt Download-Link im WebView
2. Injiziertes JavaScript fängt Klick ab
3. URL + Metadata via postMessage an Native-App
4. BrowserService empfängt Message
5. DownloadService führt nativen HTTP-Download durch
6. Datei wird im Documents-Ordner gespeichert
7. User erhält Notification & Dialog
```

## Funktionsweise

### 1. Download-Erkennung

Das injizierte JavaScript erkennt Downloads anhand:

- **Download-Attribut**: `<a download="filename.pdf">`
- **URL-Patterns**: `/download/`, `/api/*/download`, `/files/`, `?download`
- **Dateiendungen**: `.pdf`, `.doc`, `.xlsx`, `.zip`, etc.
- **Link-Text**: "download", "herunterladen", "export"

### 2. Authentication

Das System extrahiert automatisch Auth-Headers:

- **Bearer Token** aus localStorage
- **CSRF Token** aus Meta-Tags
- **Session Cookies** (automatisch via fetch)

### 3. Download-Durchführung

Downloads werden im nativen Kontext durchgeführt:

```typescript
// Native fetch-Request
const response = await fetch(url, {
  method: 'GET',
  headers: authHeaders,
});

// Blob zu Base64 konvertieren
const base64Data = await blobToBase64(blob);

// Mit Filesystem API speichern
await Filesystem.writeFile({
  path: filename,
  data: base64Data,
  directory: Directory.Documents,
});
```

### 4. Speicherort

**Android:**
- Standard: `/storage/emulated/0/Documents/`
- Alternativ: App-spezifischer Ordner

**iOS:**
- Documents-Ordner der App
- Via Files-App zugänglich

## Verwendung

### Als Entwickler

Die Download-Funktionalität ist automatisch aktiv für alle Apps, die über InAppBrowser geöffnet werden. Keine zusätzliche Konfiguration erforderlich.

### Als Benutzer

1. Öffne eine App in BBZCloud
2. Navigiere zu einer Datei/Download
3. Klicke auf Download-Link
4. Warte auf Download-Abschluss
5. Datei ist im Documents-Ordner verfügbar

## API

### DownloadService

```typescript
// Download eine Datei
await DownloadService.downloadFile({
  url: 'https://example.com/file.pdf',
  filename: 'document.pdf',
  headers: { 'Authorization': 'Bearer token' },
  mimeType: 'application/pdf'
});

// Aktive Downloads abrufen
const active = DownloadService.getActiveDownloads();

// Download abbrechen
await DownloadService.cancelDownload('filename.pdf');

// Downloads auflisten
const files = await DownloadService.listDownloadedFiles();

// Datei löschen
await DownloadService.deleteFile('filename.pdf');
```

## Limitierungen

### Dateigrößen

- **Empfohlen**: < 100 MB
- **Maximum**: Abhängig von verfügbarem Speicher
- **Performance**: Bei großen Dateien (>50 MB) kann Download einige Sekunden dauern

### Dateitypen

Unterstützt alle Dateitypen, optimiert für:
- Dokumente: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Archive: ZIP, RAR, TAR, GZ, 7Z
- Bilder: JPG, PNG, GIF, SVG
- Media: MP3, MP4, AVI, MOV
- Text: TXT, CSV, JSON, XML

### Einschränkungen

1. **POST-Downloads**: Formulare mit POST-Request werden noch nicht abgefangen
2. **Dynamische Downloads**: Blob-URLs funktionieren nicht direkt
3. **Streaming**: Kein progressiver Download-Support

## Berechtigungen

### Android

**Erforderlich:**
- `INTERNET` - Bereits vorhanden ✅
- `FileProvider` - Bereits konfiguriert ✅

**Nicht erforderlich:**
- `WRITE_EXTERNAL_STORAGE` - Nicht nötig für Documents-Ordner (Android 10+)

### iOS

Keine zusätzlichen Berechtigungen erforderlich.

## Fehlerbehandlung

### Häufige Fehler

1. **Network Error**
   - Ursache: Keine Internetverbindung
   - Lösung: Internetverbindung prüfen

2. **401 Unauthorized**
   - Ursache: Fehlende/ungültige Authentication
   - Lösung: Auth-Token-Extraktion in InjectionScripts prüfen

3. **403 Forbidden**
   - Ursache: Fehlende Berechtigungen
   - Lösung: Server-seitige Berechtigungen prüfen

4. **Storage Full**
   - Ursache: Nicht genug Speicherplatz
   - Lösung: Speicherplatz freigeben

### Error Handling im Code

```typescript
try {
  await DownloadService.downloadFile(request);
} catch (error) {
  // Automatische Fehlerbehandlung:
  // - User-Dialog mit Fehlermeldung
  // - Error-Notification
  // - Console-Log für Debugging
  console.error('Download failed:', error);
}
```

## Testing

### Manuelle Tests

1. **Einfacher Download**
   - Link mit download-Attribut klicken
   - ✅ Datei sollte heruntergeladen werden

2. **Download mit Auth**
   - In geschütztem Bereich einloggen
   - Geschützte Datei herunterladen
   - ✅ Auth-Headers sollten automatisch gesendet werden

3. **Große Datei**
   - Datei > 50 MB herunterladen
   - ✅ Download sollte funktionieren (kann dauern)

4. **Mehrere Downloads**
   - Mehrere Dateien hintereinander herunterladen
   - ✅ Alle sollten erfolgreich sein

### Debug-Logs

Download-Aktivität kann in den Console-Logs verfolgt werden:

```
[BBZCloud] Download interception initialized
[BBZCloud] Intercepting download: https://...
[DownloadService] Starting download: filename.pdf
[DownloadService] File saved: file:///storage/...
```

## Erweiterungen

### Mögliche zukünftige Features

1. **Progress-Tracking**
   - Real-time Download-Progress
   - Progress-Bar in Notification

2. **Download-Manager**
   - Liste aller Downloads
   - Pause/Resume-Funktionalität
   - Download-History

3. **POST-Download-Support**
   - Form-Submissions abfangen
   - POST-Daten an Native senden

4. **Cloud-Sync**
   - Downloads in Cloud speichern
   - Geräte-übergreifender Zugriff

5. **Datei-Viewer**
   - Heruntergeladene Dateien in-app öffnen
   - PDF-Viewer, Image-Viewer, etc.

## Troubleshooting

### Downloads funktionieren nicht

1. **Prüfe Console-Logs**
   ```
   [BBZCloud] Download interception initialized
   ```
   Sollte beim Laden der Seite erscheinen

2. **Prüfe postMessage**
   ```javascript
   // Im WebView-Context:
   console.log(window.mobileApp); // sollte nicht undefined sein
   ```

3. **Prüfe Listener**
   ```typescript
   // BrowserService sollte Download-Listener haben
   this.downloadListener !== null
   ```

### Datei nicht gefunden

- Prüfe Documents-Ordner: `/storage/emulated/0/Documents/`
- Prüfe Dateiberechtigung
- Prüfe Speicherplatz

### Auth-Fehler

- Prüfe localStorage-Token-Namen
- Prüfe Header-Format
- Erweitere getAuthHeaders() für spezifische Apps

## Technische Details

### Dependencies

- `@capacitor/filesystem` - Dateisystem-Zugriff
- `@capacitor/local-notifications` - Download-Benachrichtigungen
- `@capacitor/dialog` - User-Dialoge
- `@capgo/inappbrowser` - WebView & Message-Passing

### Performance

- **Kleine Dateien (<10 MB)**: ~1-2 Sekunden
- **Mittlere Dateien (10-50 MB)**: ~3-10 Sekunden
- **Große Dateien (>50 MB)**: Je nach Verbindung

### Memory Usage

- Base64-Konvertierung benötigt ~1.5x Dateigröße an Memory
- Für 100 MB Datei: ~150 MB Memory-Bedarf
- Bei sehr großen Dateien könnten Memory-Limits erreicht werden

## Changelog

### Version 1.0.0 (16.10.2025)

**Initial Release**
- ✅ Download-Interception im WebView
- ✅ Native HTTP-Downloads
- ✅ Auth-Header-Extraktion
- ✅ Filesystem-Integration
- ✅ User-Notifications
- ✅ Error-Handling
- ✅ AppViewer.tsx entfernt (obsolet)
- ✅ Dokumentation erstellt

## Support

Bei Fragen oder Problemen:
1. Console-Logs prüfen
2. Dokumentation konsultieren
3. Issue erstellen mit:
   - App/Website wo Problem auftritt
   - Dateitype und -größe
   - Error-Logs
   - Reproduktionsschritte
