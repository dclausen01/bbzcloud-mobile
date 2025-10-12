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
  RefresherEventDetail,
  useIonToast
} from '@ionic/react';
import { settingsOutline, listOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import AppGrid from '../components/AppGrid';
import WelcomeModal from '../components/WelcomeModal';
import AppInstallModal from '../components/AppInstallModal';
import CustomAppsModal from '../components/CustomAppsModal';
import CustomAppFormModal from '../components/CustomAppFormModal';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppSwitcher } from '../contexts/AppSwitcherContext';
import BrowserService from '../services/BrowserService';
import { ERROR_MESSAGES, NAVIGATION_APPS } from '../utils/constants';
import type { App, CustomApp } from '../types';
import './Home.css';

const Home: React.FC = () => {
  const history = useHistory();
  const { settings, isLoading: settingsLoading, customApps, addCustomApp, updateCustomApp, deleteCustomApp } = useSettings();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { openApp } = useAppSwitcher();
  const [presentToast] = useIonToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [showWelcome, setShowWelcome] = useState(!isAuthenticated && !authLoading);
  const [loadingAppId, setLoadingAppId] = useState<string | null>(null);
  const [installModalApp, setInstallModalApp] = useState<App | null>(null);
  const [showCustomAppsModal, setShowCustomAppsModal] = useState(false);
  const [showCustomAppFormModal, setShowCustomAppFormModal] = useState(false);
  const [editingCustomApp, setEditingCustomApp] = useState<CustomApp | undefined>(undefined);

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

  /**
   * Handle custom apps button press
   */
  const handleCustomAppsPress = () => {
    setShowCustomAppsModal(true);
  };

  /**
   * Handle add new custom app
   */
  const handleAddNewCustomApp = () => {
    setEditingCustomApp(undefined);
    setShowCustomAppFormModal(true);
  };

  /**
   * Handle edit custom app
   */
  const handleEditCustomApp = (app: CustomApp) => {
    setEditingCustomApp(app);
    setShowCustomAppFormModal(true);
  };

  /**
   * Handle save custom app (add or update)
   */
  const handleSaveCustomApp = async (app: Omit<CustomApp, 'id' | 'orderIndex' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingCustomApp) {
        await updateCustomApp(editingCustomApp.id, app);
        presentToast({
          message: 'App aktualisiert',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
      } else {
        await addCustomApp(app);
        presentToast({
          message: 'App hinzugefügt',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
      }
      setShowCustomAppFormModal(false);
      setEditingCustomApp(undefined);
    } catch (error) {
      presentToast({
        message: 'Fehler beim Speichern der App',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
    }
  };

  /**
   * Handle delete custom app
   */
  const handleDeleteCustomApp = async (appId: string) => {
    try {
      await deleteCustomApp(appId);
      presentToast({
        message: 'App gelöscht',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
    } catch (error) {
      presentToast({
        message: 'Fehler beim Löschen der App',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
    }
  };

  /**
   * Handle custom app press - open in browser
   */
  const handleCustomAppPress = async (app: App) => {
    try {
      // Close the custom apps modal first
      setShowCustomAppsModal(false);
      // Open the custom app
      await openApp(app);
    } catch (error) {
      presentToast({
        message: ERROR_MESSAGES.BROWSER_OPEN_FAILED,
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
            enterkeyhint="search"
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
              onCustomAppsPress={handleCustomAppsPress}
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

      {/* Custom Apps Modal */}
      <CustomAppsModal
        isOpen={showCustomAppsModal}
        customApps={customApps}
        onDismiss={() => setShowCustomAppsModal(false)}
        onAppPress={handleCustomAppPress}
        onAddNew={handleAddNewCustomApp}
        onEdit={handleEditCustomApp}
        onDelete={handleDeleteCustomApp}
      />

      {/* Custom App Form Modal */}
      <CustomAppFormModal
        isOpen={showCustomAppFormModal}
        onDismiss={() => {
          setShowCustomAppFormModal(false);
          setEditingCustomApp(undefined);
        }}
        onSave={handleSaveCustomApp}
        editApp={editingCustomApp}
      />
    </IonPage>
  );
};

export default Home;
