import {put, select, take, takeEvery} from "typed-redux-saga";
import {
    addNodeAndConnect,
    continueLinking,
    endLinking, linkToNewDialog, linkToNewDialogClose, restoreDiagram,
    selectDiagramEditor,
    startLinking, stopLinking
} from "../features/classDiagram/diagramEditorSlice";

export function* startLinkingSaga() {
    let waitingLinkingEnd = true;
    const editor = yield* select(selectDiagramEditor)
    const startingDiagram = editor.diagram;
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
    yield put(linkToNewDialog());
    const dialogResult = yield* take(linkToNewDialogClose);
    if (dialogResult.payload.success) {
        yield put(addNodeAndConnect({name: dialogResult.payload.selectedName!}));
    }
    else{
        yield put(restoreDiagram(startingDiagram))
    }
    yield put(stopLinking());
}

export function* rootSaga() {
    yield takeEvery(startLinking, startLinkingSaga)
    //yield all([])
}
