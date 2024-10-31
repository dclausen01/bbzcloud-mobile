import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useRouter, Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTutorial } from '../context/TutorialContext';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

type TutorialStep = {
  screen: Href<string>;
  text: string;
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    screen: '/(tabs)' as Href<string>,
    text: 'Willkommen bei BBZ Cloud! Hier findest du eine Übersicht aller wichtigen Funktionen.',
  },
  {
    screen: '/(tabs)/schulcloud' as Href<string>,
    text: 'In der schul.cloud können Sie mit Ihren Mitschüler:innen und Lehrer:innen chatten, Videokonferenzen starten und Dateien ablegen.',
  },
  {
    screen: '/(tabs)/moodle' as Href<string>,
    text: 'Auf Moodle finden Sie Kursmaterialien und können Aufgaben bearbeiten und einreichen.',
  },
  {
    screen: '/(tabs)/office' as Href<string>,
    text: 'Mit CryptPad können Sie Dokumente erstellen und gemeinsam mit anderen bearbeiten. Erstellen Sie sich hier als erstes ein eigenes Konto (oben rechts auf "Registrieren" klicken).',
  },
  {
    screen: '/(tabs)/wiki' as Href<string>,
    text: 'Im BBZ Wiki finden Sie hilfreiche Informationen und Anleitungen.',
  },
  {
    screen: '/(tabs)/untis' as Href<string>,
    text: 'In WebUntis sehen Sie Ihren aktuellen Stundenplan und die Abwesenheiten.',
  },
];

export const Tutorial: React.FC = () => {
  const { currentStep, setCurrentStep, setShowTutorial } = useTutorial();
  const router = useRouter();
  const colorScheme = useColorScheme();

  const handleNext = async () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      router.push(TUTORIAL_STEPS[currentStep + 1].screen);
      setCurrentStep(currentStep + 1);
    } else {
      await AsyncStorage.setItem('hasSeenTutorial', 'true');
      setShowTutorial(false);
    }
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.tutorialBox,
          {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            borderColor: Colors[colorScheme ?? 'light'].tint,
          },
        ]}>
        <Text
          style={[
            styles.text,
            { color: Colors[colorScheme ?? 'light'].text },
          ]}>
          {TUTORIAL_STEPS[currentStep].text}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint },
            ]}
            onPress={handleSkip}>
            <Text style={styles.buttonText}>Überspringen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: Colors[colorScheme ?? 'light'].tint },
            ]}
            onPress={handleNext}>
            <Text style={styles.buttonText}>
              {currentStep === TUTORIAL_STEPS.length - 1 ? 'Fertig' : 'Weiter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  tutorialBox: {
    width: Dimensions.get('window').width * 0.8,
    padding: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
