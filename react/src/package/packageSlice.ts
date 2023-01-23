import {createSlice} from "@reduxjs/toolkit";
import {DiagramElement, ElementType, Id, Package} from "./packageModel";
import {RootState} from "../app/store";

const initialState: Package = {
    elements: {}
}

export const packageSlice = createSlice({
    name: 'package',
    initialState,
    reducers: {
    }
})

export const selectElementById = (state: RootState, id: Id): DiagramElement => state.package.elements[id]
