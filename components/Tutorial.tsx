import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image, ImageSourcePropType, Switch } from 'react-native';
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
  {
    screen: '/(tabs)/apps' as Href<string>,
    text: 'Im Tab mit den drei Punkten (...) können Sie eigene Web Apps hinzufügen, die Sie oft nutzen (z. B. ein Online-Kalender).',
    image: require('../assets/images/tutorial/apps.png'),
  },
];

export const Tutorial: React.FC = () => {
  const { 
    currentStep, 
    setCurrentStep, 
    setShowTutorial,
    showTutorialNextTime,
    setShowTutorialNextTime 
  } = useTutorial();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    const navigateToStep = async () => {
      try {
        await router.push(TUTORIAL_STEPS[currentStep].screen);
      } catch (error) {
        console.error('Error navigating to tutorial step:', error);
      }
    };
    navigateToStep();
  }, [currentStep]);

  const handleNext = async () => {
    try {
      if (currentStep < TUTORIAL_STEPS.length - 1) {
        await setCurrentStep(currentStep + 1);
      } else {
        await AsyncStorage.setItem('hasSeenTutorial', 'true');
        await AsyncStorage.setItem('showTutorialNextTime', showTutorialNextTime.toString());
        await setShowTutorial(false);
      }
    } catch (error) {
      console.error('Error handling next step:', error);
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('hasSeenTutorial', 'true');
      await AsyncStorage.setItem('showTutorialNextTime', showTutorialNextTime.toString());
      await setShowTutorial(false);
    } catch (error) {
      console.error('Error handling skip:', error);
    }
  };

  const handleShowNextTimeChange = (value: boolean) => {
    setShowTutorialNextTime(value);
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
        {TUTORIAL_STEPS[currentStep].image && (
          <View style={styles.imageContainer}>
            <Image
              source={TUTORIAL_STEPS[currentStep].image}
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
          {TUTORIAL_STEPS[currentStep].text}
        </Text>
        
        {isLastStep && (
          <View style={styles.checkboxContainer}>
            <Text
              style={[
                styles.checkboxLabel,
                { color: Colors[colorScheme ?? 'light'].text },
              ]}>
              Tutorial beim nächsten Start anzeigen
            </Text>
            <Switch
              value={showTutorialNextTime}
              onValueChange={handleShowNextTimeChange}
              trackColor={{ 
                false: Colors[colorScheme ?? 'light'].tabIconDefault, 
                true: Colors[colorScheme ?? 'light'].tint 
              }}
              thumbColor={Colors[colorScheme ?? 'light'].background}
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.button,
              { 
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
                borderWidth: colorScheme === 'dark' ? 1 : 0,
                borderColor: Colors[colorScheme ?? 'light'].tint,
              },
            ]}
            onPress={handleSkip}>
            <Text style={[
              styles.buttonText,
              { color: Colors[colorScheme === 'dark' ? 'dark' : 'light'].background }
            ]}>Überspringen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              { 
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
                borderWidth: colorScheme === 'dark' ? 1 : 0,
                borderColor: Colors[colorScheme ?? 'light'].tint,
              },
            ]}
            onPress={handleNext}>
            <Text style={[
              styles.buttonText,
              { color: Colors[colorScheme === 'dark' ? 'dark' : 'light'].background }
            ]}>
              {isLastStep ? 'Fertig' : 'Weiter'}
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
    width: Dimensions.get('window').width * 0.9,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  checkboxLabel: {
    fontSize: 14,
    marginRight: 10,
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
