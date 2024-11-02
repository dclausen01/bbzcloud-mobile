import { StyleSheet, Image, View, Pressable } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrientation } from '../../hooks/useOrientation';
import { useTutorial } from '../../context/TutorialContext';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Colors } from '../../constants/Colors';

export default function HomeScreen() {
  const orientation = useOrientation();
  const { setShowTutorial, setCurrentStep } = useTutorial();
  const colorScheme = useColorScheme() ?? 'light';

  const handleRestartTutorial = () => {
    setCurrentStep(0);
    setShowTutorial(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <Pressable
          onPress={handleRestartTutorial}
          style={({ pressed }) => [
            styles.tutorialButton,
            { opacity: pressed ? 0.7 : 1 }
          ]}
        >
          <Ionicons
            name="refresh-circle"
            size={32}
            color={Colors[colorScheme].tint}
          />
          <ThemedText style={styles.buttonText}>Tutorial</ThemedText>
        </Pressable>
        <View style={[
          styles.contentContainer,
          orientation === 'landscape' ? styles.landscapeContent : null
        ]}>
          <Image 
            source={require('../../assets/images/icon.png')}
            style={[
              styles.logo,
              orientation === 'landscape' ? styles.landscapeLogo : null
            ]}
          />
          <View style={styles.textContainer}>
            <ThemedText style={styles.text}>BBZ Cloud</ThemedText>
          </View>
          <View style={styles.textContainer}>
            <ThemedText style={styles.text}>Die All-in-One App</ThemedText>
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    marginTop: -50,
  },
  landscapeContent: {
    flexDirection: 'row',
    marginTop: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  landscapeLogo: {
    width: 100,
    height: 100,
    marginBottom: 0,
    marginRight: 20,
  },
  textContainer: {
    padding: 10,
    marginTop: 10,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
    textAlignVertical: 'center',
    includeFontPadding: true,
    padding: 5,
  },
  tutorialButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    zIndex: 1,
  },
  buttonText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
  },
});
