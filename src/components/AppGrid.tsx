/**
 * BBZCloud Mobile - App Grid Component
 * 
 * Displays a grid of app cards with search and filtering
 * 
 * @version 1.0.0
 */

import React, { useMemo } from 'react';
import { IonGrid, IonRow, IonCol } from '@ionic/react';
import AppCard from './AppCard';
import type { AppGridProps } from '../types';
import './AppGrid.css';

const AppGrid: React.FC<AppGridProps> = ({ 
  apps, 
  onAppPress, 
  searchQuery = ''
}) => {
  /**
   * Filter apps based on search query
   */
  const filteredApps = useMemo(() => {
    let filtered = apps.filter(app => app.isVisible !== false);

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.title.toLowerCase().includes(query) ||
        app.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [apps, searchQuery]);

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
        {filteredApps.map(app => (
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
            />
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );
};

export default AppGrid;
