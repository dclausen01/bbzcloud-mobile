# BBZCloud Mobile

Die mobile App für die BBZ Cloud - eine All-in-One-Plattform für Unterricht und Zusammenarbeit am Berufsbildungszentrum Radolfzell-Stockach.

<div align="center">
  <img src="public/favicon.png" alt="BBZCloud Logo" width="120" height="120">
</div>

## 📱 Über das Projekt

BBZCloud Mobile ist die mobile Adaption der Desktop-Electron-App für iOS und Android. Die App bietet schnellen Zugriff auf alle wichtigen Schulplattformen und -dienste des BBZ in einer einheitlichen, benutzerfreundlichen Oberfläche.

### ✨ Features

- 🎨 **11 farbige App-Kacheln** für alle Schulplattformen
- 👥 **Rollenbasierte Filterung** (Lehrkraft/Schüler:in)
- 🔐 **Native Password-Manager Integration** (iOS Keychain, Android Autofill)
- 🌐 **InAppBrowser** mit Autofill-Support
- 🔍 **Suche** über alle Apps
- ⭐ **Favoriten-System** mit visuellen Indikatoren
- 🌓 **Dark Mode** mit System-Sync
- 📱 **Responsive Design** für alle Bildschirmgrößen
- ♻️ **Pull-to-Refresh** für Updates
- 🔒 **Sichere Datenspeicherung** mit Capacitor

## 🚀 Verfügbare Apps

Die App bietet direkten Zugriff auf folgende Plattformen:

| App                  | Beschreibung                  | Verfügbar für |
| -------------------- | ----------------------------- | ------------- |
| 🌩️ **schul.cloud**   | Messenger & Dateiablage       | Alle          |
| 📚 **Moodle**        | Lernplattform                 | Alle          |
| 🎥 **BigBlueButton** | Videokonferenzen              | Alle          |
| 📧 **Outlook**       | E-Mail & Kalender             | Alle          |
| 📄 **Office**        | Online-Dokumentenbearbeitung  | Alle          |
| 🔒 **CryptPad**      | Verschlüsselte Zusammenarbeit | Alle          |
| 🃏 **TaskCards**     | Pinnwände & Boards            | Lehrkräfte    |
| 📅 **WebUntis**      | Stundenplan & Vertretungsplan | Alle          |
| 🎓 **Fobizz**        | Fortbildungen                 | Lehrkräfte    |
| 🏫 **Intranet**      | Schulinformationen            | Alle          |
| 📋 **Anträge**       | Formulare & Anträge           | Lehrkräfte    |

## 🔐 Passwortverwaltung

### Native Password-Manager (Empfohlen)

Die App nutzt die **nativen Password-Manager** Ihres Geräts für maximale Sicherheit und Benutzerfreundlichkeit:

#### iOS - iCloud Keychain

- Automatisches Speichern beim ersten Login
- Biometrische Authentifizierung (Face ID / Touch ID)
- Synchronisation über alle Apple-Geräte
- Kompatibel mit 1Password, LastPass, Bitwarden

#### Android - Google Password Manager

- Automatisches Speichern beim ersten Login
- Fingerabdruck-Authentifizierung
- Synchronisation über alle Android-Geräte
- Kompatibel mit 1Password, LastPass, Bitwarden, Samsung Pass

### So funktioniert's:

1. **Erstes Login:**

   - Öffnen Sie eine App (z.B. Moodle)
   - Geben Sie Ihre Anmeldedaten ein
   - Ihr Gerät fragt: "Passwort speichern?"
   - Bestätigen Sie → Credentials werden sicher gespeichert

2. **Zukünftige Logins:**
   - Öffnen Sie die App erneut
   - Tippen Sie auf das Login-Feld
   - Ihr Gerät bietet gespeicherte Credentials an
   - Ein Tap → Automatisch eingeloggt!

### In-App Credential-Speicherung

Zusätzlich können Sie in der App Ihre Haupt-E-Mail und optionale Zusatz-Credentials speichern:

- **E-Mail-Adresse:** Für Rollenerkennung (Lehrkraft vs. Schüler:in)
- **BigBlueButton Passwort:** Falls abweichend vom Hauptpasswort
- **WebUntis Credentials:** Falls separate Anmeldung benötigt

Diese werden verschlüsselt auf Ihrem Gerät gespeichert (Capacitor Secure Storage).

## 🛠️ Technologie-Stack

- **Framework:** [Ionic React](https://ionicframework.com/docs/react) mit TypeScript
- **UI Components:** Ionic Framework + Chakra UI
- **State Management:** React Context API
- **Routing:** React Router
- **Storage:**
  - Capacitor Secure Storage (Credentials)
  - Capacitor Preferences (Settings)
  - SQLite (App-Daten)
- **Browser:** Capacitor Browser (InAppBrowser)
- **Build:** Vite
- **Mobile:** Capacitor 7

## 📦 Installation & Setup

### Voraussetzungen

- Node.js 18 oder höher
- npm oder yarn
- Für iOS: Xcode (nur auf macOS)
- Für Android: Android Studio

### 1. Repository klonen

```bash
git clone https://github.com/dclausen01/bbzcloud-mobile.git
cd bbzcloud-mobile
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Im Browser testen

```bash
npm run dev
```

Öffnet http://localhost:5173

### 4. Für Android bauen

```bash
# Build erstellen
npm run build

# Native Plattform synchronisieren
npx cap sync android

# Android Studio öffnen
npx cap open android
```

In Android Studio: "Run" klicken, um auf einem Gerät/Emulator zu testen.

### 5. Für iOS bauen (nur macOS)

```bash
# Build erstellen
npm run build

# Native Plattform synchronisieren
npx cap sync ios

# Xcode öffnen
npx cap open ios
```

In Xcode: Gerät auswählen und "Run" klicken.

## 🏗️ Projekt-Struktur

```
bbzcloud-mobile/
├── src/
│   ├── components/          # Wiederverwendbare UI-Komponenten
│   │   ├── AppCard.tsx      # Einzelne App-Kachel
│   │   ├── AppGrid.tsx      # Grid-Layout für Apps
│   │   └── WelcomeModal.tsx # Onboarding-Modal
│   ├── contexts/            # React Context Provider
│   │   ├── AuthContext.tsx  # Authentifizierung
│   │   └── SettingsContext.tsx # App-Einstellungen
│   ├── pages/               # App-Seiten
│   │   ├── Home.tsx         # Hauptseite mit App-Grid
│   │   └── Settings.tsx     # Einstellungsseite
│   ├── services/            # Business Logic
│   │   ├── BrowserService.ts    # InAppBrowser Management
│   │   ├── CredentialService.ts # Credential Storage
│   │   └── DatabaseService.ts   # SQLite Operations
│   ├── types/               # TypeScript Definitionen
│   │   └── index.ts
│   ├── utils/               # Hilfsfunktionen
│   │   └── constants.ts     # App-Konfiguration
│   ├── theme/               # Ionic Theme
│   │   └── variables.css
│   ├── App.tsx              # Haupt-App-Komponente
│   └── main.tsx             # Entry Point
├── android/                 # Android Native Project
├── ios/                     # iOS Native Project
├── public/                  # Statische Assets
├── capacitor.config.ts      # Capacitor Konfiguration
├── vite.config.ts          # Vite Build-Konfiguration
└── package.json            # Dependencies
```

## 🔧 Konfiguration

### App-URLs anpassen

Alle App-URLs und Konfigurationen finden Sie in:

```typescript
src / utils / constants.ts;
```

Hier können Sie:

- App-URLs ändern
- Farben anpassen
- Icons ändern
- Neue Apps hinzufügen
- Rollen-basierte Zugriffsrechte konfigurieren

### Eigene Schule hinzufügen

1. In `constants.ts` die E-Mail-Domains anpassen:

```typescript
export const TEACHER_EMAIL_SUFFIX = "@ihre-schule.de";
export const STUDENT_EMAIL_SUFFIX = "@sus.ihre-schule.de";
```

2. App-URLs anpassen:

```typescript
export const NAVIGATION_APPS = {
  schulcloud: {
    id: "schulcloud",
    title: "schul.cloud",
    url: "https://ihre-schule.schul.cloud",
    // ...
  },
  // ...
};
```

## 👥 Rollen-System

Die App erkennt automatisch die Benutzerrolle basierend auf der E-Mail-Domain:

### Lehrkräfte

- E-Mail endet auf `@bbz-rd-eck.de`
- Sehen alle 11 Apps
- Voller Zugriff auf alle Funktionen

### Schüler:innen

- E-Mail endet auf `@sus.bbz-rd-eck.de` oder andere
- Sehen 6 Apps (gefiltert)
- Eingeschränkter Zugriff (keine Verwaltungs-Apps)

### Filtern nach Rolle

In `constants.ts` können Apps mit `teacherOnly: true` markiert werden:

```typescript
{
  id: 'antraege',
  title: 'Anträge',
  teacherOnly: true, // Nur für Lehrkräfte
  // ...
}
```

## 🧪 Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests (Cypress)

```bash
npm run test:e2e
```

## 📝 Entwicklung

### Verfügbare Scripts

```bash
# Development Server
npm run dev

# Production Build
npm run build

# TypeScript Type Check
npm run type-check

# Linting
npm run lint

# Tests
npm run test

# Capacitor Commands
npx cap sync           # Sync mit Native Projects
npx cap open android   # Android Studio öffnen
npx cap open ios       # Xcode öffnen
```

### Code-Struktur-Konventionen

- **TypeScript:** Strikte Typisierung
- **React Hooks:** Funktionale Komponenten
- **Context API:** Für globalen State
- **Services:** Singleton-Pattern für Business Logic
- **CSS:** Modular, ein CSS-File pro Component

## 🔒 Sicherheit

### Datenschutz

- ✅ Alle Credentials werden lokal gespeichert
- ✅ Keine Server-Kommunikation für Authentifizierung
- ✅ Capacitor Secure Storage (verschlüsselt)
- ✅ Native Password-Manager Integration
- ✅ DSGVO-konform

### Best Practices

- Biometrische Authentifizierung unterstützt
- Automatisches Logout nach Inaktivität (optional)
- Sichere Kommunikation (HTTPS only)
- Regelmäßige Dependency-Updates

## 📱 App Store Deployment

### iOS App Store

1. Apple Developer Account erforderlich
2. In Xcode: Signing & Capabilities konfigurieren
3. Archive erstellen
4. Über App Store Connect hochladen

Siehe: [Ionic iOS Deployment Guide](https://capacitorjs.com/docs/ios)

### Google Play Store

1. Google Play Developer Account erforderlich
2. Signiertes APK/AAB erstellen
3. Über Google Play Console hochladen

Siehe: [Ionic Android Deployment Guide](https://capacitorjs.com/docs/android)

## 🤝 Beitragen

Beiträge sind willkommen! Bitte:

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist für das BBZ Radolfzell-Stockach entwickelt.

## 🙏 Danksagungen

- [Ionic Framework](https://ionicframework.com/) - UI Components
- [Capacitor](https://capacitorjs.com/) - Native Bridge
- [React](https://react.dev/) - Frontend Framework
- [TypeScript](https://www.typescriptlang.org/) - Type Safety

## 📞 Support

Bei Fragen oder Problemen:

- 📧 E-Mail: support@bbz-rd-eck.de
- 🐛 Issues: [GitHub Issues](https://github.com/dclausen01/bbzcloud-mobile/issues)

---

<div align="center">
Made with ❤️ for BBZ Radolfzell-Stockach
</div>
