import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';

export default function NextcloudScreen() {
  return (
    <WebView 
      style={styles.container}
      source={{ uri: 'https://app.schul.cloud' }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
