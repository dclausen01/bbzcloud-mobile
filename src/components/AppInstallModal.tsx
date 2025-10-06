/**
 * BBZCloud Mobile - App Install Modal Component
 * 
 * Modal displayed when user tries to open a native app that is not installed
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCheckbox,
  IonItem,
  IonLabel,
  IonButtons
} from '@ionic/react';
import { closeOutline, downloadOutline, globeOutline } from 'ionicons/icons';
import type { AppInstallModalProps } from '../types';
import './AppInstallModal.css';

const AppInstallModal: React.FC<AppInstallModalProps> = ({
  isOpen,
  app,
  onInstall,
  onOpenInBrowser,
  onDismiss,
  onDontShowAgain
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleInstall = () => {
    if (dontShowAgain) {
      onDontShowAgain();
    }
    onInstall();
  };

  const handleOpenInBrowser = () => {
    if (dontShowAgain) {
      onDontShowAgain();
    }
    onOpenInBrowser();
  };

  const handleClose = () => {
    if (dontShowAgain) {
      onDontShowAgain();
    }
    onDismiss();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="app-install-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>App nicht installiert</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div className="app-install-content">
          {/* App Icon with Color */}
          <div className="app-install-icon" style={{ backgroundColor: app.color }}>
            <IonIcon icon={app.icon} />
          </div>

          {/* App Title */}
          <h2 className="app-install-title">{app.title}</h2>

          {/* Description */}
          <p className="app-install-description">
            Die native {app.title} App ist auf Ihrem Gerät nicht installiert.
          </p>

          <p className="app-install-benefits">
            <strong>Vorteile der nativen App:</strong>
          </p>
          <ul className="app-install-benefits-list">
            <li>Schnellere Performance</li>
            <li>Bessere Integration mit Ihrem Gerät</li>
            <li>Push-Benachrichtigungen</li>
            <li>Offline-Funktionen</li>
          </ul>

          {/* Action Buttons */}
          <div className="app-install-actions">
            <IonButton
              expand="block"
              color="primary"
              onClick={handleInstall}
              className="app-install-button"
            >
              <IonIcon slot="start" icon={downloadOutline} />
              Im App Store öffnen
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              onClick={handleOpenInBrowser}
              className="app-install-button"
            >
              <IonIcon slot="start" icon={globeOutline} />
              Im Browser öffnen
            </IonButton>
          </div>

          {/* Don't show again checkbox */}
          <IonItem lines="none" className="app-install-checkbox">
            <IonCheckbox
              checked={dontShowAgain}
              onIonChange={(e) => setDontShowAgain(e.detail.checked)}
              slot="start"
            />
            <IonLabel>Diese Meldung nicht mehr anzeigen</IonLabel>
          </IonItem>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default AppInstallModal;
