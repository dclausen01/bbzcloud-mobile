# BBZ Cloud Mobile App 📱

BBZ Cloud Mobile is a comprehensive mobile application that integrates various educational platforms and services used at BBZ (Berufsbildungszentrum) into a single, unified mobile experience. Built with Expo and React Native, this app provides students and teachers with seamless access to essential educational tools.

## 🌟 Features

- **Unified Platform Access**: Single app access to multiple educational services:
  - 📚 Schul.cloud - Messaging and collaboration platform with audio/video call support
  - 📅 Untis - Timetable management
  - 📝 Moodle - Learning management system
  - 📖 Wiki - Knowledge base
  - 💼 Office - Document management and editing
  
- **Enhanced WebView Integration**:
  - Optimized browser compatibility for modern features
  - Support for audio and video calls
  - Responsive design across different screen sizes
  - Custom navigation with gesture support

- **Native Mobile Features**:
  - File-based routing for smooth navigation
  - Dark mode support
  - Adaptive layout for different orientations
  - Pull-to-refresh functionality

## 🚀 Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- npm or yarn
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/bbzcloud-mobile.git
   cd bbzcloud-mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

### Development Options

The app can be run in several ways:
- 📱 [Expo Go](https://expo.dev/go) - Quick testing and development
- 🛠️ [Development Build](https://docs.expo.dev/develop/development-builds/introduction/) - Full feature testing
- 📱 [Android Emulator](https://docs.expo.dev/workflow/android-studio-emulator/) - Android development
- 📱 [iOS Simulator](https://docs.expo.dev/workflow/ios-simulator/) - iOS development

## 🏗️ Project Structure

```
bbzcloud-mobile/
├── app/                    # Main application code
│   ├── (tabs)/            # Tab-based navigation screens
│   └── _layout.tsx        # Root layout component
├── components/            # Reusable components
├── constants/             # App constants and configurations
├── context/              # React Context providers
├── hooks/                # Custom React hooks
└── utils/                # Utility functions
```

## 🛠️ Technologies

- [Expo](https://expo.dev/) - React Native development framework
- [React Native](https://reactnative.dev/) - Mobile app framework
- [React Native WebView](https://github.com/react-native-webview/react-native-webview) - Web content integration
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based routing

## 📝 Development Notes

- The app uses enhanced WebView configurations to ensure compatibility with modern web features
- Custom user agent strings are implemented for optimal platform compatibility
- WebRTC and media device capabilities are supported for audio/video calls
- File-based routing is used for navigation (see the `app` directory)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
