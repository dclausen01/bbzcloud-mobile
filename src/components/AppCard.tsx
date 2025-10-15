/**
 * BBZCloud Mobile - App Card Component
 * 
 * Displays an individual app tile with icon, title, and color
 * 
 * @version 1.0.0
 */

import React from 'react';
import { IonCard, IonCardContent, IonIcon, IonRippleEffect, IonSpinner, IonButton } from '@ionic/react';
import * as icons from 'ionicons/icons';
import type { AppCardProps } from '../types';
import './AppCard.css';

const AppCard: React.FC<AppCardProps> = ({ app, onPress, onLongPress, isLoading, isEditMode = false, onToggleVisibility }) => {
  const iconName = app.icon as keyof typeof icons;
  const icon = icons[iconName] || icons.apps;

  const handleClick = () => {
    // In edit mode, don't open the app
    if (!isEditMode) {
      onPress(app);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onLongPress) {
      onLongPress(app);
    }
  };

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleVisibility) {
      onToggleVisibility(app.id);
    }
  };

  const isVisible = app.isVisible !== false;

  return (
    <div className="app-card-wrapper">
      <IonCard
      className={`app-card ion-activatable ${isEditMode ? 'edit-mode' : ''}`}
      button={!isEditMode}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      style={{
        '--card-background': app.color,
        '--card-color': '#ffffff',
      } as React.CSSProperties}
    >
        <IonRippleEffect />
        {isLoading && (
          <div className="app-card-loading-overlay">
            <IonSpinner name="crescent" />
          </div>
        )}
        <IonCardContent className="app-card-content">
          <div className="app-card-icon-container">
            <IonIcon icon={icon} className="app-card-icon" />
          </div>
          <div className="app-card-title">{app.title}</div>
          {app.description && (
            <div className="app-card-description">{app.description}</div>
          )}
        </IonCardContent>
      </IonCard>
      
      {/* Visibility Toggle Button - Only in Edit Mode */}
      {isEditMode && (
        <IonButton
          className="app-card-toggle-button"
          expand="block"
          size="small"
          color={isVisible ? 'success' : 'danger'}
          onClick={handleToggleVisibility}
        >
          <IonIcon slot="start" icon={isVisible ? icons.eye : icons.eyeOff} />
          {isVisible ? 'Sichtbar' : 'Ausgeblendet'}
        </IonButton>
      )}
    </div>
  );
};

export default AppCard;
