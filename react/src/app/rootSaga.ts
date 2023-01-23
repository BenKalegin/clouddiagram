import {call} from "typed-redux-saga";
import {diagramEditorSagas} from "../features/diagramEditor/diagramEditorSagas";

export function* rootSaga() {
    yield call(diagramEditorSagas)
}

