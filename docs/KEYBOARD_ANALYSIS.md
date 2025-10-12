# Keyboard Problem - Detaillierte Analyse

## Zusammenfassung der Probleme

1. **Verzögertes Aktivieren**: Die Keyboard-Anpassung funktioniert nicht beim ersten Laden, sondern erst nach mindestens einer Display-Rotation
2. **Falsche Höhenberechnung**: Der Offset ist größer als die tatsächliche Keyboard-Höhe und wächst bei mehreren Rotationen
3. **Weißer Rand rechts**: Es entsteht ein kleiner weißer Streifen am rechten Bildschirmrand

## Technische Analyse

### Aktueller Aufbau

Die Keyboard-Lösung besteht aus mehreren Komponenten:

1. **AndroidManifest.xml**: `android:windowSoftInputMode="adjustPan"`
2. **BrowserService.ts**: `enabledSafeBottomMargin: true` (20px für Navigation Bar)
3. **InjectionScripts.ts**: GLOBAL_INJECTION v6.0 mit "aggressiver Viewport-Manipulation"

### Root Causes der Probleme

#### Problem 1: Verzögertes Aktivieren

**Code-Analyse** (InjectionScripts.ts, Zeile 167-215):

```javascript
function setupKeyboardDetection() {
  if (hasVisualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - viewportHeight;
      
      if (heightDiff > CONFIG.KEYBOARD_MIN_HEIGHT) {
        // Keyboard ist sichtbar
        if (!isKeyboardVisible) {
          isKeyboardVisible = true;
          keyboardHeight = heightDiff;
          applyKeyboardSpace();
        }
      }
    });
  }
}
```

**Problem**: 
- Beim ersten Laden der Seite gibt es **keinen `resize` Event**, da sich die Viewport-Größe nicht ändert
- `isKeyboardVisible` bleibt `false` und `keyboardHeight` ist `0`
- Erst bei einer **Rotation** wird der Event ausgelöst und die Werte korrekt initialisiert
- Die Keyboard-Detection reagiert nur auf **Änderungen**, nicht auf den **initialen Zustand**

**Beweis**:
- Input-Focus Events (Zeile 382-425) rufen `scrollInputIntoView()` auf
- Aber `applyKeyboardSpace()` wird nur aufgerufen wenn `isKeyboardVisible` von `false` zu `true` wechselt
- Beim ersten Mal gibt es keinen Wechsel, da kein `resize` Event stattgefunden hat

#### Problem 2: Falsche Höhenberechnung

**Code-Analyse** (InjectionScripts.ts, Zeile 234-274):

```javascript
function applyKeyboardSpace() {
  // Zeile 249-258: Setze feste Höhen
  const availableHeight = window.visualViewport ? 
    window.visualViewport.height : 
    window.innerHeight - keyboardHeight;
  
  document.documentElement.style.height = availableHeight + 'px';
  document.body.style.height = availableHeight + 'px';
  
  // Zeile 265: ZUSÄTZLICHES paddingBottom
  document.body.style.paddingBottom = (keyboardHeight + CONFIG.SCROLL_OFFSET) + 'px';
}
```

**Hauptproblem - DOPPELTE REDUKTION**:
1. Die Höhe von `html` und `body` wird auf `availableHeight` reduziert (bereits ohne Keyboard-Raum)
2. **ZUSÄTZLICH** wird `paddingBottom` von `keyboardHeight + 100px` hinzugefügt
3. Das bedeutet: Der Content-Bereich wird **ZWEIMAL** um die Keyboard-Höhe reduziert

**Beispielrechnung**:
```
Initial:
- window.innerHeight = 800px
- Keyboard erscheint mit 400px Höhe
- visualViewport.height = 400px

Falsche Berechnung:
- availableHeight = 400px ✅ (korrekt)
- body.height = 400px ✅ (sollte passen)
- body.paddingBottom = 400 + 100 = 500px ❌ (FEHLER!)

Resultat:
- Sichtbarer Bereich = 400px (body height)
- Aber paddingBottom von 500px schiebt Content 500px nach oben
- Effektiv: Content-Bereich = 400 - 500 = -100px (zu viel!)
```

**Zweites Problem - KUMULATIVE FEHLER bei Rotation**:

```javascript
function applyKeyboardSpace() {
  // Zeile 235-244: Styles speichern
  if (!originalStyles.has('html')) {
    originalStyles.set('html', { /* ... */ });
  }
  if (!originalStyles.has('body')) {
    originalStyles.set('body', { /* ... */ });
  }
}

function restoreOriginalLayout() {
  // Zeile 285: Styles wiederherstellen
  const htmlStyles = originalStyles.get('html');
  document.documentElement.style.height = htmlStyles.height;
  // ...
}
```

**Problem**:
- `originalStyles` wird **NUR EINMAL** beim ersten Keyboard-Anzeigen befüllt
- Bei Rotation wird `restoreOriginalLayout()` aufgerufen
- Aber die "original" Styles sind bereits die **modifizierten** Styles vom ersten Mal
- Nach jeder Rotation werden die **falschen Werte** als "Original" wiederhergestellt
- Die Map wird **NIE GELEERT**, sodass sich Fehler akkumulieren

**Drittes Problem - INKONSISTENTE HÖHENBERECHNUNG**:

```javascript
// Zeile 249: Bei visualViewport
const availableHeight = window.visualViewport.height; // z.B. 400px

// VS

// Zeile 251: Bei window.resize fallback
const availableHeight = window.innerHeight - keyboardHeight; // z.B. 800 - 400 = 400px
```

Bei `window.visualViewport` wird direkt die viewport-Höhe verwendet.
Beim Fallback wird `window.innerHeight - keyboardHeight` verwendet.
Diese sollten gleich sein, aber es gibt subtile Unterschiede (z.B. wenn Navigation Bar sichtbar ist).

#### Problem 3: Weißer Rand rechts

**Code-Analyse** (InjectionScripts.ts, Zeile 27-74):

```css
/* Zeile 34 */
html {
  height: 100% !important;
  position: relative !important;
}

body {
  position: relative !important;
  overflow-y: auto !important;
}

/* Zeile 255 im JavaScript */
document.documentElement.style.overflow = 'hidden';
```

**Problem**:
- Im CSS: `body` hat `overflow-y: auto`
- Im JavaScript: `html` wird auf `overflow: hidden` gesetzt
- Dies kann zu horizontalem Scrolling führen, wenn die Breite nicht exakt stimmt
- Bei festen Pixel-Höhen (`height: 400px`) kann das Layout brechen

**Zusätzlicher Faktor - Viewport Manipulation**:

```javascript
// Zeile 141-154
function setupViewport() {
  viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover';
}
```

Die Viewport-Manipulation könnte zu Rendering-Inkonsistenzen führen, besonders bei `viewport-fit=cover`.

### Weitere Probleme im Code

#### 1. Race Conditions

```javascript
// Zeile 382: Focus Event
document.addEventListener('focusin', (e) => {
  focusedInput = target;
  scrollInputIntoView(target, true);  // Sofort
  setTimeout(() => scrollInputIntoView(target, true), 100);   // Nach 100ms
  setTimeout(() => scrollInputIntoView(target, false), 300);  // Nach 300ms
  setTimeout(() => scrollInputIntoView(target, false), 500);  // Nach 500ms
  setTimeout(() => scrollInputIntoView(target, false), 600);  // Nach 600ms
});
```

**Problem**: 5 verzögerte Scroll-Aufrufe führen zu:
- Mehrfachem Layout-Reflow (Performance-Problem)
- Ruckelndem Scrolling
- Konflikt mit `applyKeyboardSpace()` das ebenfalls scrollt

#### 2. Zu aggressive Style-Overrides

```css
/* Zeile 48-51 */
body.bbz-keyboard-visible * {
  position: static !important;  /* ALLE Elemente! */
}
```

**Problem**: Dies bricht **ALLE** `position: fixed` und `position: absolute` Elemente im gesamten DOM:
- Navigation headers
- Modal dialogs
- Dropdown menus
- Tooltips
- Floating buttons

#### 3. Unnötige Komplexität

Der Code hat:
- 600+ Zeilen JavaScript
- 5 verschiedene Scroll-Methoden
- Mehrere überlappende CSS-Regeln
- Debug-Logs überall (Performance-Impact)

## Empfohlene Lösungsansätze

### Option 1: Minimale Lösung (EMPFOHLEN)

**Grundidee**: Statt die gesamte Page-Höhe zu manipulieren, nur bottom-padding hinzufügen.

**Vorteile**:
- Einfacher
- Weniger Seiteneffekte
- Funktioniert mit nativen Browser-Scroll-Mechanismen

**Ansatz**:
```javascript
// Keyboard Detection
window.visualViewport.addEventListener('resize', () => {
  const keyboardHeight = window.innerHeight - window.visualViewport.height;
  if (keyboardHeight > 150) {
    document.body.style.paddingBottom = keyboardHeight + 'px';
  } else {
    document.body.style.paddingBottom = '';
  }
});

// Input Focus
input.addEventListener('focus', () => {
  setTimeout(() => {
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 300);
});
```

### Option 2: Container-basierte Lösung

**Grundidee**: Hauptcontainer identifizieren und dessen Höhe anpassen statt html/body.

**Vorteile**:
- Betrifft nur Content-Bereich
- Html/body bleiben unverändert
- Weniger globale Seiteneffekte

### Option 3: CSS-only Lösung

**Grundidee**: Moderne CSS Features nutzen.

```css
body {
  padding-bottom: env(keyboard-inset-height, 0px);
  /* Fallback für Browser ohne env() */
  padding-bottom: var(--keyboard-height, 0px);
}

input:focus {
  scroll-margin-bottom: 200px;
}
```

## Zusammenfassung

Die aktuelle "aggressive" Lösung v6.0 hat fundamentale Probleme:

1. **Initialisierung**: Keine initiale Messung, nur reaktiv auf Events
2. **Doppelte Reduktion**: Sowohl height als auch paddingBottom werden angewendet
3. **State Management**: originalStyles werden nie korrekt zurückgesetzt
4. **Überkomplexität**: 600+ Zeilen Code mit zu vielen Features

**Empfehlung**: Vereinfachen auf **minimal funktionierende Lösung** (Option 1) mit:
- Nur `paddingBottom` auf body
- Ein einzelner verzögerter `scrollIntoView()` Aufruf
- Keine html-Höhen-Manipulation
- Keine position: static Overrides
- Sauberes State Management

Dies würde alle drei Probleme lösen:
1. ✅ Funktioniert sofort (keine Rotation nötig)
2. ✅ Korrekte Höhenberechnung (nur paddingBottom, keine Dopplung)
3. ✅ Kein weißer Rand (kein overflow: hidden auf html)
