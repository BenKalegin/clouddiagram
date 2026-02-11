import { AtomEffect } from 'recoil';
import { DiagramElement, Id } from '../../package/packageModel';

// Define the structure of the persisted state
export interface PersistedState {
    elements: { [id: Id]: DiagramElement };
    activeDiagramId: Id;
    openDiagramIds: Id[];
    lastUpdated: number;
}

// Choose storage method (localStorage or IndexedDB)
export const STORAGE_KEY = 'clouddiagram_state';
export const STORAGE_VERSION = '1.0';

// LocalStorage implementation
export const localStoragePersistence = <T>(key: string): AtomEffect<T> => ({ setSelf, onSet, trigger }) => {
    // Load persisted value when atom is initialized
    if (trigger === 'get') {
        const savedValue = localStorage.getItem(`${STORAGE_KEY}_${key}`);
        if (savedValue != null) {
            try {
                setSelf(JSON.parse(savedValue));
            } catch (error) {
                console.error(`Error parsing saved state for ${key}:`, error);
            }
        }
    }

    // Save value to localStorage when atom changes
    onSet((newValue) => {
        try {
            localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(newValue));
        } catch (error) {
            console.error(`Error saving state for ${key}:`, error);
        }
    });
};

// IndexedDB implementation
export const indexedDBPersistence = <T>(key: string): AtomEffect<T> => ({ setSelf, onSet, trigger }) => {
    const dbName = STORAGE_KEY;
    const storeName = 'diagramState';
    const version = 1;

    // Open IndexedDB
    const openDB = (): Promise<IDBDatabase> => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, version);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    };

    // Load persisted value when atom is initialized
    if (trigger === 'get') {
        openDB()
            .then(db => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);

                request.onsuccess = () => {
                    if (request.result != null) {
                        setSelf(request.result);
                    }
                };

                transaction.oncomplete = () => db.close();
            })
            .catch(error => {
                console.error(`Error loading state for ${key}:`, error);
            });
    }

    // Save value to IndexedDB when atom changes
    onSet((newValue) => {
        openDB()
            .then(db => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                store.put(newValue, key);

                transaction.oncomplete = () => db.close();
            })
            .catch(error => {
                console.error(`Error saving state for ${key}:`, error);
            });
    });
};

// Helper function to clear persisted state
export const clearPersistedState = (): void => {
    try {
        // Clear localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(STORAGE_KEY)) {
                localStorage.removeItem(key);
            }
        });

        // Clear IndexedDB
        const request = indexedDB.deleteDatabase(STORAGE_KEY);
        request.onsuccess = () => console.log('IndexedDB state cleared');
        request.onerror = () => console.error('Error clearing IndexedDB state');
    } catch (error) {
        console.error('Error clearing persisted state:', error);
    }
};
