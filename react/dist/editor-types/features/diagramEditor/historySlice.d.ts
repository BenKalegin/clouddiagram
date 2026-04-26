import { Get, Set } from "./diagramEditorSlice";
export declare function handleUndo(get: Get, set: Set): void;
export declare function handleRedo(get: Get, set: Set): void;
export declare function useUndoRedo(): {
    undo: () => void;
    redo: () => void;
};
export declare function withHistory<T>(operation: (get: Get, set: Set, ...args: any[]) => T, description: string): (get: Get, set: Set, ...args: any[]) => T;
export declare function withElementHistory<T>(operation: (get: Get, set: Set, ...args: any[]) => T, elementId: string, description: string): (get: Get, set: Set, ...args: any[]) => T;
//# sourceMappingURL=historySlice.d.ts.map