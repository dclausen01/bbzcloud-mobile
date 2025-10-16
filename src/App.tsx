/**
 * BBZCloud Mobile - Main Application Component
 * 
 * Root component that sets up providers, routing, and navigation
 * 
 * @version 1.0.0
 */

import React, { useEffect, useRef } from 'react';
import { Redirect, Route, useHistory } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonSplitPane, setupIonicReact, useIonToast } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Todos from './pages/Todos';
import AppSwitcher from './components/AppSwitcher';
import GlobalFAB from './components/GlobalFAB';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { AppSwitcherProvider } from './contexts/AppSwitcherContext';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
import '@ionic/react/css/palettes/dark.class.css';
/* import '@ionic/react/css/palettes/dark.system.css'; */

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

const AppContent: React.FC = () => {
  const history = useHistory();
  const [presentToast] = useIonToast();
  const lastBackPress = useRef<number>(0);
  const BACK_BUTTON_TIMEOUT = 2000; // 2 seconds

  useEffect(() => {
    let listenerHandle: PluginListenerHandle | null = null;

    const setupListener = async () => {
      listenerHandle = await CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack || history.location.pathname === '/home') {
          // On home page or can't go back - handle app exit
          const now = Date.now();
          
          if (now - lastBackPress.current < BACK_BUTTON_TIMEOUT) {
            // Second press within timeout - exit app
            CapacitorApp.exitApp();
          } else {
            // First press - show toast
            lastBackPress.current = now;
            presentToast({
              message: 'Noch einmal drücken, um die App zu schließen',
              duration: 2000,
              position: 'bottom',
              color: 'medium'
            });
          }
        } else {
          // Can go back - navigate back
          history.goBack();
        }
      });
    };

    setupListener();

    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [history, presentToast]);

  return (
    <>
      <IonSplitPane contentId="main-content" when="false">
        <AppSwitcher />
        <IonRouterOutlet id="main-content">
          <Route exact path="/home">
            <Home />
          </Route>
          <Route exact path="/settings">
            <Settings />
          </Route>
          <Route exact path="/todos">
            <Todos />
          </Route>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
      </IonSplitPane>
      <GlobalFAB />
    </>
  );
};

const App: React.FC = () => (
  <IonApp>
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <AppSwitcherProvider>
            <IonReactRouter>
              <AppContent />
            </IonReactRouter>
          </AppSwitcherProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  </IonApp>
);

export default App;
