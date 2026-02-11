import { AtomEffect } from 'recoil';
import type { PersistedState } from "../../common/persistence/statePersistence";
import {
    clearPersistedState,
    indexedDBPersistence,
    localStoragePersistence,
    STORAGE_KEY,
    STORAGE_VERSION
} from "../../common/persistence/statePersistence";

export type { PersistedState };
export { STORAGE_KEY, STORAGE_VERSION };

/**
 * Service wrapper around shared persistence helpers.
 */
export class PersistenceService {
    static localStoragePersistence = <T>(key: string): AtomEffect<T> => localStoragePersistence<T>(key);
    static indexedDBPersistence = <T>(key: string): AtomEffect<T> => indexedDBPersistence<T>(key);
    static clearPersistedState = (): void => clearPersistedState();
}
