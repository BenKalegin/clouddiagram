import {Bounds, Coordinate, Diagram, zeroCoordinate} from "../../common/model";
import {elementsAtom, Linking, linkingAtom, snapGridSizeAtom} from "./diagramEditorModel";
import {DiagramElement, ElementType, Id, IdAndKind} from "../../package/packageModel";
import {RecoilState, RecoilValue, useRecoilTransaction_UNSTABLE} from "recoil";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {classDiagramEditor} from "../classDiagram/classDiagramSlice";
import {Action, createAction} from "@reduxjs/toolkit";
import {sequenceDiagramEditor} from "../sequenceDiagram/sequenceDiagramSlice";
import Konva from "konva";
import KonvaEventObject = Konva.KonvaEventObject;

export enum ElementMoveResizePhase {
    start  = "start",
    move   = "move",
    end    = "end",
}
export const elementMoveAction = createAction<{
    elementId: Id
    phase: ElementMoveResizePhase
    currentPointerPos: Coordinate
    startPointerPos: Coordinate
    startNodePos: Coordinate
}>("editor/elementMove")

export const elementResizeAction = createAction<{
    elementId: Id
    phase: ElementMoveResizePhase
    suggestedBounds: Bounds
}>("editor/elementResize")

export const dropFromPaletteAction = createAction<{
    droppedAt: Coordinate;
    name: string
}>("editor/dropFromPalette");

export enum DialogOperation {
    open = "open",
    save = "save",
    cancel = "cancel",
}
export const propertiesDialogAction = createAction<{
    elementId: Id
    dialogResult: DialogOperation
}>("editor/showProperties");

export enum LinkingPhase {
    start  = "start",
    draw   = "draw",
    end    = "end",
}

export const linkingAction = createAction<{
    elementId: Id
    mousePos: Coordinate
    diagramPos: Coordinate | undefined
    phase: LinkingPhase
    ctrlKey: boolean
    shiftKey: boolean
}>('editor/startLinking');


export const linkToNewDialogCompletedAction = createAction<{
    success: boolean
    selectedKey?: string
    selectedName?: string
}>('editor/linkToNewDialogCompleted');


export const elementSelectedAction = createAction<{
    /**
     * selected element id or undefined if clicked on empty space
     */
    element: IdAndKind | undefined
    shiftKey: boolean
    ctrlKey: boolean
}>('editor/elementSelected');


export const elementPropertyChangedAction = createAction<{
    elements: IdAndKind[]
    propertyName: string
    value: any
}>('editor/elementPropertyChanged');

export type Get = (<T>(a: RecoilValue<T>) => T)
export type Set = (<T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void)

export interface DiagramEditor {
    handleAction(action: Action, get: Get, set: Set) : void
    snapToElements(get: Get, diagramPos: Coordinate): Coordinate | undefined
    connectNodes(get: Get, set: Set, sourceId: Id, targetId: Id, diagramPos: Coordinate): void;
    createAndConnectTo(get: Get, set: Set, name: string): void;
    getElement(get: Get, ref: IdAndKind, diagram: Diagram): DiagramElement
}



export function useDispatch() {
    return useRecoilTransaction_UNSTABLE(
        ({get, set}) => (action: Action) => {
            handleAction(action, get, set);
        },
        []
    )
}

export function useElementsSelector() {
    return useRecoilTransaction_UNSTABLE(
        ({get}) => (diagram: Diagram, refs: IdAndKind[], consumer: (el: DiagramElement[]) => void) => {
            const diagramEditor  = diagramEditors[diagram.type];
            consumer(refs.map(ref => diagramEditor.getElement(get, ref, diagram)))
        },
        []
    )
}


function handleAction(action: Action, get: Get, set: Set) {
    const activeDiagramId = get(activeDiagramIdAtom);
    const diagramKind = get(elementsAtom(activeDiagramId)).type;

    if (linkingAction.match(action)) {
        const {mousePos, diagramPos, elementId, phase } = action.payload;
        handleLinking(diagramKind, get, set, elementId, mousePos, diagramPos, phase);
    }else if (linkToNewDialogCompletedAction.match(action)) {
        const {success, selectedName} = action.payload;
        if (success)
            diagramEditors[diagramKind].createAndConnectTo(get, set, selectedName ?? "new node")
        scrubLinking(set);
    }else if (elementSelectedAction.match(action)) {
        const {element, shiftKey, ctrlKey} = action.payload;
        handleElementSelection(get, set, element, shiftKey, ctrlKey);
    }
    else
        diagramEditors[diagramKind].handleAction(action, get, set);
}

export function screenToCanvas(e: KonvaEventObject<DragEvent | MouseEvent>) {
    const stage = e.target.getStage()?.getPointerPosition() ?? zeroCoordinate;
    return {x: stage.x, y: stage.y};
}

const snapToGrid = (pos: Coordinate, gridSize: number) => {
    const x = Math.round(pos.x / gridSize) * gridSize;
    const y = Math.round(pos.y / gridSize) * gridSize;
    return {x, y}
}

export function toDiagramPos(linking: Linking, screenPos: Coordinate) : Coordinate {
    return {
        x: screenPos.x - linking.mouseStartPos.x + linking.diagramStartPos.x,
        y: screenPos.y - linking.mouseStartPos.y + linking.diagramStartPos.y
    }
}

function snapToElements(get: Get, diagramKind: ElementType, diagramPos: Coordinate): Coordinate | undefined {
    return diagramEditors[diagramKind].snapToElements(get, diagramPos)
}

function scrubLinking(set: Set) {
    set(linkingAtom, undefined)
}

const handleLinking = (diagramKind: ElementType, get: Get, set: Set, elementId: Id, mousePos: Coordinate, diagramPos: Coordinate | undefined, phase: LinkingPhase) => {
    if (phase === LinkingPhase.start) {
        set(linkingAtom, {
            sourceElement: elementId,
            mouseStartPos: mousePos,
            diagramStartPos: diagramPos!,
            mousePos: mousePos,
            diagramPos: diagramPos!,
            targetElement: undefined,
            drawing: true,
            showLinkToNewDialog: false
        })
    }else if (phase === LinkingPhase.draw) {
        const linking = get(linkingAtom);
        // we have a chance to receive continueLinking after endLinking, ignore it
        if (!linking)
            return

        const diagramPos = toDiagramPos(linking, mousePos)
        let snapped = snapToElements(get, diagramKind, diagramPos) ?? snapToGrid(diagramPos, get(snapGridSizeAtom))

        set(linkingAtom, {...linking, mousePos: mousePos, diagramPos: snapped})
    }else if (phase === LinkingPhase.end) {
        const linking = get(linkingAtom)!;
        const endPos = toDiagramPos(linking, mousePos)!
        if (linking.targetElement) {
            diagramEditors[diagramKind].connectNodes(get, set, linking.sourceElement, linking.targetElement!, endPos);
            scrubLinking(set);
        }else
            set(linkingAtom, {...linking!, drawing: false, showLinkToNewDialog: true, diagramPos: endPos})
    }
}


function handleElementSelection(get: Get, set: Set, idAndKind: IdAndKind | undefined, shiftKey: boolean, ctrlKey: boolean) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as Diagram;
    if (!idAndKind) {
        let updatedDiagram = {...diagram, selectedElements: []};
        set(elementsAtom(diagramId), updatedDiagram);
    }else {
        const append = shiftKey || ctrlKey
        let selection = diagram.selectedElements;
        if (!append) {
            selection = [idAndKind]
        } else {
            if (!diagram.selectedElements.map(ik => ik.id).includes(idAndKind.id)) {
                selection.push(idAndKind)
            } else
                selection = selection.filter(e => e !== idAndKind)
        }

        const updatedDiagram = {...diagram, selectedElements: selection}
        set(elementsAtom(diagramId), updatedDiagram)
    }
}

export const diagramEditors: Record<any, DiagramEditor> = {
    [ElementType.ClassDiagram]: classDiagramEditor,
    [ElementType.SequenceDiagram]: sequenceDiagramEditor
};
