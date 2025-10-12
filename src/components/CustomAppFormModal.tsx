/**
 * BBZCloud Mobile - Custom App Form Modal Component
 * 
 * Modal form for creating or editing a custom app
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
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
  IonLabel,
  IonInput,
  IonText,
} from '@ionic/react';
import { CUSTOM_APP_COLORS } from '../utils/constants';
import type { CustomAppFormModalProps } from '../types';
import './CustomAppFormModal.css';

const CustomAppFormModal: React.FC<CustomAppFormModalProps> = ({
  isOpen,
  onDismiss,
  onSave,
  editApp,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [selectedColor, setSelectedColor] = useState(CUSTOM_APP_COLORS[0]);
  const [selectedIcon] = useState('apps');
  const [errors, setErrors] = useState<{ title?: string; url?: string }>({});

  useEffect(() => {
    if (editApp) {
      setTitle(editApp.title);
      setUrl(editApp.url);
      setSelectedColor(editApp.color);
    } else {
      setTitle('');
      setUrl('');
      setSelectedColor(CUSTOM_APP_COLORS[0]);
    }
    setErrors({});
  }, [editApp, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: { title?: string; url?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Titel ist erforderlich';
    }

    if (!url.trim()) {
      newErrors.url = 'URL ist erforderlich';
    } else {
      // Basic URL validation - just check if it looks like a valid URL
      const urlTrimmed = url.trim();
      const hasProtocol = /^https?:\/\//i.test(urlTrimmed);
      const hasDomain = /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/|$)/i.test(urlTrimmed);
      
      if (!hasProtocol && !hasDomain) {
        newErrors.url = 'Bitte geben Sie eine gültige URL ein (z.B. example.com oder https://example.com)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    let formattedUrl = url.trim();
    // Add https:// if no protocol specified
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    onSave({
      title: title.trim(),
      url: formattedUrl,
      color: selectedColor,
      icon: selectedIcon,
    });

    // Reset form
    setTitle('');
    setUrl('');
    setSelectedColor(CUSTOM_APP_COLORS[0]);
    setErrors({});
  };

  const handleCancel = () => {
    setTitle('');
    setUrl('');
    setSelectedColor(CUSTOM_APP_COLORS[0]);
    setErrors({});
    onDismiss();
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{editApp ? 'App bearbeiten' : 'Neue App'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleCancel}>Abbrechen</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="custom-app-form-content">
        <IonList>
          <IonItem>
            <IonLabel position="stacked">
              Titel <IonText color="danger">*</IonText>
            </IonLabel>
            <IonInput
              value={title}
              onIonInput={(e) => setTitle(e.detail.value || '')}
              placeholder="z.B. Meine Webseite"
              clearInput
            />
          </IonItem>
          {errors.title && (
            <IonText color="danger" className="error-text">
              <p>{errors.title}</p>
            </IonText>
          )}

          <IonItem>
            <IonLabel position="stacked">
              URL <IonText color="danger">*</IonText>
            </IonLabel>
            <IonInput
              value={url}
              onIonInput={(e) => setUrl(e.detail.value || '')}
              placeholder="z.B. example.com oder https://example.com"
              clearInput
              type="url"
            />
          </IonItem>
          {errors.url && (
            <IonText color="danger" className="error-text">
              <p>{errors.url}</p>
            </IonText>
          )}

          <IonItem lines="none">
            <IonLabel>
              <h2>Farbe wählen</h2>
              <p>Wählen Sie eine Farbe für Ihre App</p>
            </IonLabel>
          </IonItem>

          <div className="color-picker">
            {CUSTOM_APP_COLORS.map((color) => (
              <button
                key={color}
                className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
                aria-label={`Farbe ${color}`}
              >
                {selectedColor === color && (
                  <span className="color-checkmark">✓</span>
                )}
              </button>
            ))}
          </div>
        </IonList>

        <div className="form-actions">
          <IonButton expand="block" onClick={handleSave} color="primary">
            {editApp ? 'Aktualisieren' : 'Hinzufügen'}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default CustomAppFormModal;
