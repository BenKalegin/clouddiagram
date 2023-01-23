import {put, select, take} from "typed-redux-saga";
import {endLinking, linkToNewDialogClose, stopLinking} from "./diagramEditorSlice";
import {continueLinking, restoreDiagram} from "../classDiagram/classDiagramSlice";
import {selectActiveDiagramId, selectActiveEditor} from "../diagramTabs/diagramTabsSlice";
import {selectElementById} from "../../package/packageSlice";

export function* startLinkingSaga() {
    let waitingLinkingEnd = true;
    while (waitingLinkingEnd) {
        const result = yield* take([continueLinking, endLinking]);
        switch (result.type as string) {
            case continueLinking.type:
                break;
            case endLinking.type:
                waitingLinkingEnd = false;
                break;
            default:
                break;

        }
    }
    const linking = yield* select((state) => selectDiagramEditor(state).linking);

    if (!linking?.targetElement) {
        yield put(linkToNewDialog());
        const dialogResult = yield* take(linkToNewDialogClose);
        if (dialogResult.payload.success) {
            yield put(addNodeAndConnect({name: dialogResult.payload.selectedName!}));
        } else {
            yield put(restoreDiagram(startingDiagram))
        }
    } else {
        yield put(connectExisting())
    }
    yield put(stopLinking());
}
