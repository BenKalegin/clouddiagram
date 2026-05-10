import {atomFamily} from "jotai-family";
import {atom} from "jotai";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";

export type ErDiagramDirection = "TB" | "BT" | "LR" | "RL";

export interface ErDiagramMetadata {
    direction?: ErDiagramDirection;
}

export interface ErDiagramState extends StructureDiagramState {
    er?: ErDiagramMetadata;
}

export const erDiagramSelector = atomFamily((id: DiagramId) =>
    atom(
        (get) => get(elementsAtom(id)) as ErDiagramState,
        (_get, set, newValue: ErDiagramState) => {
            set(elementsAtom(id), newValue);
        }
    )
);
