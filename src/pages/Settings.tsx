/**
 * BBZCloud Mobile - Settings Page
 * 
 * Settings and configuration page
 * 
 * @version 1.0.0
 */

import React from 'react';
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
  IonListHeader
} from '@ionic/react';
import { moonOutline, personOutline, logOutOutline, informationCircleOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { APP_CONFIG, SUCCESS_MESSAGES } from '../utils/constants';
import './Settings.css';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { settings, setTheme } = useSettings();
  const [presentToast] = useIonToast();

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

        {/* App Settings Section */}
        <IonList>
          <IonListHeader>
            <IonLabel>App-Einstellungen</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel>
              <h2>Verfügbare Apps</h2>
              <p>{settings.availableApps.length} Apps sichtbar</p>
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
      </IonContent>
    </IonPage>
  );
};

export default Settings;
