import {atom, PrimitiveAtom} from "jotai";
import {atomFamily} from "jotai-family";
import {PersistenceMode, STORAGE_KEY, getPersistenceMode} from "../persistence/statePersistence";

const buildStorageKey = (key: string): string => `${STORAGE_KEY}_${key}`;

// Drag interactions fire 60+ writes/sec; serializing and persisting each one
// chokes the main thread. State stays live in memory — only the storage
// write is deferred.
const STORAGE_WRITE_DEBOUNCE_MS = 200;

interface PendingWrite {
    timer: ReturnType<typeof setTimeout>;
    latestValue: unknown;
}

const pendingWrites = new Map<string, PendingWrite>();

function flushWrite(storageKey: string, value: unknown): void {
    try {
        localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
        console.error(`Error saving state for ${storageKey}:`, error);
    }
}

function flushAllPendingWrites(): void {
    for (const [storageKey, pending] of pendingWrites) {
        clearTimeout(pending.timer);
        flushWrite(storageKey, pending.latestValue);
    }
    pendingWrites.clear();
}

function scheduleWrite(storageKey: string, value: unknown): void {
    if (getPersistenceMode() === PersistenceMode.Host) return;
    const existing = pendingWrites.get(storageKey);
    if (existing) clearTimeout(existing.timer);
    const timer = setTimeout(() => {
        const current = pendingWrites.get(storageKey);
        pendingWrites.delete(storageKey);
        if (current) flushWrite(storageKey, current.latestValue);
    }, STORAGE_WRITE_DEBOUNCE_MS);
    pendingWrites.set(storageKey, {timer, latestValue: value});
}

function readFromStorage<T>(storageKey: string, fallback: T): T {
    if (getPersistenceMode() === PersistenceMode.Host) return fallback;
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored == null) return fallback;
        return JSON.parse(stored) as T;
    } catch (error) {
        console.error(`Error parsing saved state for ${storageKey}:`, error);
        return fallback;
    }
}

if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", flushAllPendingWrites);
    window.addEventListener("pagehide", flushAllPendingWrites);
}

if (import.meta.hot) {
    import.meta.hot.dispose(flushAllPendingWrites);
}

/**
 * Persistent atom backed by localStorage. The initial value is loaded eagerly
 * at atom-creation time (synchronous read), and every subsequent set is
 * write-through with a per-key debounce.
 *
 * Avoids `atomWithStorage`'s onMount race: when a fresh atom is set and then
 * mounted, `atomWithStorage` re-reads storage on mount and clobbers the value.
 */
export function persistentAtom<T>(storageKey: string, defaultValue: T): PrimitiveAtom<T> {
    const fullKey = buildStorageKey(storageKey);
    const initial = readFromStorage(fullKey, defaultValue);
    const baseAtom = atom<T>(initial);
    const wrapped = atom(
        (get) => get(baseAtom),
        (get, set, update: T | ((prev: T) => T)) => {
            const prev = get(baseAtom);
            const next = typeof update === "function" ? (update as (prev: T) => T)(prev) : update;
            if (Object.is(next, prev)) return;
            set(baseAtom, next);
            scheduleWrite(fullKey, next);
        }
    );
    return wrapped as unknown as PrimitiveAtom<T>;
}

/**
 * Persistent `atomFamily` backed by localStorage. Each family member is
 * persisted under `${storageKeyPrefix}_${paramToKey(param)}`.
 */
export function persistentAtomFamily<T, Param>(
    storageKeyPrefix: string,
    initialFn: (param: Param) => T,
    paramToKey: (param: Param) => string = String
) {
    return atomFamily((param: Param) =>
        persistentAtom<T>(`${storageKeyPrefix}_${paramToKey(param)}`, initialFn(param))
    );
}
