/**
 * BBZCloud Mobile - App Card Component
 * 
 * Displays an individual app tile with icon, title, and color
 * 
 * @version 1.0.0
 */

import React from 'react';
import { IonCard, IonCardContent, IonIcon, IonRippleEffect } from '@ionic/react';
import * as icons from 'ionicons/icons';
import type { AppCardProps } from '../types';
import './AppCard.css';

const AppCard: React.FC<AppCardProps> = ({ app, onPress, onLongPress }) => {
  const iconName = app.icon as keyof typeof icons;
  const icon = icons[iconName] || icons.apps;

  const handleClick = () => {
    onPress(app);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLongPress) {
      onLongPress(app);
    }
  };

  return (
    <IonCard
      className="app-card ion-activatable"
      button
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        '--card-background': app.color,
        '--card-color': '#ffffff',
      } as React.CSSProperties}
    >
      <IonRippleEffect />
      <IonCardContent className="app-card-content">
        <div className="app-card-icon-container">
          <IonIcon icon={icon} className="app-card-icon" />
        </div>
        <div className="app-card-title">{app.title}</div>
        {app.description && (
          <div className="app-card-description">{app.description}</div>
        )}
        {app.isFavorite && (
          <IonIcon
            icon={icons.star}
            className="app-card-favorite-badge"
          />
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default AppCard;
