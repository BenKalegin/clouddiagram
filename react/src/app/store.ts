import {configureStore} from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import {rootSaga} from "./rootSaga";
import {diagramTabsSlice} from "../features/diagramTabs/diagramTabsSlice";
import {browserSlice} from "../features/browser/browserSlice";
import {toolboxSlice} from "../features/toolbox/toolboxSlice";
import {diagramEditorSlice} from "../features/diagramEditor/diagramEditorSlice";
import {packageSlice} from "../package/packageSlice";
import { select as _select } from 'typed-redux-saga';
import {throttleMiddleware} from "./throttleMiddleware";

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
    reducer: {
        diagramEditor: diagramEditorSlice.reducer,
        diagramTabs: diagramTabsSlice.reducer,
        browser: browserSlice.reducer,
        toolbox: toolboxSlice.reducer,
        package: packageSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({thunk: false})
        .concat(throttleMiddleware, sagaMiddleware)
})

sagaMiddleware.run(rootSaga)


// interface Selection {
//     focusedElement?: Id
//     selectedElements: Id[]
// }
//
// export interface DiagramEditor {
//     selection: Selection
//     linking?: Linking
//     diagramId: Id
// }
//
// interface UpdateRootState {
//     elementTree: ElementTree
//     browser: Browser
//     inspector: Inspector
//     componentPalette: ComponentPalette
//     DiagramEditors: DiagramEditor[]
//     activeDiagramId: Id
// }

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// cannot infer type even  with typed-redux-saga for some reasons. This fixes it
export function* select<T>(fn: (state: RootState) => T) {
    return yield* _select(fn);
}

