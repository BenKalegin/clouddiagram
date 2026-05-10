import {useCallback, DependencyList} from "react";
import {Atom, PrimitiveAtom, useStore} from "jotai";

export type JotaiStore = ReturnType<typeof useStore>;

export type Get = <T>(atom: Atom<T>) => T;
export type Set = <T>(atom: PrimitiveAtom<T>, value: T | ((prev: T) => T)) => void;

export interface TransactionHelpers {
    get: Get;
    set: Set;
}

export function helpersFromStore(store: JotaiStore): TransactionHelpers {
    return {
        get: (atom) => store.get(atom),
        set: (atom, value) => store.set(atom, value)
    };
}

/**
 * Drop-in replacement for useRecoilTransaction_UNSTABLE: returns a callback that,
 * when invoked, provides synchronous get/set against the current jotai store.
 *
 * Jotai's store.set is not snapshot-atomic the way Recoil's transaction is, but
 * React batches updates inside event handlers (React 18+), which covers the
 * action-dispatch shape this codebase uses.
 */
export function useTransaction<Args extends unknown[], R>(
    fn: (helpers: TransactionHelpers) => (...args: Args) => R,
    deps: DependencyList = []
): (...args: Args) => R {
    const store = useStore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useCallback((...args: Args) => fn(helpersFromStore(store))(...args), [store, ...deps]);
}

/**
 * Drop-in replacement for useRecoilCallback. The provided builder receives
 * {get, set} bound to the current store; the returned callback can be invoked
 * with arbitrary arguments.
 */
export function useStoreCallback<Args extends unknown[], R>(
    fn: (helpers: TransactionHelpers) => (...args: Args) => R,
    deps: DependencyList = []
): (...args: Args) => R {
    return useTransaction(fn, deps);
}
