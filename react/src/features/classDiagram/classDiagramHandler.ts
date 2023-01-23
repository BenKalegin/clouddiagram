import {DiagramEditor, DiagramHandler} from "../diagramEditor/diagramEditorModel";
import {Coordinate} from "../../common/model";
import {resizeNode} from "./model";
import {WritableDraft} from "immer/dist/internal";

export class ClassDiagramHandler implements DiagramHandler {
    snapToElements(diagramPos: Coordinate, editor: WritableDraft<DiagramEditor>): Coordinate | undefined {
        return undefined;
    }
}
