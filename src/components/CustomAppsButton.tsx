/**
 * BBZCloud Mobile - Custom Apps Button Component
 * 
 * Special button displayed at the end of the app grid
 * Opens the Custom Apps modal when clicked
 * 
 * @version 1.0.0
 */

import React from 'react';
import { IonCard, IonCardContent, IonIcon, IonRippleEffect } from '@ionic/react';
import { add } from 'ionicons/icons';
import './CustomAppsButton.css';

interface CustomAppsButtonProps {
  onPress: () => void;
}

const CustomAppsButton: React.FC<CustomAppsButtonProps> = ({ onPress }) => {
  return (
    <IonCard
      className="custom-apps-button ion-activatable"
      button
      onClick={onPress}
    >
      <IonRippleEffect />
      <IonCardContent className="custom-apps-button-content">
        <div className="custom-apps-button-icon-container">
          <IonIcon icon={add} className="custom-apps-button-icon" />
        </div>
        <div className="custom-apps-button-title">Eigene Apps</div>
      </IonCardContent>
    </IonCard>
  );
};

export default CustomAppsButton;
