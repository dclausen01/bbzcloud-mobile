/**
 * BBZCloud Mobile - Settings Page
 * 
 * Settings and configuration page
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonButton,
  IonNote,
  useIonToast,
  IonListHeader,
  IonModal,
  IonInput
} from '@ionic/react';
import { moonOutline, personOutline, logOutOutline, informationCircleOutline, keyOutline, createOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { APP_CONFIG, SUCCESS_MESSAGES } from '../utils/constants';
import './Settings.css';

const Settings: React.FC = () => {
  const { user, logout, saveCredentials, credentials } = useAuth();
  const { settings, setTheme, updateSettings } = useSettings();
  const [presentToast] = useIonToast();
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [editingCredentials, setEditingCredentials] = useState({
    email: '',
    password: '',
    bbbPassword: '',
    webuntisEmail: '',
    webuntisPassword: ''
  });

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      await logout();
      presentToast({
        message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
        duration: 3000,
        color: 'success',
        position: 'bottom'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Handle theme toggle
   */
  const handleThemeToggle = async (checked: boolean) => {
    await setTheme(checked ? 'dark' : 'light');
  };

  /**
   * Handle haptic feedback toggle
   */
  const handleHapticToggle = async (checked: boolean) => {
    await updateSettings({ hapticFeedback: checked });
  };

  /**
   * Open credentials modal
   */
  const openCredentialsModal = () => {
    setEditingCredentials({
      email: credentials?.email || user?.email || '',
      password: credentials?.password || '',
      bbbPassword: credentials?.bbbPassword || '',
      webuntisEmail: credentials?.webuntisEmail || '',
      webuntisPassword: credentials?.webuntisPassword || ''
    });
    setShowCredentialsModal(true);
  };

  /**
   * Save updated credentials
   */
  const handleSaveCredentials = async () => {
    try {
      await saveCredentials({
        email: editingCredentials.email || undefined,
        password: editingCredentials.password || undefined,
        bbbPassword: editingCredentials.bbbPassword || undefined,
        webuntisEmail: editingCredentials.webuntisEmail || undefined,
        webuntisPassword: editingCredentials.webuntisPassword || undefined
      });

      presentToast({
        message: 'Anmeldedaten erfolgreich aktualisiert',
        duration: 3000,
        color: 'success',
        position: 'bottom'
      });

      setShowCredentialsModal(false);
    } catch (error) {
      console.error('Error saving credentials:', error);
      presentToast({
        message: 'Fehler beim Speichern der Anmeldedaten',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Einstellungen</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Einstellungen</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* User Profile Section */}
        {user && (
          <IonList>
            <IonListHeader>
              <IonLabel>Benutzerprofil</IonLabel>
            </IonListHeader>
            <IonItem>
              <IonIcon icon={personOutline} slot="start" />
              <IonLabel>
                <h2>{user.email}</h2>
                <p>
                  {user.role === 'teacher' && 'Lehrkraft'}
                  {user.role === 'student' && 'Schüler/in'}
                  {user.role === 'admin' && 'Administrator'}
                </p>
              </IonLabel>
            </IonItem>
          </IonList>
        )}

        {/* Appearance Section */}
        <IonList>
          <IonListHeader>
            <IonLabel>Darstellung</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonIcon icon={moonOutline} slot="start" />
            <IonLabel>
              <h2>Dunkles Design</h2>
              <p>Aktiviert den Dunkelmodus</p>
            </IonLabel>
            <IonToggle
              checked={settings.theme === 'dark'}
              onIonChange={(e) => handleThemeToggle(e.detail.checked)}
            />
          </IonItem>
        </IonList>

        {/* Credentials Section */}
        <IonList>
          <IonListHeader>
            <IonLabel>Anmeldedaten</IonLabel>
          </IonListHeader>
          <IonItem button onClick={openCredentialsModal}>
            <IonIcon icon={keyOutline} slot="start" />
            <IonLabel>
              <h2>Anmeldedaten verwalten</h2>
              <p>E-Mail und Passwörter bearbeiten</p>
            </IonLabel>
            <IonIcon icon={createOutline} slot="end" />
          </IonItem>
        </IonList>

        {/* App Settings Section */}
        <IonList>
          <IonListHeader>
            <IonLabel>App-Einstellungen</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel>
              <h2>Haptisches Feedback</h2>
              <p>Vibrationen bei Interaktionen</p>
            </IonLabel>
            <IonToggle
              checked={settings.hapticFeedback}
              onIonChange={(e) => handleHapticToggle(e.detail.checked)}
            />
          </IonItem>
          <IonItem>
            <IonLabel>
              <h2>Verfügbare Apps</h2>
              <p>{settings.availableApps.length} Apps sichtbar</p>
            </IonLabel>
          </IonItem>
          <IonItem>
            <IonLabel>
              <h2>Favoriten</h2>
              <p>{settings.favoriteApps.length} Apps als Favoriten markiert</p>
            </IonLabel>
          </IonItem>
        </IonList>

        {/* About Section */}
        <IonList>
          <IonListHeader>
            <IonLabel>Über</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonIcon icon={informationCircleOutline} slot="start" />
            <IonLabel>
              <h2>{APP_CONFIG.APP_NAME}</h2>
              <p>Version {APP_CONFIG.APP_VERSION}</p>
            </IonLabel>
          </IonItem>
          <IonItem lines="none">
            <IonLabel className="ion-text-wrap">
              <IonNote>
                Die mobile App für die BBZ Cloud - eine All-in-One-Plattform für Unterricht und Zusammenarbeit.
              </IonNote>
            </IonLabel>
          </IonItem>
        </IonList>

        {/* Logout Section */}
        {user && (
          <div className="settings-logout">
            <IonButton
              expand="block"
              color="danger"
              onClick={handleLogout}
            >
              <IonIcon icon={logOutOutline} slot="start" />
              Abmelden
            </IonButton>
          </div>
        )}

        {/* Credentials Modal */}
        <IonModal isOpen={showCredentialsModal} onDidDismiss={() => setShowCredentialsModal(false)}>
          <IonHeader>
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowCredentialsModal(false)}>Abbrechen</IonButton>
              </IonButtons>
              <IonTitle>Anmeldedaten</IonTitle>
              <IonButtons slot="end">
                <IonButton strong onClick={handleSaveCredentials}>Speichern</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonList>
              <IonListHeader>
                <IonLabel>Allgemeine Anmeldedaten</IonLabel>
              </IonListHeader>
              <IonItem>
                <IonLabel position="stacked">E-Mail-Adresse *</IonLabel>
                <IonInput
                  type="email"
                  value={editingCredentials.email}
                  onIonInput={(e) => setEditingCredentials({ ...editingCredentials, email: e.detail.value || '' })}
                  placeholder="vorname.nachname@bbz-rd-eck.de"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Allgemeines Passwort</IonLabel>
                <IonInput
                  type="password"
                  value={editingCredentials.password}
                  onIonInput={(e) => setEditingCredentials({ ...editingCredentials, password: e.detail.value || '' })}
                  placeholder="Ihr Passwort"
                />
              </IonItem>

              <IonListHeader className="ion-margin-top">
                <IonLabel>BigBlueButton</IonLabel>
              </IonListHeader>
              <IonItem>
                <IonLabel position="stacked">BBB Passwort</IonLabel>
                <IonInput
                  type="password"
                  value={editingCredentials.bbbPassword}
                  onIonInput={(e) => setEditingCredentials({ ...editingCredentials, bbbPassword: e.detail.value || '' })}
                  placeholder="BigBlueButton Passwort"
                />
              </IonItem>

              <IonListHeader className="ion-margin-top">
                <IonLabel>WebUntis</IonLabel>
              </IonListHeader>
              <IonItem>
                <IonLabel position="stacked">WebUntis Benutzername</IonLabel>
                <IonInput
                  type="text"
                  value={editingCredentials.webuntisEmail}
                  onIonInput={(e) => setEditingCredentials({ ...editingCredentials, webuntisEmail: e.detail.value || '' })}
                  placeholder="WebUntis Benutzername"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">WebUntis Passwort</IonLabel>
                <IonInput
                  type="password"
                  value={editingCredentials.webuntisPassword}
                  onIonInput={(e) => setEditingCredentials({ ...editingCredentials, webuntisPassword: e.detail.value || '' })}
                  placeholder="WebUntis Passwort"
                />
              </IonItem>
            </IonList>

            <div className="ion-padding">
              <IonNote>
                <p>* Pflichtfeld</p>
                <p>Ihre Anmeldedaten werden sicher auf Ihrem Gerät gespeichert und nicht an Server übertragen.</p>
              </IonNote>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
