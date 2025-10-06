/**
 * BBZCloud Mobile - Welcome Modal Component
 * 
 * Onboarding modal for first-time users to set up their account
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
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  IonList,
  IonIcon,
  useIonToast
} from '@ionic/react';
import { mailOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { INFO_MESSAGES, ERROR_MESSAGES } from '../utils/constants';
import type { WelcomeModalProps } from '../types';
import './WelcomeModal.css';

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onComplete }) => {
  const { login } = useAuth();
  const [presentToast] = useIonToast();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validate email format
   */
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Validate required fields
    if (!email) {
      presentToast({
        message: 'Bitte geben Sie Ihre E-Mail-Adresse ein',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
      return;
    }

    if (!isValidEmail(email)) {
      presentToast({
        message: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
      return;
    }

    try {
      setIsLoading(true);

      // Login with email only (for role detection)
      await login(email, '');

      presentToast({
        message: 'Einrichtung abgeschlossen! Bitte nutzen Sie den nativen Password-Manager Ihres Geräts für Ihre App-Logins.',
        duration: 4000,
        color: 'success',
        position: 'bottom'
      });

      onComplete();
    } catch (error) {
      console.error('Error during setup:', error);
      presentToast({
        message: ERROR_MESSAGES.GENERIC_ERROR,
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} backdropDismiss={false}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Willkommen bei BBZCloud</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="welcome-modal-content">
        <div className="welcome-modal-body">
          <div className="welcome-header">
            <h2>{INFO_MESSAGES.WELCOME}</h2>
            <p>Bitte geben Sie Ihre E-Mail-Adresse ein, um zu starten.</p>
          </div>

          <IonList>
            <IonItem>
              <IonIcon icon={mailOutline} slot="start" />
              <IonLabel position="stacked">E-Mail-Adresse *</IonLabel>
              <IonInput
                type="email"
                value={email}
                onIonInput={(e) => setEmail(e.detail.value || '')}
                placeholder="vorname.nachname@bbz-rd-eck.de"
                required
              />
            </IonItem>
          </IonList>

          <div className="welcome-footer">
            <IonText color="medium">
              <p className="welcome-info-text">
                * Pflichtfeld<br /><br />
                <strong>Passwortverwaltung:</strong><br />
                Ihre App-Passwörter werden automatisch vom nativen Password-Manager Ihres Geräts verwaltet (iCloud Keychain auf iOS, Google Password Manager auf Android).<br /><br />
                Beim ersten Login in einer App wird Ihr Gerät anbieten, das Passwort zu speichern.
              </p>
            </IonText>
          </div>
        </div>
      </IonContent>

      <div className="welcome-modal-actions">
        <IonButton
          expand="block"
          onClick={handleSubmit}
          disabled={isLoading || !email}
        >
          {isLoading ? 'Wird eingerichtet...' : 'Einrichten'}
        </IonButton>
      </div>
    </IonModal>
  );
};

export default WelcomeModal;
