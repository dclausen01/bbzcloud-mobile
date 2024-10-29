import { WebView } from 'react-native-webview';
import { StyleSheet } from 'react-native';

export default function UntisScreen() {
  return (
    <WebView 
      style={styles.container}
      source={{ uri: 'https://neilo.webuntis.com/WebUntis/?school=bbz-rd-eck#/basic/login' }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
