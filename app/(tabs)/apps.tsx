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
import { useThemeColor } from '../../hooks/useThemeColor';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function AppsScreen() {
  const orientation = useOrientation();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const invertedTextColor = useThemeColor({}, 'background'); // For text on colored backgrounds

  const { apps, addApp, deleteApp } = useCustomApps();

  const [selectedApp, setSelectedApp] = useState<CustomApp | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleAddApp = async () => {
    if (isSaving) return; // Prevent multiple clicks while saving
    
    if (!newTitle.trim() || !newUrl.trim()) {
      Alert.alert('Fehler', 'Bitte geben Sie einen Titel und eine URL ein');
      return;
    }

    try {
      setIsSaving(true);
      // Ensure URL has protocol
      let urlToAdd = newUrl.trim();
      if (!urlToAdd.startsWith('http://') && !urlToAdd.startsWith('https://')) {
        urlToAdd = 'https://' + urlToAdd;
      }
      
      new URL(urlToAdd); // Validate URL
      await addApp(newTitle.trim(), urlToAdd);
      setNewTitle('');
      setNewUrl('');
      setIsAddingNew(false);
    } catch (error) {
      Alert.alert('Fehler', 'Bitte geben Sie eine gültige URL ein');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteApp = (app: CustomApp) => {
    Alert.alert(
      'App löschen',
      `Möchten Sie "${app.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApp(app.id);
              if (selectedApp?.id === app.id) {
                setSelectedApp(null);
              }
            } catch (error) {
              console.error('Error deleting app:', error);
              Alert.alert('Fehler', 'App konnte nicht gelöscht werden');
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
      <ThemedView style={styles.container}>
        {Platform.OS === 'android' && (
          <View style={{ height: adjustedStatusBarHeight, backgroundColor }} />
        )}
        <View style={[styles.header, { borderBottomColor: textColor + '20' }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedApp(null)}
          >
            <Ionicons name="arrow-back" size={24} color={textColor} />
            <ThemedText style={styles.backButtonText}>Zurück zur Liste</ThemedText>
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
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
          }}
        />
      </ThemedView>
    );
  }

  const renderItem = ({ item }: { item: CustomApp }) => (
    <View style={[styles.appItem, { borderColor: textColor + '30' }]}>
      <TouchableOpacity
        style={styles.appButton}
        onPress={() => setSelectedApp(item)}
      >
        <View style={styles.faviconContainer}>
          <Image
            source={{ uri: item.favicon }}
            style={styles.favicon}
            defaultSource={require('../../assets/images/favicon.png')}
          />
        </View>
        <ThemedText style={styles.appTitle}>{item.title}</ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteApp(item)}
      >
        <Ionicons name="remove-circle" size={24} color="#ff4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      {Platform.OS === 'android' && (
        <View style={{ height: adjustedStatusBarHeight, backgroundColor }} />
      )}
      <FlatList
        data={apps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          !isAddingNew ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                Noch keine Apps hinzugefügt. Tippen Sie auf das + Symbol, um Ihre erste App hinzuzufügen.
              </ThemedText>
            </View>
          ) : null
        }
        ListHeaderComponent={
          isAddingNew ? (
            <View style={styles.addForm}>
              <TextInput
                style={[styles.input, { 
                  color: textColor,
                  borderColor: textColor + '30',
                  backgroundColor: backgroundColor,
                }]}
                placeholder="App Titel"
                placeholderTextColor={textColor + '80'}
                value={newTitle}
                onChangeText={setNewTitle}
              />
              <TextInput
                style={[styles.input, { 
                  color: textColor,
                  borderColor: textColor + '30',
                  backgroundColor: backgroundColor,
                }]}
                placeholder="App URL"
                placeholderTextColor={textColor + '80'}
                value={newUrl}
                onChangeText={setNewUrl}
                keyboardType="url"
                autoCapitalize="none"
              />
              <View style={styles.addFormButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton, { backgroundColor: textColor + '20' }]}
                  onPress={() => {
                    setIsAddingNew(false);
                    setNewTitle('');
                    setNewUrl('');
                  }}
                >
                  <ThemedText>Abbrechen</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton, { backgroundColor: tintColor }]}
                  onPress={handleAddApp}
                  disabled={isSaving}
                >
                  <ThemedText style={[styles.saveButtonText, { color: invertedTextColor }]}>
                    {isSaving ? 'Speichern...' : 'Speichern'}
                  </ThemedText>
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
          <Ionicons name="add-circle" size={50} color={tintColor} />
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 10,
    borderBottomWidth: 1,
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
  faviconContainer: {
    width: 24,
    height: 24,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favicon: {
    width: 20,
    height: 20,
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
    minWidth: 70,
    alignItems: 'center',
  },
  saveButton: {
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonText: {
    // color property is now applied dynamically
  },
  webview: {
    flex: 1,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
  },
});
