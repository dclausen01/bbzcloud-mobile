/**
 * BBZCloud Mobile - Main Application Component
 * 
 * Root component that sets up providers, routing, and navigation
 * 
 * @version 1.0.0
 */

import { Redirect, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, IonSplitPane, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Todos from './pages/Todos';
import AppViewer from './pages/AppViewer';
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

const App: React.FC = () => (
  <IonApp>
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <AppSwitcherProvider>
            <IonReactRouter>
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
                  <Route exact path="/app-viewer">
                    <AppViewer />
                  </Route>
                  <Route exact path="/">
                    <Redirect to="/home" />
                  </Route>
                </IonRouterOutlet>
              </IonSplitPane>
              <GlobalFAB />
            </IonReactRouter>
          </AppSwitcherProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  </IonApp>
);

export default App;
