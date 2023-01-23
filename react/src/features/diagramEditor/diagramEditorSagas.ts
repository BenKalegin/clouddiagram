import {takeEvery} from "typed-redux-saga";
import {startLinking, startNodeResize} from "./diagramEditorSlice";
import {startLinkingSaga} from "./startLinkingSaga";
import {startNodeResizeSaga} from "./nodeResizeSaga";

export function* diagramEditorSagas() {
    yield takeEvery(startLinking, startLinkingSaga)
    yield takeEvery(startNodeResize, startNodeResizeSaga)
}
