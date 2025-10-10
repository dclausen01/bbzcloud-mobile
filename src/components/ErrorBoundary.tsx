/**
 * BBZCloud Mobile - Error Boundary Component
 * 
 * Catches React errors and displays a fallback UI
 * 
 * @version 1.0.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { IonContent, IonPage, IonButton, IonIcon } from '@ionic/react';
import { refreshOutline, bugOutline } from 'ionicons/icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // TODO: You could also log the error to an error reporting service here
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <IonPage>
          <IonContent className="ion-padding">
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              padding: '20px'
            }}>
              <IonIcon 
                icon={bugOutline} 
                style={{ fontSize: '80px', color: 'var(--ion-color-danger)', marginBottom: '20px' }}
              />
              
              <h2>Oops! Ein Fehler ist aufgetreten</h2>
              
              <p style={{ color: 'var(--ion-color-medium)', marginBottom: '30px' }}>
                Die App ist auf ein Problem gestoßen und konnte nicht fortfahren.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details style={{
                  width: '100%',
                  maxWidth: '600px',
                  marginBottom: '20px',
                  padding: '15px',
                  backgroundColor: 'var(--ion-color-light)',
                  borderRadius: '8px',
                  textAlign: 'left'
                }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                    Fehlerdetails (nur im Entwicklungsmodus sichtbar)
                  </summary>
                  <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                    <strong>Error:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                      {this.state.error.toString()}
                    </pre>
                    {this.state.errorInfo && (
                      <>
                        <strong>Stack Trace:</strong>
                        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <IonButton onClick={this.handleReset} color="primary">
                  <IonIcon slot="start" icon={refreshOutline} />
                  Erneut versuchen
                </IonButton>
                
                <IonButton onClick={this.handleReload} color="medium" fill="outline">
                  App neu laden
                </IonButton>
              </div>

              <p style={{
                marginTop: '30px',
                fontSize: '14px',
                color: 'var(--ion-color-medium)'
              }}>
                Wenn das Problem weiterhin besteht, wenden Sie sich bitte an den Support.
              </p>
            </div>
          </IonContent>
        </IonPage>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
