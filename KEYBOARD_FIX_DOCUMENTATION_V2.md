# Keyboard und Navigationsleisten-Fix für BBZCloud Mobile - Korrigierte Version

## Das eigentliche Problem

Das `@capgo/inappbrowser` Plugin öffnet **eigene WebView-Activities** (Android) bzw. **SFSafariViewController** (iOS), die **unabhängig** von der MainActivity laufen. Daher greifen Änderungen an der MainActivity **NICHT** für die InAppBrowser-WebViews.

## Lösung

### 1. Navigationsleisten-Problem ✅ GELÖST

**Problem**: Android-Navigationsleiste kollidiert mit unterem Bereich der WebViews

**Lösung**: Das Plugin bietet die Option `enabledSafeBottomMargin`

```typescript
await InAppBrowser.openWebView({
  url: "https://example.com",
  enabledSafeBottomMargin: true, // ✅ Löst das Problem!
});
```

Diese Option:

- Erstellt einen 20px Margin am unteren Rand
- Der sichere Bereich liegt AUSSERHALB des Browsers
- Verhindert Überlappung mit der Navigationsleiste

**Status**: ✅ Implementiert in `src/services/BrowserService.ts`

### 2. Keyboard-Problem ⚠️ TEILWEISE GELÖST

**Problem**: Textfelder werden von der Tastatur überdeckt

**Verfügbare Lösungen**:

#### Option A: JavaScript-Injection (Aktuell implementiert)

Das Plugin hat leider keine direkte Option für Keyboard-Handling. Daher nutzen wir JavaScript-Injection:

```typescript
// In src/services/InjectionScripts.ts
export const GLOBAL_INJECTION: InjectionScript = {
  css: `
    /* Auto-scroll für Input-Felder */
    input, textarea, [contenteditable="true"] {
      scroll-margin-bottom: 120px !important;
    }
  `,
  js: `
    // Detektiert Keyboard und scrollt Input automatisch in Sicht
    window.addEventListener('resize', detectKeyboard);
    inputs.forEach(input => {
      input.addEventListener('focus', function() {
        this.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  `,
};
```

**Einschränkungen**:

- ❌ Funktioniert nicht perfekt auf allen Websites
- ❌ Manche Web-Apps haben eigenes Keyboard-Handling, das kollidiert
- ⚠️ Keyboard-Höhe muss geschätzt werden
- ⚠️ Funktioniert nur, wenn Website kein `user-scalable=no` hat

#### Option B: @capgo/inappbrowser Feature Request

Das Plugin könnte theoretisch eine Option wie `adjustViewportOnKeyboard: true` hinzufügen, die:

- Die WebView-Größe automatisch anpasst wenn Keyboard erscheint
- Das native Android/iOS Keyboard-Handling nutzt

**Status**: ⚠️ Nicht im Plugin vorhanden - Feature Request nötig

## Warum greifen MainActivity-Änderungen nicht?

```
┌─────────────────────────────────────┐
│         MainActivity                │  ← Capacitor Haupt-App
│  - Ihre Ionic/React Komponenten     │
│  - Öffnet InAppBrowser              │
└─────────────────────────────────────┘
              │
              ├─ InAppBrowser.open()
              │
              ▼
┌─────────────────────────────────────┐
│    InAppBrowserActivity (Android)   │  ← Separate Activity!
│    oder SFSafariViewController (iOS)│  ← Eigener ViewController!
│                                      │
│  - Komplett unabhängig              │
│  - MainActivity-Settings greifen    │
│    NICHT hier                        │
│  - Plugin hat eigene WebView         │
└─────────────────────────────────────┘
```

### Was NICHT funktioniert:

❌ `android:windowSoftInputMode` in MainActivity → Greift nicht für InAppBrowser
❌ `getWindow().setSoftInputMode()` in MainActivity → Greift nicht für InAppBrowser
❌ AndroidManifest-Einstellungen für MainActivity → Greifen nicht für InAppBrowser

### Was FUNKTIONIERT:

✅ Plugin-Optionen wie `enabledSafeBottomMargin`
✅ JavaScript-Injection in die geladenen Web-Pages
⚠️ Custom Fork des Plugins (aufwendig, nicht empfohlen)

## Aktuelle Implementierung

### BrowserService.ts

```typescript
await InAppBrowser.openWebView({
  url,
  enabledSafeBottomMargin: true, // ✅ Löst Navigationsleisten-Problem
  // ... andere Optionen
});

// JavaScript-Injection für Keyboard-Handling
InAppBrowser.addListener("browserPageLoaded", async () => {
  // Injiziert globale Fixes
  await InAppBrowser.executeScript({ code: GLOBAL_INJECTION.js });
});
```

## Alternative Ansätze (für Zukunft)

### 1. Fork des @capgo/inappbrowser Plugins

- Android: `InAppBrowserActivity` mit `adjustResize` konfigurieren
- iOS: SFSafariViewController unterstützt dies bereits nativ

**Aufwand**: Hoch
**Wartung**: Muss mit Plugin-Updates synchronisiert werden

### 2. Capacitor Keyboard Plugin Integration

Das `@capacitor/keyboard` Plugin könnte theoretisch genutzt werden, um:

- Keyboard-Events zu detektieren
- WebView-Parameter anzupassen

**Problem**: Keyboard-Events werden nur in der MainActivity gefeuert, nicht in der InAppBrowser-Activity

### 3. Feature Request beim Plugin-Autor

Beste Lösung wäre, wenn das Plugin eine Option wie diese bekäme:

```typescript
await InAppBrowser.openWebView({
  url,
  adjustViewportOnKeyboard: true, // Feature Request
  keyboardBehavior: "adjustResize" | "adjustPan", // Feature Request
  enabledSafeBottomMargin: true, // ✅ Bereits vorhanden
});
```

## Testing

### Navigationsleiste (sollte funktionieren):

1. ✅ Öffne eine Web-App
2. ✅ Scrolle zum unteren Rand
3. ✅ Inhalt sollte nicht von der Navigationsleiste verdeckt sein
4. ✅ 20px Margin sollte sichtbar sein

### Keyboard (funktioniert teilweise):

1. ⚠️ Öffne eine Web-App mit Textfeldern
2. ⚠️ Tippe auf ein Textfeld
3. ⚠️ Das Textfeld sollte automatisch in den sichtbaren Bereich scrollen
4. ❌ Viewport wird NICHT automatisch verkleinert (Plugin-Limitation)

## Empfehlung

### Kurzfristig (JETZT):

✅ `enabledSafeBottomMargin: true` nutzen für Navigationsleiste
⚠️ JavaScript-Injection behalten für best-effort Keyboard-Handling
📝 Nutzer informieren, dass Keyboard-Handling limitiert ist

### Mittelfristig:

📧 Feature Request beim Plugin-Autor einreichen für natives Keyboard-Handling
🔍 Alternative InAppBrowser-Plugins evaluieren

### Langfristig:

🔧 Eigenen Fork des Plugins erstellen, wenn Feature nicht kommt

## Zusammenfassung

| Problem                      | Lösung                          | Status           |
| ---------------------------- | ------------------------------- | ---------------- |
| Navigationsleiste kollidiert | `enabledSafeBottomMargin: true` | ✅ Gelöst        |
| Keyboard überdeckt Inputs    | JavaScript-Injection            | ⚠️ Teilweise     |
| Native Keyboard-Anpassung    | Nicht im Plugin vorhanden       | ❌ Feature fehlt |

## Build-Anweisungen

Da nur JavaScript-Code geändert wurde:

```bash
# Kein Android-Build nötig!
# JavaScript wird zur Laufzeit injiziert
npm run build

# Nur wenn du andere native Änderungen hast:
npx cap sync android
npx cap run android
```

## Warum hat die erste Lösung nicht funktioniert?

Die MainActivity-Änderungen waren ein **Denkfehler**:

- MainActivity = Container für Ionic/React App
- InAppBrowser = Separater Container für geladene Websites
- Die sind **NICHT verbunden**

Das ist wie zu versuchen, die Einstellungen von Google Chrome zu ändern, indem man Firefox konfiguriert. 🤦

## Wichtige Erkenntnis

Capacitor-Plugins, die eigene Activities/ViewControllers öffnen (wie InAppBrowser, Camera, etc.) sind **unabhängig** von der MainActivity. Änderungen an der MainActivity greifen dort **NICHT**. Man muss:

1. Plugin-Optionen nutzen (wenn vorhanden)
2. JavaScript-Injection nutzen (wenn möglich)
3. Plugin forken (wenn nötig)
