import {PayloadAction} from "@reduxjs/toolkit";
import {WritableDraft} from "immer/dist/internal";
import {ClassDiagramEditor} from "../classDiagram/classDiagramSlice";
import {Bounds, Coordinate, Id} from "../../common/model";
import {BaseDiagramEditor, Linking} from "./baseDiagramModel";
import {RootState} from "../../app/store";
import {SequenceDiagramEditor} from "../sequenceDiagram/sequenceDiagramSlice";

export interface ElementResizeAction {
    elementId: Id
    deltaBounds: Bounds
}

export interface DropFromPaletteAction {
    droppedAt: Coordinate;
    name: string
}

export interface ElementSelectAction {
    id: Id
    shiftKey: boolean
    ctrlKey: boolean
}

export interface StartLinkingAction {
    elementId: Id
    mousePos: Coordinate
    relativePos: Coordinate
}

export interface DrawLinkingAction {
    elementId: Id
    mousePos: Coordinate
    shiftKey: boolean
    ctrlKey: boolean
}

export interface linkToNewDialogCompleted {
    success: boolean
    selectedKey?: string;
    selectedName?: string;
}

export interface AddNodeAndConnectAction {
    name: string
}


export const nodeDeselect1 = (editor: WritableDraft<BaseDiagramEditor>) => {
    editor.selectedElements = [];
    editor.focusedElement = undefined;
    editor.linking = undefined;
};

export const nodeSelect1 = (editor: WritableDraft<BaseDiagramEditor>, action: PayloadAction<ElementSelectAction>) => {
    const append = action.payload.shiftKey || action.payload.ctrlKey
    let selectedIds = editor.selectedElements;
    const id = action.payload.id
    if (!append) {
        selectedIds = [id]
    } else {
        if (!editor.selectedElements.includes(id)) {
            selectedIds.push(id)
        } else
            selectedIds = selectedIds.filter(e => e !== id)
    }

    editor.selectedElements = selectedIds;
    editor.focusedElement = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : undefined
};

export const startLinking1 = (editor: WritableDraft<BaseDiagramEditor>, action: PayloadAction<StartLinkingAction>) => {
    editor.linking = {
        sourceElement: action.payload.elementId,
        mouseStartPos: action.payload.mousePos,
        relativeStartPos: action.payload.relativePos,
        mousePos: action.payload.mousePos,
        diagramPos: action.payload.relativePos,
        targetElement: undefined,
        drawing: true,
        showLinkToNewDialog: false
    }
}

export const endLinking1 = (editor: WritableDraft<BaseDiagramEditor>) => {
    editor.linking!.drawing = false;
}

export const linkToNewDialog1 = (editor: WritableDraft<BaseDiagramEditor>) => {
    editor.linking!.showLinkToNewDialog = true
}

export const linkToNewDialogClose1 = (editor: WritableDraft<BaseDiagramEditor>, action: PayloadAction<linkToNewDialogCompleted>) => {
}

export const stopLinking1 =  (editor: WritableDraft<BaseDiagramEditor>) => {
    editor.linking = undefined
}

export function toDiagramPos(linking: Linking, screenPos: Coordinate) : Coordinate {
    return {
        x: screenPos.x - linking.mouseStartPos.x + linking.relativeStartPos.x,
        y: screenPos.y - linking.mouseStartPos.y + linking.relativeStartPos.y
    }
}

export const selectDiagramEditor = (state: RootState): SequenceDiagramEditor => state.sequenceDiagramEditor;




