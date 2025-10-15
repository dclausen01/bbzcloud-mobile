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

  // Update local apps when props change
  React.useEffect(() => {
    setLocalApps(apps);
  }, [apps]);
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
        {filteredApps.map((app) => (
          <IonCol
            key={app.id}
            size="6"
            sizeMd="4"
            sizeLg="3"
            sizeXl="2"
          >
            <AppCard 
              app={app} 
              onPress={onAppPress} 
              isLoading={app.isLoading}
              isEditMode={isEditMode}
              onToggleVisibility={onToggleVisibility}
            />
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
