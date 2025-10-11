/**
 * BBZCloud Mobile - Slider Open Button
 * 
 * Fixed button on the left side to open the App Switcher
 * 
 * @version 2.0.0
 */

import React from 'react';
import { IonButton, IonIcon, IonBadge, IonMenuToggle } from '@ionic/react';
import { appsOutline } from 'ionicons/icons';
import { useAppSwitcher } from '../contexts/AppSwitcherContext';
import './GlobalFAB.css';

const GlobalFAB: React.FC = () => {
  const { loadedApps } = useAppSwitcher();

  return (
    <div className="slider-open-button-container">
      <IonMenuToggle>
        <IonButton className="slider-open-button" fill="solid">
          <IonIcon icon={appsOutline} slot="icon-only" />
          {loadedApps.length > 0 && (
            <IonBadge color="primary" className="slider-badge">
              {loadedApps.length}
            </IonBadge>
          )}
        </IonButton>
      </IonMenuToggle>
    </div>
  );
};

export default GlobalFAB;
