/**
 * BBZCloud Mobile - Slider Open Button
 * 
 * Vertically draggable button on the left side to open the App Switcher
 * 
 * @version 2.1.0
 */

import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon, IonBadge, IonMenuToggle } from '@ionic/react';
import { appsOutline } from 'ionicons/icons';
import { useAppSwitcher } from '../contexts/AppSwitcherContext';
import './GlobalFAB.css';

const GlobalFAB: React.FC = () => {
  const { loadedApps } = useAppSwitcher();
  const [positionY, setPositionY] = useState(80);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('slider-button-position-y');
    if (saved) {
      try {
        const savedPos = parseInt(saved, 10);
        setPositionY(savedPos);
      } catch (e) {
        console.error('Failed to load button position:', e);
      }
    }
  }, []);

  // Save position to localStorage
  const savePosition = (y: number) => {
    localStorage.setItem('slider-button-position-y', y.toString());
  };

  // Handle drag start
  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    setDragStartY(clientY - positionY);
  };

  // Handle drag move
  const handleDragMove = (clientY: number) => {
    if (!isDragging) return;

    const newY = clientY - dragStartY;

    // Constrain to window boundaries (with padding)
    const minY = 10;
    const maxY = window.innerHeight - 58; // Button height + padding

    const constrainedY = Math.max(minY, Math.min(newY, maxY));
    setPositionY(constrainedY);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    savePosition(positionY);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragStart(e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    handleDragStart(touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStartY, positionY]);

  return (
    <div 
      className={`slider-open-button-container ${isDragging ? 'dragging' : ''}`}
      style={{ top: `${positionY}px` }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
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
