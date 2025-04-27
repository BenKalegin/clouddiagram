import { atom, selectorFamily } from "recoil";
import { DiagramId, elementsAtom } from "./diagramEditorModel";
import { DiagramElement } from "../../package/packageModel";
import { Diagram } from "../../common/model";

// Define the interface for an undoable operation
export interface UndoableOperation {
  diagramId: DiagramId;
  undo: (get?: (atom: any) => any, set?: (atom: any, value: any) => void) => void;
  redo: (get?: (atom: any) => any, set?: (atom: any, value: any) => void) => void;
  description: string;
}

// Define the interface for the history state
export interface HistoryState {
  past: UndoableOperation[];
  future: UndoableOperation[];
  maxHistoryLength: number;
}

// Create an atom for the history state
export const historyAtom = atom<HistoryState>({
  key: 'history',
  default: {
    past: [],
    future: [],
    maxHistoryLength: 50 // Limit the history size to prevent memory issues
  }
});

// Create selectors to check if undo/redo is available
export const canUndoSelector = selectorFamily<boolean, DiagramId | undefined>({
  key: 'canUndo',
  get: (diagramId) => ({ get }) => {
    if (!diagramId) return false;
    const history = get(historyAtom);
    return history.past.some(op => op.diagramId === diagramId);
  }
});

export const canRedoSelector = selectorFamily<boolean, DiagramId | undefined>({
  key: 'canRedo',
  get: (diagramId) => ({ get }) => {
    if (!diagramId) return false;
    const history = get(historyAtom);
    return history.future.some(op => op.diagramId === diagramId);
  }
});

// Helper function to create an undoable operation for element changes
export function createElementChangeOperation(
  diagramId: DiagramId,
  elementId: string,
  oldElement: DiagramElement,
  newElement: DiagramElement,
  description: string,
  setFn?: (atom: any, value: any) => void
): UndoableOperation {
  return {
    diagramId,
    undo: (get?: (atom: any) => any, set?: (atom: any, value: any) => void) => {
      if (set) {
        set(elementsAtom(elementId), oldElement);
      } else if (setFn) {
        setFn(elementsAtom(elementId), oldElement);
      }
    },
    redo: (get?: (atom: any) => any, set?: (atom: any, value: any) => void) => {
      if (set) {
        set(elementsAtom(elementId), newElement);
      } else if (setFn) {
        setFn(elementsAtom(elementId), newElement);
      }
    },
    description
  };
}

// Helper function to create an undoable operation for diagram changes
export function createDiagramChangeOperation(
  diagramId: DiagramId,
  oldDiagram: Diagram,
  newDiagram: Diagram,
  description: string,
  setFn?: (atom: any, value: any) => void
): UndoableOperation {
  return {
    diagramId,
    undo: (get?: (atom: any) => any, set?: (atom: any, value: any) => void) => {
      if (set) {
        set(elementsAtom(diagramId), oldDiagram);
      } else if (setFn) {
        setFn(elementsAtom(diagramId), oldDiagram);
      }
    },
    redo: (get?: (atom: any) => any, set?: (atom: any, value: any) => void) => {
      if (set) {
        set(elementsAtom(diagramId), newDiagram);
      } else if (setFn) {
        setFn(elementsAtom(diagramId), newDiagram);
      }
    },
    description
  };
}

// Function to add an operation to the history
export function addToHistory(
  get: (atom: any) => any,
  set: (atom: any, value: any) => void,
  operation: UndoableOperation
): void {
  const history = get(historyAtom);

  // Add the operation to the past and clear the future
  const newPast = [...history.past, operation];

  // Trim the history if it exceeds the maximum length
  const trimmedPast = newPast.length > history.maxHistoryLength
    ? newPast.slice(newPast.length - history.maxHistoryLength)
    : newPast;

  set(historyAtom, {
    ...history,
    past: trimmedPast,
    future: [] // Clear future when a new operation is performed
  });
}

// Function to undo the last operation for a specific diagram
export function undoOperation(
  get: (atom: any) => any,
  set: (atom: any, value: any) => void,
  diagramId: DiagramId
): void {
  const history = get(historyAtom) as HistoryState;

  // Find the last operation for this diagram
  const pastIndex = [...history.past].reverse().findIndex(op => op.diagramId === diagramId);

  if (pastIndex === -1) return; // No operations to undo for this diagram

  const actualIndex = history.past.length - 1 - pastIndex;
  const operation = history.past[actualIndex];

  // Execute the undo function
  operation.undo(get, set);

  // Move the operation from past to future
  const newPast = [...history.past];
  newPast.splice(actualIndex, 1);

  set(historyAtom, {
    ...history,
    past: newPast,
    future: [operation, ...history.future]
  });
}

// Function to redo the next operation for a specific diagram
export function redoOperation(
  get: (atom: any) => any,
  set: (atom: any, value: any) => void,
  diagramId: DiagramId
): void {
  const history = get(historyAtom);

  // Find the first operation in the future for this diagram
  const futureIndex = history.future.findIndex((op: { diagramId: string; }) => op.diagramId === diagramId);

  if (futureIndex === -1) return; // No operations to redo for this diagram

  const operation = history.future[futureIndex];

  // Execute the redo function
  operation.redo(get, set);

  // Move the operation from future to past
  const newFuture = [...history.future];
  newFuture.splice(futureIndex, 1);

  set(historyAtom, {
    ...history,
    past: [...history.past, operation],
    future: newFuture
  });
}
