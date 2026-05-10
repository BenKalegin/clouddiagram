import type { PersistedState } from "../../common/persistence/statePersistence";
import {
    clearPersistedState,
    getPersistenceMode,
    PersistenceMode,
    setPersistenceMode,
    STORAGE_KEY,
    STORAGE_VERSION
} from "../../common/persistence/statePersistence";

export type { PersistedState };
export { PersistenceMode, STORAGE_KEY, STORAGE_VERSION };

/**
 * Service wrapper around shared persistence helpers.
 * Atom-level persistence now lives in `common/state/persistentAtoms.ts`.
 */
export class PersistenceService {
    static clearPersistedState = (): void => clearPersistedState();
    static setPersistenceMode = (mode: PersistenceMode): void => setPersistenceMode(mode);
    static getPersistenceMode = (): PersistenceMode => getPersistenceMode();
}
