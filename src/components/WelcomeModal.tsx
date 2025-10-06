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
import { mailOutline, keyOutline } from 'ionicons/icons';
import { useAuth } from '../contexts/AuthContext';
import { INFO_MESSAGES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import type { WelcomeModalProps } from '../types';
import './WelcomeModal.css';

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onComplete }) => {
  const { login, saveCredentials } = useAuth();
  const [presentToast] = useIonToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bbbPassword, setBbbPassword] = useState('');
  const [webuntisEmail, setWebuntisEmail] = useState('');
  const [webuntisPassword, setWebuntisPassword] = useState('');
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

      // Login with provided credentials
      await login(email, password);

      // Save additional credentials if provided
      if (bbbPassword || webuntisEmail || webuntisPassword) {
        await saveCredentials({
          bbbPassword: bbbPassword || undefined,
          webuntisEmail: webuntisEmail || undefined,
          webuntisPassword: webuntisPassword || undefined
        });
      }

      presentToast({
        message: SUCCESS_MESSAGES.CREDENTIALS_SAVED,
        duration: 3000,
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
            <p>{INFO_MESSAGES.FIRST_TIME_SETUP}</p>
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

            <IonItem>
              <IonIcon icon={keyOutline} slot="start" />
              <IonLabel position="stacked">Passwort (optional)</IonLabel>
              <IonInput
                type="password"
                value={password}
                onIonInput={(e) => setPassword(e.detail.value || '')}
                placeholder="Ihr Passwort"
              />
            </IonItem>

            <div className="welcome-section-divider">
              <IonText color="medium">
                <h3>Zusätzliche Anmeldedaten (optional)</h3>
              </IonText>
            </div>

            <IonItem>
              <IonIcon icon={keyOutline} slot="start" />
              <IonLabel position="stacked">BigBlueButton Passwort</IonLabel>
              <IonInput
                type="password"
                value={bbbPassword}
                onIonInput={(e) => setBbbPassword(e.detail.value || '')}
                placeholder="BBB Passwort"
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={mailOutline} slot="start" />
              <IonLabel position="stacked">WebUntis Benutzername</IonLabel>
              <IonInput
                type="text"
                value={webuntisEmail}
                onIonInput={(e) => setWebuntisEmail(e.detail.value || '')}
                placeholder="WebUntis Benutzername"
              />
            </IonItem>

            <IonItem>
              <IonIcon icon={keyOutline} slot="start" />
              <IonLabel position="stacked">WebUntis Passwort</IonLabel>
              <IonInput
                type="password"
                value={webuntisPassword}
                onIonInput={(e) => setWebuntisPassword(e.detail.value || '')}
                placeholder="WebUntis Passwort"
              />
            </IonItem>
          </IonList>

          <div className="welcome-footer">
            <IonText color="medium">
              <p className="welcome-info-text">
                * Pflichtfeld<br />
                Ihre Anmeldedaten werden sicher auf Ihrem Gerät gespeichert.
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
