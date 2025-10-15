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

  // Initialize local apps only once to prevent losing drag & drop changes
  React.useEffect(() => {
    setLocalApps(apps);
  }, []); // Empty dependency array - only run on mount

  /**
   * Handle drag start
   */
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    if (!isEditMode) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  /**
   * Handle drag over
   */
  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    if (!isEditMode || draggedIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (index !== draggedIndex) {
      // Get the actual indices in localApps
      const fromAppId = filteredApps[draggedIndex].id;
      const toAppId = filteredApps[index].id;
      
      const fromIndex = localApps.findIndex(app => app.id === fromAppId);
      const toIndex = localApps.findIndex(app => app.id === toAppId);
      
      const newApps = [...localApps];
      const draggedApp = newApps[fromIndex];
      newApps.splice(fromIndex, 1);
      newApps.splice(toIndex, 0, draggedApp);
      setLocalApps(newApps);
      setDraggedIndex(index);
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
   * Filter apps based on search query
   * In edit mode, show all apps including hidden ones
   */
  const filteredApps = useMemo(() => {
    // In edit mode, show all apps (including hidden ones)
    // Otherwise, only show visible apps
    let filtered = isEditMode ? localApps : localApps.filter(app => app.isVisible !== false);

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
        {filteredApps.map((app, index) => (
          <IonCol
            key={app.id}
            size="6"
            sizeMd="4"
            sizeLg="3"
            sizeXl="2"
            style={{
              opacity: draggedIndex === index ? 0.5 : 1
            }}
          >
            <div
              draggable={isEditMode}
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
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
        ))}
        
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
