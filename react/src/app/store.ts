import { configureStore } from '@reduxjs/toolkit'
import classDiagramReducer from '../features/classDiagram/classDiagramSlice';
import openDiagramsReducer from '../features/opendiagramSelector/openDiagramSlice';

export const store = configureStore({
    reducer: {
        diagramEditor: classDiagramReducer,
        openDiagrams: openDiagramsReducer
    },
})

// theoretical model should be
// Diagram:
// - metadata
// - content

// appState
//  - openedDiagrams: Diagram[]
//  - current diagram: DiagramEditor
//  - current user




// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
