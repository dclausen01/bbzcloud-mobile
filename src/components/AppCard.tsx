/**
 * BBZCloud Mobile - App Card Component
 * 
 * Displays an individual app tile with icon, title, and color
 * 
 * @version 1.0.0
 */

import React, { useRef } from 'react';
import { IonCard, IonCardContent, IonIcon, IonRippleEffect, IonSpinner, useIonAlert } from '@ionic/react';
import * as icons from 'ionicons/icons';
import type { AppCardProps } from '../types';
import './AppCard.css';

const AppCard: React.FC<AppCardProps> = ({ app, onPress, onLongPress, isLoading, isEditMode = false, onToggleVisibility }) => {
  const iconName = app.icon as keyof typeof icons;
  const icon = icons[iconName] || icons.apps;
  const [presentAlert] = useIonAlert();
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleClick = () => {
    // In edit mode, don't open the app (unless it's a short press)
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

  /**
   * Handle press start (mouse or touch)
   */
  const handlePressStart = () => {
    if (!isEditMode) return;

    pressTimer.current = setTimeout(() => {
      // Long press detected - show visibility toggle dialog
      presentAlert({
        header: app.title,
        message: app.isVisible !== false 
          ? 'Möchten Sie diese App ausblenden?' 
          : 'Möchten Sie diese App wieder einblenden?',
        buttons: [
          {
            text: 'Abbrechen',
            role: 'cancel'
          },
          {
            text: 'Ja',
            handler: () => {
              if (onToggleVisibility) {
                onToggleVisibility(app.id);
              }
            }
          }
        ]
      });
    }, 500); // 500ms for long press
  };

  /**
   * Handle press end (mouse or touch)
   */
  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  return (
    <IonCard
      className={`app-card ion-activatable ${isEditMode ? 'edit-mode' : ''} ${app.isVisible === false ? 'hidden' : ''}`}
      button={!isEditMode}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
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
  );
};

export default AppCard;
