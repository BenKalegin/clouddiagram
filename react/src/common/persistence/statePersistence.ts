import { DiagramElement, Id } from '../../package/packageModel';

// Define the structure of the persisted state
export interface PersistedState {
    elements: { [id: Id]: DiagramElement };
    activeDiagramId: Id;
    openDiagramIds: Id[];
    lastUpdated: number;
}

// Storage configuration shared with the jotai-based persistent atom helpers in
// `common/state/persistentAtoms.ts`. The actual read/write is performed there.
export const STORAGE_KEY = 'clouddiagram_state';
export const STORAGE_VERSION = '1.0';

export const PersistenceMode = {
    Local: "local",
    Host: "host"
} as const;

export type PersistenceMode = (typeof PersistenceMode)[keyof typeof PersistenceMode];

let persistenceMode: PersistenceMode = PersistenceMode.Local;

export function setPersistenceMode(mode: PersistenceMode): void {
    persistenceMode = mode;
}

export function getPersistenceMode(): PersistenceMode {
    return persistenceMode;
}

// Helper function to clear all persisted state for the diagram editor.
export const clearPersistedState = (): void => {
    try {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(STORAGE_KEY)) {
                localStorage.removeItem(key);
            }
        });

        const request = indexedDB.deleteDatabase(STORAGE_KEY);
        request.onsuccess = () => console.log('IndexedDB state cleared');
        request.onerror = () => console.error('Error clearing IndexedDB state');
    } catch (error) {
        console.error('Error clearing persisted state:', error);
    }
};
