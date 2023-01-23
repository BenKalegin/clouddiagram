import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {demoDiagramEditors} from "../demo";
import {RootState} from "../../app/store";
import {DiagramEditor} from "../diagramEditor/diagramEditorModel";
import {Id} from "../../package/packageModel";

export interface OpenDiagrams {
    activeIndex: number;
    editors: DiagramEditor[];
}

export const diagramTabsSlice = createSlice({
    name: 'diagramTabs',
    initialState: demoDiagramEditors,
    reducers: {
        openDiagramActivated: (state, action: PayloadAction<number>) => {
            state.activeIndex = action.payload
        },
    }
})

export const {
    openDiagramActivated,
} = diagramTabsSlice.actions

export const selectDiagramTabs = (state: RootState) => state.diagramTabs
export const selectActiveEditor: (state: RootState) => DiagramEditor = (state: RootState) => {
    const openDiagrams = selectDiagramTabs(state);
    return openDiagrams.editors[openDiagrams.activeIndex]
}

export const selectActiveDiagramId: (state: RootState) => Id = (state: RootState) => selectActiveEditor(state).diagramId
