import {configureStore} from '@reduxjs/toolkit'
import {classDiagramSlice} from '../features/classDiagram/classDiagramSlice';
import createSagaMiddleware from 'redux-saga'
import {rootSaga} from "./rootSaga";
import {diagramTabsSlice} from "../features/diagramTabs/diagramTabsSlice";
import {sequenceDiagramSlice} from "../features/sequenceDiagram/sequenceDiagramSlice";
import {browserSlice} from "../features/browser/browserSlice";
import {toolboxSlice} from "../features/toolbox/toolboxSlice";

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
    reducer: {
        classDiagramEditor: classDiagramSlice.reducer,
        sequenceDiagramEditor: sequenceDiagramSlice.reducer,
        diagramTabs: diagramTabsSlice.reducer,
        browser: browserSlice.reducer,
        toolbox: toolboxSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({thunk: false})
        .concat(sagaMiddleware)
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
