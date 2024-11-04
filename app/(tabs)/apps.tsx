import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useCustomApps, CustomApp } from '../../context/CustomAppsContext';
import { WebViewNavBar } from '../../components/navigation/WebViewNavBar';
import { useOrientation } from '../../hooks/useOrientation';
import { useColorScheme } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';

export default function AppsScreen() {
  const { apps, addApp, deleteApp } = useCustomApps();
  const [selectedApp, setSelectedApp] = useState<CustomApp | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const webViewRef = useRef<WebView>(null);
  const orientation = useOrientation();
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF';
  const textColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';

  const handleAddApp = async () => {
    if (!newTitle.trim() || !newUrl.trim()) {
      Alert.alert('Error', 'Please enter both title and URL');
      return;
    }

    try {
      new URL(newUrl); // Validate URL
      await addApp(newTitle.trim(), newUrl.trim());
      setNewTitle('');
      setNewUrl('');
      setIsAddingNew(false);
    } catch (error) {
      Alert.alert('Error', 'Please enter a valid URL');
    }
  };

  const handleDeleteApp = (app: CustomApp) => {
    Alert.alert(
      'Delete App',
      `Are you sure you want to delete ${app.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteApp(app.id);
            if (selectedApp?.id === app.id) {
              setSelectedApp(null);
            }
          }
        },
      ]
    );
  };

  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const adjustedStatusBarHeight = orientation === 'landscape' ? statusBarHeight / 3 : statusBarHeight;

  if (selectedApp) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        {Platform.OS === 'android' && (
          <View style={{ height: adjustedStatusBarHeight, backgroundColor }} />
        )}
        <View style={[styles.header, { backgroundColor }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedApp(null)}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
            <ThemedText style={styles.backButtonText}>Back to Apps</ThemedText>
          </TouchableOpacity>
        </View>
        <WebViewNavBar
          webViewRef={webViewRef}
          initialUrl={selectedApp.url}
        />
        <WebView
          ref={webViewRef}
          source={{ uri: selectedApp.url }}
          style={styles.webview}
        />
      </View>
    );
  }

  const renderItem = ({ item }: { item: CustomApp }) => (
    <View style={[styles.appItem, { borderColor: textColor }]}>
      <TouchableOpacity
        style={styles.appButton}
        onPress={() => setSelectedApp(item)}
      >
        <Image
          source={{ uri: item.favicon }}
          style={styles.favicon}
          defaultSource={require('../../assets/images/favicon.png')}
        />
        <ThemedText style={styles.appTitle}>{item.title}</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteApp(item)}
      >
        <Ionicons name="remove-circle" size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {Platform.OS === 'android' && (
        <View style={{ height: adjustedStatusBarHeight, backgroundColor }} />
      )}
      <FlatList
        data={apps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListHeaderComponent={
          isAddingNew ? (
            <View style={styles.addForm}>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: textColor }]}
                placeholder="App Title"
                placeholderTextColor={textColor + '80'}
                value={newTitle}
                onChangeText={setNewTitle}
              />
              <TextInput
                style={[styles.input, { color: textColor, borderColor: textColor }]}
                placeholder="App URL"
                placeholderTextColor={textColor + '80'}
                value={newUrl}
                onChangeText={setNewUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
              <View style={styles.addFormButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setIsAddingNew(false);
                    setNewTitle('');
                    setNewUrl('');
                  }}
                >
                  <ThemedText>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleAddApp}
                >
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
      />
      {!isAddingNew && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setIsAddingNew(true)}
        >
          <Ionicons name="add-circle" size={50} color={textColor} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    marginLeft: 10,
    fontSize: 16,
  },
  list: {
    flex: 1,
    padding: 10,
  },
  appItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  appButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  favicon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  appTitle: {
    fontSize: 16,
  },
  deleteButton: {
    padding: 5,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'transparent',
  },
  addForm: {
    padding: 15,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  addFormButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: 'white',
  },
  webview: {
    flex: 1,
  },
});
