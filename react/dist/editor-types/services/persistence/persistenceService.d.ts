import { AtomEffect } from 'recoil';
import type { PersistedState } from "../../common/persistence/statePersistence";
import { PersistenceMode, STORAGE_KEY, STORAGE_VERSION } from "../../common/persistence/statePersistence";
export type { PersistedState };
export { PersistenceMode, STORAGE_KEY, STORAGE_VERSION };
/**
 * Service wrapper around shared persistence helpers.
 */
export declare class PersistenceService {
    static localStoragePersistence: <T>(key: string) => AtomEffect<T>;
    static indexedDBPersistence: <T>(key: string) => AtomEffect<T>;
    static clearPersistedState: () => void;
    static setPersistenceMode: (mode: PersistenceMode) => void;
    static getPersistenceMode: () => PersistenceMode;
}
//# sourceMappingURL=persistenceService.d.ts.map