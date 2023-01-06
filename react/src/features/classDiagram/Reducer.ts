import {ClassDiagramEditor} from "./classDiagramSlice";

enum CloudDiagramActionKind {
    DRAG = "DRAG"
}

interface CloudDiagramAction {
    type: CloudDiagramActionKind;
    payload: number;
}

export function cloudDiagramReducer(state: ClassDiagramEditor, action: CloudDiagramAction): ClassDiagramEditor {
    return state;
}

