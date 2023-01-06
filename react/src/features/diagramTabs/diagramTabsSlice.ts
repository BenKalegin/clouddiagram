import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {demoDiagramEditors} from "../demo";
import {DiagramEditor} from "../../common/model";

export interface DiagramEditors {
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
