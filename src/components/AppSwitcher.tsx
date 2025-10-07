/**
 * BBZCloud Mobile - App Switcher Component
 * 
 * Drawer/Sidebar for switching between loaded apps
 * 
 * @version 1.0.0
 */

import React from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonBadge,
  IonText,
  IonButtons,
  isPlatform
} from '@ionic/react';
import {
  closeCircleOutline,
  trashOutline,
  appsOutline,
  checkmarkCircle
} from 'ionicons/icons';
import { useAppSwitcher } from '../contexts/AppSwitcherContext';
import './AppSwitcher.css';

const AppSwitcher: React.FC = () => {
  const {
    loadedApps,
    activeAppId,
    maxLoadedApps,
    switchToApp,
    closeApp,
    closeAllApps,
    getMemoryUsage
  } = useAppSwitcher();

  const isTablet = isPlatform('tablet');
  const memoryUsage = getMemoryUsage();

  /**
   * Handle app switch
   */
  const handleSwitchApp = (appId: string) => {
    if (appId !== activeAppId) {
      switchToApp(appId);
    }
  };

  /**
   * Handle app close
   */
  const handleCloseApp = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    closeApp(appId);
  };

  /**
   * Handle close all
   */
  const handleCloseAll = () => {
    if (window.confirm('Möchten Sie alle geöffneten Apps schließen?')) {
      closeAllApps();
    }
  };

  return (
    <IonMenu 
      contentId="main-content" 
      side="start" 
      type={isTablet ? 'overlay' : 'push'}
      className="app-switcher-menu"
    >
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Geöffnete Apps</IonTitle>
          <IonButtons slot="end">
            {loadedApps.length > 0 && (
              <IonButton onClick={handleCloseAll} title="Alle schließen">
                <IonIcon slot="icon-only" icon={trashOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="app-switcher-content">
        {loadedApps.length === 0 ? (
          <div className="app-switcher-empty">
            <IonIcon icon={appsOutline} className="empty-icon" />
            <IonText>
              <p>Keine Apps geöffnet</p>
              <p className="empty-subtitle">
                Öffnen Sie Apps vom Home-Bildschirm
              </p>
            </IonText>
          </div>
        ) : (
          <>
            <IonList className="app-switcher-list">
              {loadedApps.map((app) => (
                <IonItem
                  key={app.webViewId}
                  button
                  className={`app-switcher-item ${app.isActive ? 'active' : ''}`}
                  onClick={() => handleSwitchApp(app.appId)}
                  style={{
                    '--app-color': app.color
                  } as React.CSSProperties}
                >
                  <div className="app-switcher-icon" slot="start">
                    <IonIcon icon={app.icon} style={{ color: app.color }} />
                  </div>
                  
                  <IonLabel>
                    <h2>{app.title}</h2>
                    <p className="app-switcher-url">{new URL(app.url).hostname}</p>
                  </IonLabel>

                  {app.isActive && (
                    <IonBadge slot="end" color="success" className="active-badge">
                      <IonIcon icon={checkmarkCircle} />
                    </IonBadge>
                  )}

                  <IonButton
                    slot="end"
                    fill="clear"
                    color="danger"
                    onClick={(e) => handleCloseApp(e, app.appId)}
                    className="close-button"
                    title="App schließen"
                  >
                    <IonIcon slot="icon-only" icon={closeCircleOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>

            <div className="app-switcher-footer">
              <IonText color="medium">
                <p className="memory-info">
                  {loadedApps.length} / {maxLoadedApps} Apps geladen
                </p>
                <p className="memory-usage">
                  ~{memoryUsage} MB Speicher
                </p>
              </IonText>
            </div>
          </>
        )}
      </IonContent>
    </IonMenu>
  );
};

export default AppSwitcher;
