import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {ClassDiagramState} from "../classDiagram/model";
import {getDefaultDiagramState} from "../classDiagram/demo";

export enum DiagramType {
    Class,
    Sequence,
    Deployment
}

interface DiagramMetadata {
    title: string;
    // createdBy: string;
    // createdOn: Date;
    // diagramType: DiagramType;
    // version: string;
}

export interface Diagram {
    metadata: DiagramMetadata
    content: ClassDiagramState
}

export interface OpenDiagramsState {
    activeIndex: number;
    diagrams: Diagram[];
}

const initialState: OpenDiagramsState = {
    diagrams:[
        {metadata: {title: "Class Diagram 1"},  content: getDefaultDiagramState()},
        {metadata: {title: "Class Diagram 2"},  content: getDefaultDiagramState()}
    ],
    activeIndex: 0
}

export const openDiagramsSlice = createSlice({
    name: 'openDiagrams',
    initialState,
    reducers: {
        openDiagramActivated: (state, action: PayloadAction<number>) => {
            state.activeIndex = action.payload
        }
    }
})

export const {openDiagramActivated} = openDiagramsSlice.actions
export default openDiagramsSlice.reducer
