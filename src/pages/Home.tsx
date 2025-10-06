/**
 * BBZCloud Mobile - Home Page
 * 
 * Main page displaying the app grid with search and filtering
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
  IonSearchbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  RefresherEventDetail,
  useIonToast
} from '@ionic/react';
import { settingsOutline, star, apps } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AppGrid from '../components/AppGrid';
import WelcomeModal from '../components/WelcomeModal';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import BrowserService from '../services/BrowserService';
import { ERROR_MESSAGES } from '../utils/constants';
import type { App } from '../types';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const { settings, isLoading: settingsLoading } = useSettings();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [presentToast] = useIonToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  const [showWelcome, setShowWelcome] = useState(!isAuthenticated && !authLoading);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async (event: CustomEvent<RefresherEventDetail>) => {
    try {
      // Reload settings could go here
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      event.detail.complete();
    }
  };

  /**
   * Handle app card press - open in browser
   */
  const handleAppPress = async (app: App) => {
    try {
      // Check if user needs authentication for this app
      if (app.requiresAuth && !isAuthenticated) {
        presentToast({
          message: ERROR_MESSAGES.CREDENTIALS_NOT_FOUND,
          duration: 3000,
          color: 'warning',
          position: 'bottom'
        });
        return;
      }

      // Open app in InAppBrowser
      const result = await BrowserService.openApp(app.id, app.url, app.color);
      
      if (!result.success) {
        presentToast({
          message: result.error || ERROR_MESSAGES.BROWSER_OPEN_FAILED,
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
      }
    } catch (error) {
      console.error('Error opening app:', error);
      presentToast({
        message: ERROR_MESSAGES.GENERIC_ERROR,
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
    }
  };

  /**
   * Navigate to settings page
   */
  const goToSettings = () => {
    history.push('/settings');
  };

  const isLoading = authLoading || settingsLoading;

  /**
   * Handle welcome modal completion
   */
  const handleWelcomeComplete = () => {
    setShowWelcome(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>BBZCloud Mobile</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={goToSettings}>
              <IonIcon slot="icon-only" icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value || '')}
            placeholder="Apps durchsuchen..."
            debounce={300}
          />
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={filterMode}
            onIonChange={(e) => setFilterMode(e.detail.value as 'all' | 'favorites')}
          >
            <IonSegmentButton value="all">
              <IonLabel>
                <IonIcon icon={apps} /> Alle
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="favorites">
              <IonLabel>
                <IonIcon icon={star} /> Favoriten
              </IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">BBZCloud Mobile</IonTitle>
          </IonToolbar>
        </IonHeader>

        {isLoading ? (
          <div className="home-loading">
            <p>Laden...</p>
          </div>
        ) : (
          <>
            {user && (
              <div className="home-user-info">
                <p>
                  Angemeldet als: <strong>{user.email}</strong>
                  {user.role === 'teacher' && ' (Lehrkraft)'}
                  {user.role === 'student' && ' (Schüler/in)'}
                </p>
              </div>
            )}

            <AppGrid
              apps={settings.availableApps}
              onAppPress={handleAppPress}
              searchQuery={searchQuery}
              showFavoritesOnly={filterMode === 'favorites'}
            />
          </>
        )}
      </IonContent>

      {/* Welcome Modal for first-time users */}
      <WelcomeModal isOpen={showWelcome} onComplete={handleWelcomeComplete} />
    </IonPage>
  );
};

export default Home;
