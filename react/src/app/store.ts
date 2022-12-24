import {configureStore} from '@reduxjs/toolkit'
import {diagramEditorSlice} from '../features/classDiagram/diagramEditorSlice';
import createSagaMiddleware from 'redux-saga'
import {rootSaga} from "./rootSaga";

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
    reducer: {
        diagramEditor: diagramEditorSlice.reducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({thunk: false})
        .concat(sagaMiddleware)
})

sagaMiddleware.run(rootSaga)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
