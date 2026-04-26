import { AtomEffect } from 'recoil';
import { DiagramElement, Id } from '../../package/packageModel';
export interface PersistedState {
    elements: {
        [id: Id]: DiagramElement;
    };
    activeDiagramId: Id;
    openDiagramIds: Id[];
    lastUpdated: number;
}
export declare const STORAGE_KEY = "clouddiagram_state";
export declare const STORAGE_VERSION = "1.0";
export declare const PersistenceMode: {
    readonly Local: "local";
    readonly Host: "host";
};
export type PersistenceMode = (typeof PersistenceMode)[keyof typeof PersistenceMode];
export declare function setPersistenceMode(mode: PersistenceMode): void;
export declare function getPersistenceMode(): PersistenceMode;
export declare const localStoragePersistence: <T>(key: string) => AtomEffect<T>;
export declare const indexedDBPersistence: <T>(key: string) => AtomEffect<T>;
export declare const clearPersistedState: () => void;
//# sourceMappingURL=statePersistence.d.ts.map