import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';

export default function OfficeScreen() {
  return (
    <WebView 
      style={styles.container}
      source={{ uri: 'https://www.microsoft365.com/?auth=2' }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
