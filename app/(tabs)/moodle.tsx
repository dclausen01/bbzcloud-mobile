import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';

export default function MoodleScreen() {
  return (
    <WebView 
      style={styles.container}
      source={{ uri: 'https://portal.bbz-rd-eck.com/' }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
