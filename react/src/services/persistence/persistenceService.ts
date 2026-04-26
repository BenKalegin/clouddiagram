import { AtomEffect } from 'recoil';
import type { PersistedState } from "../../common/persistence/statePersistence";
import {
    clearPersistedState,
    getPersistenceMode,
    indexedDBPersistence,
    localStoragePersistence,
    PersistenceMode,
    setPersistenceMode,
    STORAGE_KEY,
    STORAGE_VERSION
} from "../../common/persistence/statePersistence";

export type { PersistedState };
export { PersistenceMode, STORAGE_KEY, STORAGE_VERSION };

/**
 * Service wrapper around shared persistence helpers.
 */
export class PersistenceService {
    static localStoragePersistence = <T>(key: string): AtomEffect<T> => localStoragePersistence<T>(key);
    static indexedDBPersistence = <T>(key: string): AtomEffect<T> => indexedDBPersistence<T>(key);
    static clearPersistedState = (): void => clearPersistedState();
    static setPersistenceMode = (mode: PersistenceMode): void => setPersistenceMode(mode);
    static getPersistenceMode = (): PersistenceMode => getPersistenceMode();
}
