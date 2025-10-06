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
  searchQuery = '', 
  showFavoritesOnly = false 
}) => {
  /**
   * Filter apps based on search query and favorites filter
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

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(app => app.isFavorite);
    }

    return filtered;
  }, [apps, searchQuery, showFavoritesOnly]);

  /**
   * Separate favorites and non-favorites for sorting
   */
  const sortedApps = useMemo(() => {
    if (showFavoritesOnly) {
      return filteredApps;
    }

    const favorites = filteredApps.filter(app => app.isFavorite);
    const nonFavorites = filteredApps.filter(app => !app.isFavorite);

    return [...favorites, ...nonFavorites];
  }, [filteredApps, showFavoritesOnly]);

  if (sortedApps.length === 0) {
    return (
      <div className="app-grid-empty">
        <p>
          {searchQuery
            ? 'Keine Apps gefunden'
            : showFavoritesOnly
            ? 'Keine Favoriten vorhanden'
            : 'Keine Apps verfügbar'}
        </p>
      </div>
    );
  }

  return (
    <IonGrid className="app-grid">
      <IonRow>
        {sortedApps.map(app => (
          <IonCol
            key={app.id}
            size="6"
            sizeMd="4"
            sizeLg="3"
            sizeXl="2"
          >
            <AppCard app={app} onPress={onAppPress} />
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );
};

export default AppGrid;
