import { configureStore } from '@reduxjs/toolkit'
import {diagramEditorSlice} from '../features/classDiagram/diagramEditorSlice';

export const store = configureStore({
    reducer: {
        diagramEditor: diagramEditorSlice.reducer,
    },
})

// theoretical model should be like this:
// Diagram:
// - metadata
// - content

// appState
//  - openedDiagrams: Diagram[]
//  - current diagram: DiagramEditor
//  - current user

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
