import {put, take} from "typed-redux-saga";
import {continueNodeResize, endLinking, endNodeResize} from "./diagramEditorSlice";
import {continueLinking} from "../classDiagram/classDiagramSlice";
import {Diagram} from "../../common/model";
import {select} from "../../app/store";
import {ElementType} from "../../package/packageModel";
import {DiagramHandler} from "./diagramEditorModel";
import {ClassDiagramHandler} from "../classDiagram/classDiagramHandler";
import {SequenceDiagramHandler} from "../sequenceDiagram/sequenceDiagramHandler";

export function* startNodeResizeSaga() {
    yield* take([continueNodeResize, endNodeResize]);
    let waitingResizeEnd = true;
    while (waitingResizeEnd) {
        const action = yield* take([continueLinking, endLinking]);

        switch (action.type) {
            case continueLinking.type:
                break;
            case endLinking.type:
                waitingResizeEnd = false;
                break;
            default:
                break;
        }

        yield* put(clearSnapGuides())

    }
}
