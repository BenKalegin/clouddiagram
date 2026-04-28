import {PrimitiveAtom} from "jotai";
import {atomFamily, atomWithStorage} from "jotai/utils";
import {PersistenceMode, STORAGE_KEY, getPersistenceMode} from "../persistence/statePersistence";

const buildStorageKey = (key: string): string => `${STORAGE_KEY}_${key}`;

interface SyncStorage<T> {
    getItem: (key: string, initialValue: T) => T;
    setItem: (key: string, newValue: T) => void;
    removeItem: (key: string) => void;
}

function makeLocalStorageAdapter<T>(): SyncStorage<T> {
    return {
        getItem: (key, initialValue) => {
            if (getPersistenceMode() === PersistenceMode.Host) return initialValue;
            try {
                const stored = localStorage.getItem(buildStorageKey(key));
                if (stored == null) return initialValue;
                return JSON.parse(stored) as T;
            } catch (error) {
                console.error(`Error parsing saved state for ${key}:`, error);
                return initialValue;
            }
        },
        setItem: (key, newValue) => {
            if (getPersistenceMode() === PersistenceMode.Host) return;
            try {
                localStorage.setItem(buildStorageKey(key), JSON.stringify(newValue));
            } catch (error) {
                console.error(`Error saving state for ${key}:`, error);
            }
        },
        removeItem: (key) => {
            try {
                localStorage.removeItem(buildStorageKey(key));
            } catch (error) {
                console.error(`Error removing state for ${key}:`, error);
            }
        }
    };
}

/**
 * Drop-in replacement for `atom(...)` with `localStoragePersistence` AtomEffect.
 * The persisted value is loaded lazily on first subscription (jotai onMount),
 * and write-through happens on every set.
 *
 * Host-mode (axonize-embedded) skips both reads and writes — the host owns state.
 */
export function persistentAtom<T>(storageKey: string, defaultValue: T): PrimitiveAtom<T> {
    return atomWithStorage<T>(storageKey, defaultValue, makeLocalStorageAdapter<T>()) as unknown as PrimitiveAtom<T>;
}

/**
 * Drop-in replacement for `atomFamily(...)` whose members were each given a
 * `localStoragePersistence` AtomEffect. Each family member is persisted under
 * `${storageKeyPrefix}_${paramToKey(param)}`.
 */
export function persistentAtomFamily<T, Param>(
    storageKeyPrefix: string,
    initialFn: (param: Param) => T,
    paramToKey: (param: Param) => string = String
) {
    return atomFamily((param: Param) =>
        atomWithStorage<T>(
            `${storageKeyPrefix}_${paramToKey(param)}`,
            initialFn(param),
            makeLocalStorageAdapter<T>()
        ) as unknown as PrimitiveAtom<T>
    );
}
