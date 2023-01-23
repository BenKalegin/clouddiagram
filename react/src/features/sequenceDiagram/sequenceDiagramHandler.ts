import {DiagramEditor, DiagramHandler} from "../diagramEditor/diagramEditorModel";
import {Coordinate} from "../../common/model";
import {findTargetActivation} from "./model";
import {current} from "@reduxjs/toolkit";
import {snapToBounds} from "../../common/Geometry/snap";
import {WritableDraft} from "immer/dist/internal";

export class SequenceDiagramHandler implements DiagramHandler {
    snapToElements(diagramPos: Coordinate, editor: DiagramEditor): Coordinate | undefined {
        const targetActivation = findTargetActivation(editor.diagram.activations, diagramPos);
        linking.targetElement = targetActivation?.id;
        if (targetActivation) {
            snapped = snapToBounds(diagramPos, targetActivation.placement);
        }

    }
}
