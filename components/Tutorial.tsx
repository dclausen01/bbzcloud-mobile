import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { useRouter, Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTutorial } from '../context/TutorialContext';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

type TutorialStep = {
  screen: Href<string>;
  text: string;
  image?: ImageSourcePropType;
};

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    screen: '/(tabs)' as Href<string>,
    text: 'Willkommen bei BBZ Cloud! In diesem Tutorial finden Sie eine Übersicht aller wichtigen Funktionen.',
    image: require('../assets/images/tutorial/home.png'),
  },
  {
    screen: '/(tabs)/schulcloud' as Href<string>,
    text: 'In der schul.cloud können Sie mit Ihren Mitschüler:innen und Lehrer:innen chatten, Videokonferenzen starten und Dateien ablegen.',
    image: require('../assets/images/tutorial/schulcloud.png'),
  },
  {
    screen: '/(tabs)/moodle' as Href<string>,
    text: 'Auf Moodle finden Sie Kursmaterialien und können Aufgaben bearbeiten und einreichen.',
    image: require('../assets/images/tutorial/moodle.png'),
  },
  {
    screen: '/(tabs)/office' as Href<string>,
    text: 'Mit CryptPad können Sie Dokumente erstellen und gemeinsam mit anderen bearbeiten. Erstellen Sie sich hier als erstes ein eigenes Konto (oben rechts auf "Registrieren" klicken).',
    image: require('../assets/images/tutorial/cryptpad.png'),
  },
  {
    screen: '/(tabs)/wiki' as Href<string>,
    text: 'Im BBZ Wiki finden Sie hilfreiche Informationen und Anleitungen.',
    image: require('../assets/images/tutorial/wiki.png'),
  },
  {
    screen: '/(tabs)/untis' as Href<string>,
    text: 'In WebUntis sehen Sie Ihren aktuellen Stundenplan und die Abwesenheiten.',
    image: require('../assets/images/tutorial/untis.png'),
  },
];

export const Tutorial: React.FC = () => {
  const { currentStep, setCurrentStep, setShowTutorial } = useTutorial();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

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

  const currentTutorialStep = TUTORIAL_STEPS[currentStep];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.tutorialBox,
          {
            backgroundColor: Colors[colorScheme ?? 'light'].background,
            borderColor: Colors[colorScheme ?? 'light'].tint,
            width: windowWidth * 0.9,
            maxHeight: windowHeight * 0.8,
          },
        ]}>
        {currentTutorialStep.image && (
          <View style={styles.imageContainer}>
            <Image
              source={currentTutorialStep.image}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}
        <Text
          style={[
            styles.text,
            { color: Colors[colorScheme ?? 'light'].text },
          ]}>
          {currentTutorialStep.text}
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
        <View style={styles.progressContainer}>
          {TUTORIAL_STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    index === currentStep
                      ? Colors[colorScheme ?? 'light'].tint
                      : Colors[colorScheme ?? 'light'].tabIconDefault,
                },
              ]}
            />
          ))}
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
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
