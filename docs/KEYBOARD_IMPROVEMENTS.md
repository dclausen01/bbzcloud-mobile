# Keyboard-Verbesserungen für Android

Dokumentation der implementierten Verbesserungen für das Keyboard-Handling in der BBZCloud Mobile App.

## Übersicht der Änderungen

### 1. AndroidManifest.xml
**Datei:** `android/app/src/main/AndroidManifest.xml`

**Änderung:**
```xml
android:windowSoftInputMode="adjustPan"
```

**Vorher:** `adjustResize`
**Nachher:** `adjustPan`

**Vorteil:** Bei `adjustPan` wird nur der Content verschoben, nicht die gesamte View. Dies ist besser für moderne Apps mit fixen UI-Elementen wie FABs (Floating Action Buttons) und Bottom Navigation.

---

### 2. Capacitor Konfiguration
**Datei:** `capacitor.config.ts`

**Hinzugefügt:**
```typescript
plugins: {
  Keyboard: {
    resize: 'native',
    style: 'dark',
    resizeOnFullScreen: true
  }
}
```

**Funktionen:**
- `resize: 'native'`: Nutzt natives Android Keyboard-Resize-Verhalten
- `style: 'dark'`: Dunkle Tastatur (passt zum Dark Mode)
- `resizeOnFullScreen: true`: Funktioniert auch im Fullscreen-Modus

---

### 3. Android Studio Pfad
**Neue Dateien:**
- `.env` (gitignored)
- `.env.example` (als Vorlage im Repository)

**Inhalt:**
```bash
CAPACITOR_ANDROID_STUDIO_PATH=/opt/android-studio/bin/studio.sh
```

**Vorteil:** Capacitor CLI kann jetzt Android Studio direkt öffnen mit `npx cap open android`

---

### 4. Keyboard Utilities
**Neue Datei:** `src/utils/keyboardUtils.ts`

**Funktionen:**
- `hideKeyboard()`: Versteckt die Tastatur auf nativen Plattformen
- `showKeyboard()`: Zeigt die Tastatur auf nativen Plattformen
- `setupKeyboardListeners()`: Richtet Event-Listener für Keyboard-Events ein
- `removeKeyboardListeners()`: Entfernt alle Keyboard-Listener
- `setKeyboardStyle()`: Setzt das Tastatur-Theme (hell/dunkel)
- `setKeyboardResize()`: Konfiguriert das Resize-Verhalten
- `isKeyboardVisible()`: Prüft ob die Tastatur aktuell sichtbar ist

**Event-Listener:**
- `keyboardWillShow`: Wird ausgelöst bevor die Tastatur erscheint
- `keyboardWillHide`: Wird ausgelöst bevor die Tastatur verschwindet
- `keyboardDidShow`: Wird ausgelöst nachdem die Tastatur erschienen ist
- `keyboardDidHide`: Wird ausgelöst nachdem die Tastatur verschwunden ist

---

### 5. React-Komponenten Updates

#### Todos.tsx
**Änderungen:**
1. Import von `hideKeyboard` hinzugefügt
2. `updateTodo()` ist nun async und ruft `hideKeyboard()` auf
3. `IonInput` beim Bearbeiten hat jetzt `enterkeyhint="done"`
4. `IonAlert` Inputs haben `enterkeyhint="done"` Attribut

**Verbesserungen:**
- Tastatur schließt automatisch nach Enter/Blur bei Todo-Bearbeitung
- Android zeigt "Fertig"-Button statt Enter-Taste
- Bessere User Experience bei Texteingabe

#### WelcomeModal.tsx
**Änderungen:**
1. Import von `hideKeyboard` hinzugefügt
2. `handleSubmit()` ruft `hideKeyboard()` auf
3. Email-Input hat `enterkeyhint="go"` und `onKeyPress` Handler

**Verbesserungen:**
- Tastatur schließt automatisch beim Absenden
- Enter-Taste löst Submit aus
- Android zeigt "Los"-Button statt Enter-Taste

#### Home.tsx
**Änderungen:**
1. `IonSearchbar` hat jetzt `enterkeyhint="search"`

**Verbesserungen:**
- Android zeigt Lupe-Symbol statt Enter-Taste
- Intuitivere Suchfunktion

---

## Technische Details

### enterkeyhint Attribut
Das `enterkeyhint` Attribut teilt dem Betriebssystem mit, welche Aktion der Benutzer ausführen möchte:

- `done`: Schließt die Tastatur (z.B. bei Formularen)
- `go`: Führt eine Aktion aus (z.B. Login)
- `next`: Springt zum nächsten Feld
- `search`: Startet eine Suche
- `send`: Sendet eine Nachricht

### Keyboard Plugin
Das @capacitor/keyboard Plugin (v7.0.3) bietet:
- Plattformübergreifende API für Keyboard-Kontrolle
- Event-Listener für Keyboard-Zustandsänderungen
- Konfigurierbare Resize-Modi
- Theme-Unterstützung (hell/dunkel)

---

## Best Practices

### 1. Tastatur immer schließen nach Aktionen
```typescript
const handleSubmit = async () => {
  await hideKeyboard();
  // ... weitere Logik
};
```

### 2. enterkeyhint verwenden
```typescript
<IonInput
  enterkeyhint="done"
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }}
/>
```

### 3. Plattform-Check für native Features
```typescript
import { Capacitor } from '@capacitor/core';

if (Capacitor.isNativePlatform()) {
  // Nur auf nativen Plattformen ausführen
  await Keyboard.hide();
}
```

---

## Testing

### Auf Android testen:
1. Build erstellen: `npm run build`
2. Sync durchführen: `npx cap sync android`
3. App öffnen: `npx cap open android`
4. In Android Studio auf Gerät/Emulator deployen

### Was zu testen ist:
- [ ] Tastatur schließt sich nach Enter in Todo-Edit
- [ ] Tastatur schließt sich nach Submit im WelcomeModal
- [ ] "Fertig"-Button erscheint in Todos
- [ ] "Los"-Button erscheint im WelcomeModal
- [ ] Lupe-Symbol erscheint in der Suche
- [ ] FAB (Floating Action Button) wird nicht verdeckt
- [ ] Layout bleibt stabil beim Öffnen/Schließen der Tastatur

---

## Weitere Optimierungsmöglichkeiten

### 1. App.tsx Integration
Keyboard-Listener könnten in der Haupt-App initialisiert werden:

```typescript
import { setupKeyboardListeners, removeKeyboardListeners } from './utils/keyboardUtils';

useEffect(() => {
  setupKeyboardListeners();
  return () => {
    removeKeyboardListeners();
  };
}, []);
```

### 2. CSS-Anpassungen für Keyboard
```css
body.keyboard-open {
  /* Spezielle Styles wenn Tastatur offen ist */
}
```

### 3. Keyboard-Höhe berücksichtigen
```typescript
Keyboard.addListener('keyboardWillShow', (info) => {
  const height = info.keyboardHeight;
  // Layout anpassen basierend auf Keyboard-Höhe
});
```

---

## Referenzen

- [Capacitor Keyboard Plugin Docs](https://capacitorjs.com/docs/apis/keyboard)
- [HTML enterkeyhint Attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint)
- [Android windowSoftInputMode](https://developer.android.com/guide/topics/manifest/activity-element#wsoft)
