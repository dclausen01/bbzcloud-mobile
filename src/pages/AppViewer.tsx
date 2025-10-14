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
import { close, refresh } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import { SCHULCLOUD_INJECTION } from '../services/InjectionScripts';
import './AppViewer.css';

interface AppViewerLocationState {
  url: string;
  appName: string;
  toolbarColor?: string;
  appId?: string;
}

const AppViewer: React.FC = () => {
  const history = useHistory();
  const location = useLocation<AppViewerLocationState>();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { url, appName, toolbarColor, appId } = location.state || {};

  useEffect(() => {
    if (!url) {
      // If no URL provided, go back
      history.goBack();
    }
  }, [url, history]);

  const handleClose = () => {
    history.push('/home');
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
    
    // Inject CSS for schul.cloud
    if (appId === 'schulcloud' && iframeRef.current?.contentWindow) {
      try {
        const iframeDoc = iframeRef.current.contentWindow.document;
        
        // Inject CSS
        if (SCHULCLOUD_INJECTION.css) {
          const style = iframeDoc.createElement('style');
          style.textContent = SCHULCLOUD_INJECTION.css;
          iframeDoc.head.appendChild(style);
          console.log('[AppViewer] schul.cloud CSS injected');
        }
        
        // Inject JS
        if (SCHULCLOUD_INJECTION.js) {
          const script = iframeDoc.createElement('script');
          script.textContent = SCHULCLOUD_INJECTION.js;
          iframeDoc.body.appendChild(script);
          console.log('[AppViewer] schul.cloud JS injected');
        }
      } catch (error) {
        console.warn('[AppViewer] Could not inject scripts (CORS):', error);
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': toolbarColor || '#3880ff' }}>
          <IonButtons slot="start">
            <IonButton onClick={handleClose}>
              <IonIcon icon={close} slot="icon-only" />
            </IonButton>
          </IonButtons>
          <IonTitle>{appName || 'App'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleRefresh}>
              <IonIcon icon={refresh} slot="icon-only" />
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
