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
  IonRefresher,
  IonRefresherContent,
  IonMenuButton,
  IonBadge,
  RefresherEventDetail,
  useIonToast
} from '@ionic/react';
import { settingsOutline, listOutline, appsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AppGrid from '../components/AppGrid';
import WelcomeModal from '../components/WelcomeModal';
import AppInstallModal from '../components/AppInstallModal';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppSwitcher } from '../contexts/AppSwitcherContext';
import BrowserService from '../services/BrowserService';
import { ERROR_MESSAGES, NAVIGATION_APPS } from '../utils/constants';
import type { App } from '../types';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const { settings, isLoading: settingsLoading } = useSettings();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openApp, loadedApps } = useAppSwitcher();
  const [presentToast] = useIonToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [showWelcome, setShowWelcome] = useState(!isAuthenticated && !authLoading);
  const [loadingAppId, setLoadingAppId] = useState<string | null>(null);
  const [installModalApp, setInstallModalApp] = useState<App | null>(null);

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
   * Handle app card press - use AppSwitcher for better memory management
   */
  const handleAppPress = async (app: App) => {
    try {
      setLoadingAppId(app.id);

      const appConfig = NAVIGATION_APPS[app.id];
      if (!appConfig) {
        console.error('App config not found:', app.id);
        return;
      }

      // Check if app has native support
      const hasNativeSupport = BrowserService.hasNativeSupport(app.id);
      
      if (!hasNativeSupport) {
        // No native support - open through AppSwitcher
        await openApp(app);
      } else {
        // Has native support - check user preference
        const preferNative = BrowserService.getDefaultNativePreference(app.id);
        
        // Try to open with native support
        const nativeResult = await BrowserService.openAppWithNativeSupport(
          appConfig,
          preferNative
        );

        if (nativeResult.opened === 'native') {
          // Successfully opened native app
          console.log('Opened native app:', app.id);
        } else if (nativeResult.opened === 'browser') {
          // Opened in browser - use AppSwitcher
          await openApp(app);
        } else {
          // Native app not installed - show install modal
          setInstallModalApp(app);
        }
      }
    } catch (error) {
      console.error('Error opening app:', error);
      presentToast({
        message: ERROR_MESSAGES.GENERIC_ERROR,
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
    } finally {
      setLoadingAppId(null);
    }
  };

  /**
   * Handle install button in modal
   */
  const handleInstallApp = async () => {
    if (!installModalApp) return;

    const appConfig = NAVIGATION_APPS[installModalApp.id];
    if (!appConfig) return;

    const storeUrl = BrowserService.getAppStoreUrl(appConfig);
    if (storeUrl) {
      await BrowserService.openExternal(storeUrl);
    }

    setInstallModalApp(null);
  };

  /**
   * Handle open in browser button in modal
   */
  const handleOpenInBrowser = async () => {
    if (!installModalApp) return;

    try {
      await openApp(installModalApp);
    } catch {
      presentToast({
        message: ERROR_MESSAGES.BROWSER_OPEN_FAILED,
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
    }

    setInstallModalApp(null);
  };

  /**
   * Handle don't show again in modal
   */
  const handleDontShowAgain = () => {
    // TODO: Save preference to not show install prompt again
    console.log('User chose not to show install prompt again');
  };

  /**
   * Dismiss install modal
   */
  const handleDismissInstallModal = () => {
    setInstallModalApp(null);
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
          <IonButtons slot="start">
            <IonMenuButton>
              <IonIcon icon={appsOutline} />
            </IonMenuButton>
            {loadedApps.length > 0 && (
              <IonBadge color="primary" className="app-count-badge">
                {loadedApps.length}
              </IonBadge>
            )}
          </IonButtons>
          <IonTitle>BBZCloud Mobile</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/todos')}>
              <IonIcon slot="icon-only" icon={listOutline} />
            </IonButton>
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
              apps={settings.availableApps.map(app => ({
                ...app,
                isLoading: app.id === loadingAppId
              }))}
              onAppPress={handleAppPress}
              searchQuery={searchQuery}
            />
          </>
        )}
      </IonContent>

      {/* Welcome Modal for first-time users */}
      <WelcomeModal isOpen={showWelcome} onComplete={handleWelcomeComplete} />

      {/* App Install Modal */}
      {installModalApp && (
        <AppInstallModal
          isOpen={!!installModalApp}
          app={installModalApp}
          onInstall={handleInstallApp}
          onOpenInBrowser={handleOpenInBrowser}
          onDismiss={handleDismissInstallModal}
          onDontShowAgain={handleDontShowAgain}
        />
      )}
    </IonPage>
  );
};

export default Home;
