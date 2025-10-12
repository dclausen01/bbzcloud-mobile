/**
 * BBZCloud Mobile - Custom Apps Modal Component
 * 
 * Modal displaying the list of custom apps with add/edit/delete options
 * 
 * @version 1.0.0
 */

import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
} from '@ionic/react';
import { add, create, trash } from 'ionicons/icons';
import type { CustomAppsModalProps } from '../types';
import './CustomAppsModal.css';

const CustomAppsModal: React.FC<CustomAppsModalProps> = ({
  isOpen,
  customApps,
  onDismiss,
  onAppPress,
  onAddNew,
  onEdit,
  onDelete,
}) => {
  const handleAppClick = (app: typeof customApps[0]) => {
    // Convert CustomApp to App type for opening
    onAppPress({
      id: app.id,
      title: app.title,
      url: app.url,
      icon: app.icon,
      color: app.color,
      isCustom: true,
    });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Eigene Apps</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onDismiss}>Schließen</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton onClick={onAddNew}>
              <IonIcon slot="icon-only" icon={add} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="custom-apps-modal-content">
        <div className="custom-apps-header">
          <IonButton expand="block" onClick={onAddNew} color="primary">
            <IonIcon slot="start" icon={add} />
            + neuer Eintrag
          </IonButton>
        </div>

        {customApps.length === 0 ? (
          <div className="custom-apps-empty">
            <IonIcon icon={add} className="empty-icon" />
            <h2>Keine eigenen Apps</h2>
            <p>Fügen Sie Ihre erste eigene App hinzu, indem Sie auf "+ neuer Eintrag" klicken.</p>
          </div>
        ) : (
          <IonList>
            {customApps.map((app) => (
              <IonItemSliding key={app.id}>
                <IonItem
                  button
                  onClick={() => handleAppClick(app)}
                  className="custom-app-item"
                >
                  <div
                    className="custom-app-color-indicator"
                    style={{ backgroundColor: app.color }}
                  />
                  <IonLabel>
                    <h2>{app.title}</h2>
                    <p className="custom-app-url">{app.url}</p>
                  </IonLabel>
                </IonItem>

                <IonItemOptions side="end">
                  <IonItemOption color="primary" onClick={() => onEdit(app)}>
                    <IonIcon slot="icon-only" icon={create} />
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => onDelete(app.id)}>
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonModal>
  );
};

export default CustomAppsModal;
