# Native Download Implementation - v9.0

## Übersicht

Diese Dokumentation beschreibt die neue native Download-Lösung, die primär auf Android nativen Download-Listener setzt und JavaScript nur als Fallback verwendet.

## Architekturänderungen

### 1. Native Download Listener (Primär)

**Datei:** `android/app/src/main/java/io/ionic/starter/MainActivity.java`

Der native Download-Listener:

- Wird in `MainActivity.onCreate()` initialisiert
- Lauscht auf alle WebView-Download-Anfragen
- Extrahiert automatisch Dateinamen aus Content-Disposition oder URL
- Sendet Download-Informationen an JavaScript via `mobileApp.postMessage`
- Unterstützt alle gängigen MIME-Typen

**Vorteile:**

- Fängt alle nativen Download-Anfragen ab
- Zuverlässige Dateinamen-Extraktion
- Keine JavaScript-Interception necessary
- Funktioniert mit allen Web-Technologien

### 2. Vereinfachte JavaScript-Interception (Fallback)

**Datei:** `src/services/InjectionScripts.ts`

Die JavaScript-Interception wurde massiv vereinfacht:

- Nur noch als Fallback für SPA-Downloads
- Minimaler Code - nur offensichtliche Download-Links
- Vermeidet Komplexität und Konflikte
- Markiert Downloads als `source: 'javascript-fallback'`

### 3. Erweiterte BrowserService-Integration

**Datei:** `src/services/BrowserService.ts`

- Unterstützt neue Download-Quellen (`source: 'native'`)
- Logging für Download-Quellen zur Fehlersuche
- Konsistente Verarbeitung aller Download-Typen

## Download-Quellen

### 1. Native Downloads (Priorität 1)

- **Trigger:** WebView `setDownloadListener`
- **Source:** `source: 'native'`
- **Metadaten:** Vollständige URL, Dateiname, MIME-Type, Content-Length, User-Agent, Content-Disposition
- **Verarbeitung:** Direkte Weitergabe an DownloadService

### 2. JavaScript Fallback (Priorität 2)

- **Trigger:** Nur klare Download-Links und SPA-Buttons
- **Source:** `source: 'javascript-fallback'`
- **Metadaten:** Basis-URL und Dateiname
- **Verarbeitung:** Nur wenn native Methode fehlschlägt

## Test-Szenarien

### 1. Native Downloads testen

```bash
# Öffne eine Web-App mit direkten Download-Links
# Beispiel: Moodle mit PDF-Dokumenten
# Erwartet: source: 'native' in Logs
```

### 2. SPA Downloads testen

```bash
# Öffne schul.cloud oder ähnliche SPAs
# Klicke auf Download-Buttons
# Erwartet: source: 'javascript-fallback' wenn native Methode fehlschlägt
```

### 3. MIME-Type Erkennung testen

- PDF:application/pdf → .pdf
- Word: .doc/.docx
- Excel: .xls/.xlsx
- PowerPoint: .ppt/.pptx
- ZIP: application/zip → .zip

## Debug-Logging

### MainActivity Logs

```
BBZCloud-Download: Native download detected:
BBZCloud-Download:   URL: https://example.com/file.pdf
BBZCloud-Download:   Content-Disposition: attachment; filename="document.pdf"
BBZCloud-Download:   MIME-Type: application/pdf
BBZCloud-Download:   Content-Length: 1234567
```

### BrowserService Logs

```
BrowserService: Download source: native
BrowserService: Download progress: 45% (native)
```

### JavaScript Fallback Logs

```
BBZCloud: Clear download link detected, using fallback
BBZCloud: Fallback download interception: https://example.com/file.pdf
```

## Fehlerbehebung

### 1. Downloads werden nicht erkannt

**Prüfen:**

- Android Logcat für MainActivity Logs
- Ob `mobileApp.postMessage` verfügbar ist
- Ob WebView-Kommunikation funktioniert

### 2. Falsche Dateinamen

**Prüfen:**

- Content-Disposition Header in der Response
- URL-Parsing in `extractFilename()`
- MIME-Type Zuordnung in `getExtensionFromMimeType()`

### 3. JavaScript Konflikte

**Prüfen:**

- Ob beide Systeme gleichzeitig feuern
- Event-Prevention in JavaScript
- Timing der Skript-Injektion

## Performance-Vorteile

1. **Reduced JavaScript Complexity:** ~80% weniger Code
2. **Faster Detection:** Native Methode ist sofort aktiv
3. **Better Reliability:** Keine Race-Conditions
4. **Lower Memory Usage:** Weniger Event-Listener

## Kompatibilität

### Android

- ✅ Native Downloads (vollständig unterstützt)
- ✅ JavaScript Fallback (für SPA-Downloads)
- ✅ Alle WebView-Versionen

### iOS

- ⚠️ Nur JavaScript Fallback verfügbar
- ⚠️ Native Listener nicht implementiert
- ✅ Funktioniert immer noch

## Zukünftige Verbesserungen

1. **iOS Native Listener:** Implementierung für iOS
2. **Bessere SPA Integration:** Spezielle Handlung für schul.cloud
3. **Download-Historie:** Speicher von Download-Statistiken
4. **Batch Downloads:** Unterstützung für Multiple-File-Downloads

## Migration von v8.0 zu v9.0

### Entfernt:

- Komplexe Network-Interception
- RegExp-basierte URL-Erkennung
- Mehrfache Event-Listener
- XPath-Abfragen

### Hinzugefügt:

- Native DownloadListener in MainActivity
- Vereinfachte JavaScript-Fallback-Logik
- Source-Tracking für Downloads
- Erweiterte Debug-Logging

### Konfigurationsänderungen:

- Keine Änderungen an AndroidManifest.xml notwendig
- Keine Änderungen an Capacitor Config notwendig
- Bestehende Downloads weiterhin kompatibel
