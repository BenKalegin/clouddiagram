import { Get, Set } from "./diagramEditorSlice";
import { DiagramId, elementsAtom } from "./diagramEditorModel";
import { addToHistory, createDiagramChangeOperation, createElementChangeOperation, redoOperation, undoOperation } from "./historyModel";
import { useRecoilTransaction_UNSTABLE } from "recoil";
import { activeDiagramIdAtom } from "../diagramTabs/diagramTabsModel";
import { Diagram } from "../../common/model";
import { DiagramElement } from "../../package/packageModel";

// Function to handle undo operation
export function handleUndo(get: Get, set: Set): void {
  const activeDiagramId = get(activeDiagramIdAtom);
  if (!activeDiagramId) return;

  undoOperation(get, set, activeDiagramId);
}

// Function to handle redo operation
export function handleRedo(get: Get, set: Set): void {
  const activeDiagramId = get(activeDiagramIdAtom);
  if (!activeDiagramId) return;

  redoOperation(get, set, activeDiagramId);
}

// Hook to use undo/redo in components
export function useUndoRedo() {
  const undoTransaction = useRecoilTransaction_UNSTABLE(
    ({ get, set }) => () => handleUndo(get, set),
    []
  );

  const redoTransaction = useRecoilTransaction_UNSTABLE(
    ({ get, set }) => () => handleRedo(get, set),
    []
  );

  return {
    undo: undoTransaction,
    redo: redoTransaction
  };
}

// Helper function to wrap operations with history tracking for diagram-level changes
export function withHistory<T>(
  operation: (get: Get, set: Set, ...args: any[]) => T,
  description: string
): (get: Get, set: Set, ...args: any[]) => T {
  return (get: Get, set: Set, ...args: any[]) => {
    const diagramId = get(activeDiagramIdAtom);
    if (!diagramId) return operation(get, set, ...args);

    // Get the current state before the operation
    const oldDiagram = get(elementsAtom(diagramId)) as Diagram;

    // Execute the operation
    const result = operation(get, set, ...args);

    // Get the new state after the operation
    const newDiagram = get(elementsAtom(diagramId)) as Diagram;

    // Only add to history if the diagram actually changed
    if (oldDiagram !== newDiagram) {
      // Create an operation that can undo/redo this change using the specialized function
      const historyOperation = createDiagramChangeOperation(
        diagramId,
        oldDiagram,
        newDiagram,
        description,
        set
      );

      // Add the operation to history
      addToHistory(get, set, historyOperation);
    }

    return result;
  };
}

// Helper function to wrap operations with history tracking for element-level changes
export function withElementHistory<T>(
  operation: (get: Get, set: Set, ...args: any[]) => T,
  elementId: string,
  description: string
): (get: Get, set: Set, ...args: any[]) => T {
  return (get: Get, set: Set, ...args: any[]) => {
    const diagramId = get(activeDiagramIdAtom);
    if (!diagramId) return operation(get, set, ...args);

    // Get the current state of the element before the operation
    const oldElement = get(elementsAtom(elementId)) as DiagramElement;

    // Execute the operation
    const result = operation(get, set, ...args);

    // Get the new state of the element after the operation
    const newElement = get(elementsAtom(elementId)) as DiagramElement;

    // Only add to history if the element actually changed
    if (oldElement !== newElement) {
      // Create an operation that can undo/redo this change using the specialized function
      const historyOperation = createElementChangeOperation(
        diagramId,
        elementId,
        oldElement,
        newElement,
        description,
        set
      );

      // Add the operation to history
      addToHistory(get, set, historyOperation);
    }

    return result;
  };
}
