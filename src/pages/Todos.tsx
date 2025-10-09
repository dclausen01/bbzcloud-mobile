/**
 * BBZCloud Mobile - Todos Page
 * 
 * Todo list management page
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonButton,
  IonIcon,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonFab,
  IonFabButton,
  IonAlert,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  useIonToast,
  IonSegment,
  IonSegmentButton,
  IonBadge
} from '@ionic/react';
import { add, trash, create, folderOutline, checkmarkCircle, ellipseOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { hideKeyboard } from '../utils/keyboardUtils';
import type { Todo, TodoState } from '../types';
import './Todos.css';

const STORAGE_KEY = 'bbzcloud_todos';

const Todos: React.FC = () => {
  const [presentToast] = useIonToast();
  const [todoState, setTodoState] = useState<TodoState>({
    todos: [],
    folders: ['Standard'],
    selectedFolder: 'Standard'
  });
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [showFolderAlert, setShowFolderAlert] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Load todos from storage
  useEffect(() => {
    loadTodos();
  }, []);

  // Save todos to storage whenever they change
  useEffect(() => {
    saveTodos();
  }, [todoState]);

  const loadTodos = async () => {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      if (value) {
        const loaded = JSON.parse(value);
        setTodoState(loaded);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
      presentToast({
        message: 'Fehler beim Laden der Todos',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
    }
  };

  const saveTodos = async () => {
    try {
      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify(todoState)
      });
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  };

  const addTodo = (text: string) => {
    if (!text.trim()) return;

    const newTodo: Todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      folder: todoState.selectedFolder
    };

    setTodoState(prev => ({
      ...prev,
      todos: [...prev.todos, newTodo]
    }));

    presentToast({
      message: 'Aufgabe hinzugefügt',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
  };

  const toggleTodo = (id: number) => {
    setTodoState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    }));
  };

  const deleteTodo = (id: number) => {
    setTodoState(prev => ({
      ...prev,
      todos: prev.todos.filter(todo => todo.id !== id)
    }));

    presentToast({
      message: 'Aufgabe gelöscht',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
  };

  const updateTodo = async (id: number, text: string) => {
    if (!text.trim()) return;

    setTodoState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.id === id ? { ...todo, text: text.trim() } : todo
      )
    }));

    setEditingTodo(null);
    await hideKeyboard();
    
    presentToast({
      message: 'Aufgabe aktualisiert',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
  };

  const addFolder = (name: string) => {
    if (!name.trim()) return;

    const folderName = name.trim();
    
    if (todoState.folders.includes(folderName)) {
      presentToast({
        message: 'Ordner existiert bereits',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
      return;
    }

    setTodoState(prev => ({
      ...prev,
      folders: [...prev.folders, folderName],
      selectedFolder: folderName
    }));

    presentToast({
      message: 'Ordner erstellt',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
  };

  const deleteFolder = (folderName: string) => {
    if (folderName === 'Standard') {
      presentToast({
        message: 'Standardordner kann nicht gelöscht werden',
        duration: 3000,
        color: 'warning',
        position: 'bottom'
      });
      return;
    }

    // Move todos from deleted folder to Standard
    setTodoState(prev => ({
      ...prev,
      todos: prev.todos.map(todo =>
        todo.folder === folderName ? { ...todo, folder: 'Standard' } : todo
      ),
      folders: prev.folders.filter(f => f !== folderName),
      selectedFolder: prev.selectedFolder === folderName ? 'Standard' : prev.selectedFolder
    }));

    presentToast({
      message: 'Ordner gelöscht',
      duration: 2000,
      color: 'success',
      position: 'bottom'
    });
  };

  const filteredTodos = todoState.todos
    .filter(todo => todo.folder === todoState.selectedFolder)
    .filter(todo => {
      if (filter === 'active') return !todo.completed;
      if (filter === 'completed') return todo.completed;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeTodoCount = todoState.todos.filter(
    todo => todo.folder === todoState.selectedFolder && !todo.completed
  ).length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Aufgaben</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSelect
            value={todoState.selectedFolder}
            onIonChange={e => setTodoState(prev => ({ ...prev, selectedFolder: e.detail.value }))}
            interface="popover"
            placeholder="Ordner wählen"
          >
            {todoState.folders.map(folder => (
              <IonSelectOption key={folder} value={folder}>
                {folder}
              </IonSelectOption>
            ))}
          </IonSelect>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowFolderAlert(true)}>
              <IonIcon slot="icon-only" icon={folderOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={filter} onIonChange={e => setFilter(e.detail.value as 'all' | 'active' | 'completed')}>
            <IonSegmentButton value="all">
              <IonLabel>Alle</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="active">
              <IonLabel>
                Offen
                {activeTodoCount > 0 && (
                  <IonBadge color="primary" style={{ marginLeft: '8px' }}>
                    {activeTodoCount}
                  </IonBadge>
                )}
              </IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="completed">
              <IonLabel>Erledigt</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Aufgaben</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonList>
          {filteredTodos.length === 0 ? (
            <IonItem>
              <IonLabel className="ion-text-center ion-padding">
                <p>Keine Aufgaben vorhanden</p>
              </IonLabel>
            </IonItem>
          ) : (
            filteredTodos.map(todo => (
              <IonItemSliding key={todo.id}>
                <IonItem>
                  <IonCheckbox
                    slot="start"
                    checked={todo.completed}
                    onIonChange={() => toggleTodo(todo.id)}
                  />
                  {editingTodo?.id === todo.id ? (
                    <IonInput
                      value={editingTodo.text}
                      enterkeyhint="done"
                      onIonChange={e => setEditingTodo({ ...editingTodo, text: e.detail.value || '' })}
                      onIonBlur={() => updateTodo(todo.id, editingTodo.text)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          updateTodo(todo.id, editingTodo.text);
                        }
                      }}
                      autofocus
                    />
                  ) : (
                    <IonLabel
                      className={todo.completed ? 'todo-completed' : ''}
                      style={{ whiteSpace: 'normal' }}
                    >
                      <h2>{todo.text}</h2>
                      <p>{new Date(todo.createdAt).toLocaleDateString('de-DE')}</p>
                    </IonLabel>
                  )}
                  <IonIcon
                    slot="end"
                    icon={todo.completed ? checkmarkCircle : ellipseOutline}
                    color={todo.completed ? 'success' : 'medium'}
                  />
                </IonItem>

                <IonItemOptions side="end">
                  <IonItemOption color="primary" onClick={() => setEditingTodo(todo)}>
                    <IonIcon slot="icon-only" icon={create} />
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => deleteTodo(todo.id)}>
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))
          )}
        </IonList>

        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => setShowAddAlert(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>
      </IonContent>

      {/* Add Todo Alert */}
      <IonAlert
        isOpen={showAddAlert}
        onDidDismiss={() => setShowAddAlert(false)}
        header="Neue Aufgabe"
        inputs={[
          {
            name: 'todoText',
            type: 'textarea',
            placeholder: 'Aufgabe eingeben...',
            attributes: {
              enterkeyhint: 'done'
            }
          }
        ]}
        buttons={[
          {
            text: 'Abbrechen',
            role: 'cancel'
          },
          {
            text: 'Hinzufügen',
            handler: (data) => {
              if (data.todoText) {
                addTodo(data.todoText);
              }
            }
          }
        ]}
      />

      {/* Folder Management Alert */}
      <IonAlert
        isOpen={showFolderAlert}
        onDidDismiss={() => setShowFolderAlert(false)}
        header="Ordner verwalten"
        message="Neuen Ordner erstellen oder bestehenden löschen"
        inputs={[
          {
            name: 'folderName',
            type: 'text',
            placeholder: 'Neuer Ordnername',
            attributes: {
              enterkeyhint: 'done'
            }
          }
        ]}
        buttons={[
          {
            text: 'Abbrechen',
            role: 'cancel'
          },
          {
            text: 'Ordner löschen',
            handler: () => {
              if (todoState.selectedFolder !== 'Standard') {
                deleteFolder(todoState.selectedFolder);
              }
            }
          },
          {
            text: 'Erstellen',
            handler: (data) => {
              if (data.folderName) {
                addFolder(data.folderName);
              }
            }
          }
        ]}
      />
    </IonPage>
  );
};

export default Todos;
