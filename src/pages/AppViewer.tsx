import React, { useEffect, useRef, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonLoading
} from '@ionic/react';
import { close, arrowBack, refresh } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import './AppViewer.css';

interface AppViewerLocationState {
  url: string;
  appName: string;
  toolbarColor?: string;
}

const AppViewer: React.FC = () => {
  const history = useHistory();
  const location = useLocation<AppViewerLocationState>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { url, appName, toolbarColor } = location.state || {};

  useEffect(() => {
    if (!url) {
      // If no URL provided, go back
      history.goBack();
    }
  }, [url, history]);

  const handleClose = () => {
    history.goBack();
  };

  const handleRefresh = () => {
    if (iframeRef.current && url) {
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = url;
      setIsLoading(true);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': toolbarColor || '#3880ff' }}>
          <IonButtons slot="start">
            <IonButton onClick={handleClose}>
              <IonIcon icon={arrowBack} slot="icon-only" />
            </IonButton>
          </IonButtons>
          <IonTitle>{appName || 'App'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleRefresh}>
              <IonIcon icon={refresh} slot="icon-only" />
            </IonButton>
            <IonButton onClick={handleClose}>
              <IonIcon icon={close} slot="icon-only" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="app-viewer-content">
        <IonLoading isOpen={isLoading} message="Loading..." />
        {url && (
          <iframe
            ref={iframeRef}
            src={url}
            className="app-viewer-iframe"
            onLoad={handleIframeLoad}
            allow="camera; microphone; geolocation"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default AppViewer;
