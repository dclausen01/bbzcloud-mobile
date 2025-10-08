/**
 * BBZCloud Mobile - Global Floating Action Button
 * 
 * Draggable FAB that's always visible to access the App Switcher
 * 
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { IonFabButton, IonIcon, IonBadge, IonMenuToggle } from '@ionic/react';
import { appsOutline } from 'ionicons/icons';
import { useAppSwitcher } from '../contexts/AppSwitcherContext';
import './GlobalFAB.css';

const GlobalFAB: React.FC = () => {
  const { loadedApps } = useAppSwitcher();
  const [position, setPosition] = useState({ x: 16, y: 70 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fabRef = useRef<HTMLDivElement>(null);

  // Load saved position from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('fab-position');
    if (saved) {
      try {
        const savedPos = JSON.parse(saved);
        setPosition(savedPos);
      } catch (e) {
        console.error('Failed to load FAB position:', e);
      }
    }
  }, []);

  // Save position to localStorage
  const savePosition = (pos: { x: number; y: number }) => {
    localStorage.setItem('fab-position', JSON.stringify(pos));
  };

  // Handle drag start
  const handleDragStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y
    });
  };

  // Handle drag move
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;

    const newX = clientX - dragStart.x;
    const newY = clientY - dragStart.y;

    // Get window dimensions
    const maxX = window.innerWidth - 56; // FAB width
    const maxY = window.innerHeight - 56; // FAB height

    // Constrain to window boundaries
    const constrainedX = Math.max(0, Math.min(newX, maxX));
    const constrainedY = Math.max(0, Math.min(newY, maxY));

    setPosition({ x: constrainedX, y: constrainedY });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    savePosition(position);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
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
  }, [isDragging, dragStart, position]);

  return (
    <div
      ref={fabRef}
      className={`global-fab-container ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 9999
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <IonMenuToggle>
        <IonFabButton className="app-switcher-fab-global" size="small">
          <IonIcon icon={appsOutline} />
          {loadedApps.length > 0 && (
            <IonBadge color="primary" className="fab-badge-global">
              {loadedApps.length}
            </IonBadge>
          )}
        </IonFabButton>
      </IonMenuToggle>
    </div>
  );
};

export default GlobalFAB;
