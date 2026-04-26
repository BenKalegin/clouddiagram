import { DiagramId } from "./diagramEditorModel";
import { DiagramElement } from "../../package/packageModel";
import { Diagram } from "../../common/model";
export interface UndoableOperation {
    diagramId: DiagramId;
    undo: (get?: (atom: any) => any, set?: (atom: any, value: any) => void) => void;
    redo: (get?: (atom: any) => any, set?: (atom: any, value: any) => void) => void;
    description: string;
}
export interface HistoryState {
    past: UndoableOperation[];
    future: UndoableOperation[];
    maxHistoryLength: number;
}
export declare const historyAtom: import("recoil").RecoilState<HistoryState>;
export declare const canUndoSelector: (param: string | undefined) => import("recoil").RecoilValueReadOnly<boolean>;
export declare const canRedoSelector: (param: string | undefined) => import("recoil").RecoilValueReadOnly<boolean>;
export declare function createElementChangeOperation(diagramId: DiagramId, elementId: string, oldElement: DiagramElement, newElement: DiagramElement, description: string, setFn?: (atom: any, value: any) => void): UndoableOperation;
export declare function createDiagramChangeOperation(diagramId: DiagramId, oldDiagram: Diagram, newDiagram: Diagram, description: string, setFn?: (atom: any, value: any) => void): UndoableOperation;
export declare function addToHistory(get: (atom: any) => any, set: (atom: any, value: any) => void, operation: UndoableOperation): void;
export declare function undoOperation(get: (atom: any) => any, set: (atom: any, value: any) => void, diagramId: DiagramId): void;
export declare function redoOperation(get: (atom: any) => any, set: (atom: any, value: any) => void, diagramId: DiagramId): void;
//# sourceMappingURL=historyModel.d.ts.map