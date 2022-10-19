import {ClassDiagramViewState} from "./Models";

enum CloudDiagramActionKind {
    DRAG = "DRAG"
}

interface CloudDiagramAction {
    type: CloudDiagramActionKind;
    payload: number;
}

export function cloudDiagramReducer(state: ClassDiagramViewState, action: CloudDiagramAction): ClassDiagramViewState {
    return state;
}

