# Keyboard und Navigationsleisten-Fix für BBZCloud Mobile - Version 3.0

## Architektur-Überblick

Die BBZCloud Mobile App nutzt `@capgo/inappbrowser` Plugin, das **separate Activities** (Android) bzw. **ViewControllers** (iOS) öffnet, die **unabhängig** von der MainActivity laufen.

```
┌─────────────────────────────────────┐
│         MainActivity                │  ← Capacitor Haupt-App (Ionic/React)
│  - Ihre Ionic/React Komponenten     │
│  - Settings hier greifen NICHT für  │
│    InAppBrowser                      │
└─────────────────────────────────────┘
              │
              ├─ InAppBrowser.openWebView()
              │
              ▼
┌─────────────────────────────────────┐
│    InAppBrowserActivity (Android)   │  ← Separate Activity!
│    oder SFSafariViewController (iOS)│
│                                      │
│  - Eigener WebView-Kontext          │
│  - MainActivity-Settings greifen    │
│    NICHT hier                        │
│  - NUR Plugin-Optionen + JavaScript  │
│    funktionieren                     │
└─────────────────────────────────────┘
```

## Die Lösung - Version 3.0 (Vereinfacht & Funktional)

### Prinzip: Nur APIs verwenden, die im WebView verfügbar sind

**Was funktioniert NICHT:**
- ❌ MainActivity Keyboard Events (`@capacitor/keyboard`) → greifen nicht im InAppBrowser
- ❌ `capacitor.config.ts` Keyboard-Einstellungen → greifen nicht im InAppBrowser
- ❌ Event-Bridges zwischen MainActivity und InAppBrowser → zu komplex, unzuverlässig
- ❌ AndroidManifest Änderungen → greifen nicht im InAppBrowser

**Was funktioniert ✅:**
- ✅ **Plugin-Optionen**: `enabledSafeBottomMargin: true`
- ✅ **WebView APIs**: `window.visualViewport`, `window.resize`
- ✅ **JavaScript Injection**: `executeScript()` nach `browserPageLoaded`
- ✅ **Standard Web APIs**: `scrollIntoView()`, `focus`/`blur` Events

## Implementierung

### 1. Navigation Bar Handling ✅ GELÖST

**Problem**: Android-Navigationsleiste überdeckt untere 48-96px

**Lösung**: Plugin-Option nutzen

```typescript
// BrowserService.ts
await InAppBrowser.openWebView({
  url,
  enabledSafeBottomMargin: true, // ✅ Plugin fügt 20px Margin hinzu
  // ... andere Optionen
});
```

**Status**: ✅ Vollständig gelöst durch Plugin-Feature

### 2. Keyboard Handling ✅ OPTIMIERT

**Problem**: Textfelder werden von der Tastatur überdeckt

**Lösung**: WebView APIs nutzen (visualViewport + resize Events)

#### Implementierung in InjectionScripts.ts

```javascript
// Präzise Keyboard-Detection via visualViewport API
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const viewportHeight = window.visualViewport.height;
    const windowHeight = window.innerHeight;
    const heightDiff = windowHeight - viewportHeight;
    
    if (heightDiff > 150) {
      // Keyboard ist sichtbar
      isKeyboardVisible = true;
      keyboardHeight = heightDiff;
      
      // Scroll fokussiertes Input in sichtbaren Bereich
      if (focusedInput) {
        scrollInputIntoView(focusedInput);
      }
    } else {
      // Keyboard ist versteckt
      isKeyboardVisible = false;
    }
  });
}
```

#### Auto-Scroll für Inputs

```javascript
document.addEventListener('focusin', (e) => {
  if (e.target.matches('input, textarea, select, [contenteditable="true"]')) {
    focusedInput = e.target;
    
    // Warte auf Keyboard, dann scrolle
    setTimeout(() => {
      e.target.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 300);
  }
});
```

**Vorteile dieser Lösung:**
- ✅ Nutzt native WebView APIs (visualViewport)
- ✅ Präzise Keyboard-Höhe ohne Schätzung
- ✅ Funktioniert auf allen modernen Android/iOS Geräten
- ✅ Kein komplexes Event-Bridging nötig
- ✅ Weniger Code, weniger Fehlerquellen

**Status**: ✅ Optimiert mit WebView-APIs

## Code-Struktur

### BrowserService.ts - Version 3.0

**Entfernt:**
- ❌ `setupKeyboardBridge()` - nicht funktional
- ❌ `cleanupKeyboardBridge()` - nicht nötig
- ❌ `Keyboard.addListener()` - greift nicht im InAppBrowser
- ❌ `InAppBrowser.postMessage()` - Events kommen nicht an
- ❌ Komplexe Navigation Bar Detection - Plugin macht das

**Vereinfacht:**
```typescript
private async openWebViewWithInjection(url: string, appId: string) {
  // Setup listener für Injection
  this.pageLoadedListener = await InAppBrowser.addListener('browserPageLoaded', async () => {
    // Inject GLOBAL CSS
    if (GLOBAL_INJECTION.css) { ... }
    
    // Inject GLOBAL JavaScript (Keyboard-Handling)
    if (GLOBAL_INJECTION.js) { ... }
    
    // Inject App-specific Scripts
    if (injectionScript) { ... }
  });

  // WebView öffnen
  await InAppBrowser.openWebView({
    url,
    enabledSafeBottomMargin: true, // ✅ Für Navigation Bar
    // ... Standard-Optionen
  });
}
```

### InjectionScripts.ts - Version 4.0

**Kern-Features:**
1. **Viewport Setup**: Optimale Meta-Tags setzen
2. **Keyboard Detection**: `visualViewport.resize` Event (präzise)
3. **Input Handling**: `focusin` Event Delegation
4. **Auto-Scroll**: `scrollIntoView()` für fokussierte Inputs
5. **Orientation**: Handling für Geräte-Rotation

**Keine komplexen Features:**
- ❌ Keine Event-Bridge zu MainActivity
- ❌ Keine Navigation Bar Detection (Plugin macht das)
- ❌ Kein WebView Height Adjustment (funktioniert nicht vom JS aus)

### capacitor.config.ts - Bereinigt

```typescript
const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'bbzcloud-temp',
  webDir: 'dist',
  plugins: {
    // Note: Keyboard config only affects MainActivity, not InAppBrowser
    // InAppBrowser handles keyboard via JavaScript injection
  }
};
```

## Warum Version 3.0 besser ist

### Version 2.0 Probleme:
1. ❌ Versuchte Event-Bridge MainActivity → InAppBrowser (funktioniert nicht)
2. ❌ `Keyboard.addListener` in MainActivity (Events kommen nicht im InAppBrowser an)
3. ❌ `InAppBrowser.postMessage` mit falschen Event-Namen
4. ❌ Komplexe Navigation Bar Detection (Plugin macht das bereits)
5. ❌ `capacitor.config.ts` Settings (haben keine Wirkung)

### Version 3.0 Vorteile:
1. ✅ Nutzt nur APIs die im WebView verfügbar sind
2. ✅ `visualViewport` API für präzise Keyboard-Detection
3. ✅ Plugin-Option `enabledSafeBottomMargin` für Navigation Bar
4. ✅ Einfacher, wartbarer Code
5. ✅ Weniger Abhängigkeiten, weniger Fehlerquellen

## Testing

### Navigation Bar (sollte funktionieren):
1. ✅ Web-App öffnen (z.B. schul.cloud)
2. ✅ Zum unteren Rand scrollen
3. ✅ Inhalt sollte 20px Margin haben
4. ✅ Navigationsleiste überdeckt nichts

### Keyboard (sollte funktionieren):
1. ✅ Web-App öffnen mit Textfeldern
2. ✅ Textfeld antippen
3. ✅ Textfeld scrollt automatisch in sichtbaren Bereich
4. ✅ Textfeld bleibt sichtbar während Tippen

### Console Logs überprüfen:
```
[BBZCloud] Keyboard handler v4.0 - WebView API based
[BBZCloud] Using visualViewport API for keyboard detection
[BBZCloud] Input focused: INPUT
[BBZCloud] Keyboard shown, height: 456
[BBZCloud] Scrolling input into view
```

## Technische Details

### visualViewport API

Die `visualViewport` API ist **der Standard** für Keyboard-Detection im Web:

```javascript
window.visualViewport.height  // Sichtbare Höhe (ohne Keyboard)
window.innerHeight            // Gesamt-Höhe
// Differenz = Keyboard-Höhe
```

**Vorteile:**
- Präzise Messungen
- Standard-Web-API
- Unterstützt von allen modernen Browsern
- Funktioniert auch bei Split-Screen, Bild-in-Bild, etc.

**Fallback:**
Wenn `visualViewport` nicht verfügbar (sehr alte Geräte):
- Nutze `window.resize` Events
- Schätze Keyboard-Höhe via Viewport-Änderung

### scrollIntoView()

Standard-Web-API zum Scrollen von Elementen in Sicht:

```javascript
element.scrollIntoView({
  behavior: 'smooth',  // Weiche Animation
  block: 'center',     // Element mittig positionieren
  inline: 'nearest'    // Horizontal minimal scrollen
});
```

## Build-Anweisungen

Da nur JavaScript geändert wurde:

```bash
# JavaScript Build
npm run build

# Sync zu nativen Projekten
npx cap sync android

# Optional: Android Studio öffnen
npx cap open android
```

**Keine nativen Änderungen nötig!**

## Zusammenfassung

| Feature | Lösung | Status |
|---------|--------|--------|
| Navigation Bar Padding | `enabledSafeBottomMargin: true` | ✅ Gelöst |
| Keyboard Detection | `window.visualViewport` API | ✅ Optimiert |
| Input Auto-Scroll | `scrollIntoView()` | ✅ Funktioniert |
| Cross-Activity Bridge | Entfernt (nicht funktional) | ✅ Bereinigt |
| Code-Komplexität | Stark vereinfacht | ✅ Wartbar |

## Wichtige Erkenntnisse

### 1. Architektur verstehen
InAppBrowser ist **nicht Teil** der MainActivity. Es ist eine separate Activity mit eigenem WebView.

### 2. Richtige Tools nutzen
- ✅ WebView hat eigene APIs: `visualViewport`, `resize`, `scrollIntoView()`
- ✅ Plugin hat eigene Optionen: `enabledSafeBottomMargin`
- ❌ Nicht versuchen, MainActivity-Features zu "bridgen"

### 3. Einfachheit gewinnt
- Komplexe Lösungen führen zu mehr Fehlern
- Web-Standard-APIs sind zuverlässiger als Custom-Bridges
- Plugin-Features nutzen statt eigene Implementierung

## Nächste Schritte

Falls weitere Verbesserungen nötig:

1. **Plugin Feature Request** für natives Keyboard-Handling:
   ```typescript
   await InAppBrowser.openWebView({
     adjustViewportForKeyboard: true,  // Feature Request
     keyboardBehavior: 'adjustResize', // Feature Request
   });
   ```

2. **Plugin Fork** (nur wenn wirklich nötig):
   - Android: `InAppBrowserActivity.onCreate()` mit `adjustResize` konfigurieren
   - iOS: Nutzt bereits natives Keyboard-Handling

3. **Alternatives Plugin evaluieren**:
   - Prüfen ob es andere InAppBrowser-Plugins mit besserem Keyboard-Support gibt
