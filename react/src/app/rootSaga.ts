import {put, select, take, takeEvery} from "typed-redux-saga";
import {
    continueLinking,
    endLinking, linkToNewDialog, linkToNewDialogClose, restoreDiagram,
    selectDiagramEditor,
    startLinking
} from "../features/classDiagram/diagramEditorSlice";

export function* startLinkingSaga() {
    let waitingLinkingEnd = true;
    const editor = yield* select(selectDiagramEditor)
    const startingDiagram = editor.diagram;
    while (waitingLinkingEnd) {
        const result = yield* take([continueLinking, endLinking]);
        switch (result.type) {
            case typeof(continueLinking):
                break;
            case continueLinking:
                break;
            case endLinking:
                waitingLinkingEnd = true;
                break;
        }
    }
    yield put(linkToNewDialog)
    const success = yield* take(linkToNewDialogClose);
    if (!success.payload) {
        yield put(restoreDiagram(startingDiagram))
    }
}

export function* rootSaga() {
    yield takeEvery(startLinking, startLinkingSaga)
    //yield all([])
}
