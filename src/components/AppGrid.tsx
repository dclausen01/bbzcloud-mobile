/**
 * BBZCloud Mobile - App Grid Component
 * 
 * Displays a grid of app cards with search and filtering
 * 
 * @version 1.0.0
 */

import React, { useMemo, useState } from 'react';
import { IonGrid, IonRow, IonCol } from '@ionic/react';
import AppCard from './AppCard';
import CustomAppsButton from './CustomAppsButton';
import type { AppGridProps, App } from '../types';
import './AppGrid.css';

interface AppGridPropsExtended extends AppGridProps {
  onCustomAppsPress?: () => void;
}

const AppGrid: React.FC<AppGridPropsExtended> = ({ 
  apps, 
  onAppPress, 
  searchQuery = '',
  onCustomAppsPress,
  isEditMode = false,
  onReorder,
  onToggleVisibility
}) => {
  const [localApps, setLocalApps] = useState<App[]>(apps);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Update local apps when props change, but only if not currently dragging
  React.useEffect(() => {
    if (draggedIndex === null) {
      setLocalApps(apps);
    }
  }, [apps, draggedIndex]);

  /**
   * Handle drag start
   */
  const handleDragStart = (app: App) => (e: React.DragEvent) => {
    if (!isEditMode) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(app));
    setDraggedIndex(localApps.findIndex(a => a.id === app.id));
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (targetApp: App) => (e: React.DragEvent) => {
    if (!isEditMode || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const targetIndex = localApps.findIndex(a => a.id === targetApp.id);
    
    if (targetIndex !== draggedIndex) {
      const newApps = [...localApps];
      const draggedApp = newApps[draggedIndex];
      newApps.splice(draggedIndex, 1);
      newApps.splice(targetIndex, 0, draggedApp);
      setLocalApps(newApps);
      setDraggedIndex(targetIndex);
    }
  };

  /**
   * Handle drop
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex !== null && onReorder) {
      // Save the reordered apps
      onReorder(localApps);
    }
    setDraggedIndex(null);
  };

  /**
   * Handle drag end
   */
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  /**
   * Filter apps based on search query and visibility
   */
  const filteredApps = useMemo(() => {
    let filtered = localApps;

    // In normal mode, only show visible apps
    // In edit mode, show all apps (including hidden ones)
    if (!isEditMode) {
      filtered = filtered.filter(app => app.isVisible !== false);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.title.toLowerCase().includes(query) ||
        app.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [localApps, searchQuery, isEditMode]);

  if (filteredApps.length === 0) {
    return (
      <div className="app-grid-empty">
        <p>
          {searchQuery
            ? 'Keine Apps gefunden'
            : 'Keine Apps verfügbar'}
        </p>
      </div>
    );
  }

  return (
    <IonGrid className="app-grid">
      <IonRow>
        {filteredApps.map((app) => {
          const appIndex = localApps.findIndex(a => a.id === app.id);
          return (
            <IonCol
              key={app.id}
              size="6"
              sizeMd="4"
              sizeLg="3"
              sizeXl="2"
              style={{
                opacity: draggedIndex === appIndex ? 0.5 : 1
              }}
            >
              <div
                draggable={isEditMode}
                onDragStart={handleDragStart(app)}
                onDragOver={handleDragOver(app)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                style={{
                  cursor: isEditMode ? 'move' : 'default'
                }}
              >
                <AppCard 
                  app={app} 
                  onPress={onAppPress} 
                  isLoading={app.isLoading}
                  isEditMode={isEditMode}
                  onToggleVisibility={onToggleVisibility}
                />
              </div>
            </IonCol>
          );
        })}
        
        {/* Custom Apps Button - Only show when not searching and not in edit mode */}
        {!searchQuery && !isEditMode && onCustomAppsPress && (
          <IonCol
            size="6"
            sizeMd="4"
            sizeLg="3"
            sizeXl="2"
          >
            <CustomAppsButton onPress={onCustomAppsPress} />
          </IonCol>
        )}
      </IonRow>
    </IonGrid>
  );
};

export default AppGrid;
