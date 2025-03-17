import {Bounds, Coordinate, Diagram, zeroCoordinate} from "../../common/model";
import {
    elementsAtom,
    exportingAtom,
    ExportPhase,
    generateId, Importing, importingAtom, ImportPhase,
    Linking,
    linkingAtom,
    snapGridSizeAtom
} from "./diagramEditorModel";
import {DiagramElement, ElementType, Id, ElementRef} from "../../package/packageModel";
import {RecoilState, RecoilValue, useRecoilTransaction_UNSTABLE} from "recoil";
import {activeDiagramIdAtom, openDiagramIdsAtom} from "../diagramTabs/DiagramTabs";
import {classDiagramEditor} from "../classDiagram/classDiagramSlice";
import {Action, createAction} from "@reduxjs/toolkit";
import {sequenceDiagramEditor} from "../sequenceDiagram/sequenceDiagramSlice";
import Konva from "konva";
import {Command} from "../propertiesEditor/PropertiesEditor";
import {SequenceDiagramState} from "../sequenceDiagram/sequenceDiagramModel";
import KonvaEventObject = Konva.KonvaEventObject;
import {TypeAndSubType} from "../diagramTabs/HtmlDrop";
import {ExportImportFormat} from "../export/exportFormats";
import {DeploymentDiagramState} from "../deploymentDiagram/deploymentDaigramModel";
import {deploymentDiagramEditor} from "../deploymentDiagram/deploymentDiagramSlice";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";

export enum ElementMoveResizePhase {
    start  = "start",
    move   = "move",
    end    = "end",
}
export const elementMoveAction = createAction<{
    phase: ElementMoveResizePhase
    element: ElementRef
    currentPointerPos: Coordinate
    startPointerPos: Coordinate
    startNodePos: Coordinate
}>("editor/elementMove")

export const elementResizeAction = createAction<{
    element: ElementRef
    phase: ElementMoveResizePhase
    suggestedBounds: Bounds
}>("editor/elementResize")

export const dropFromPaletteAction = createAction<{
    droppedAt: Coordinate;
    name: string
    kind: TypeAndSubType
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
    element: ElementRef | undefined
    shiftKey: boolean
    ctrlKey: boolean
}>('editor/elementSelected');


export const elementPropertyChangedAction = createAction<{
    elements: ElementRef[]
    propertyName: string
    value: any
}>('editor/elementPropertyChanged');

export const elementCommandAction = createAction<{
    elements: ElementRef[]
    command: Command
}>('editor/elementCommand');

export const addDiagramTabAction = createAction<{
    diagramKind: ElementType
}>('tabs/addDiagramTab');

export const closeDiagramTabAction = createAction<{
}>('tabs/closeDiagramTab');

export const exportDiagramTabAction = createAction<{
    exportState: ExportPhase
    format?: ExportImportFormat
}>("tabs/exportDiagramTab");

export const importDiagramTabAction = createAction<{
    importState: ImportPhase
    format?: ExportImportFormat
}>('tabs/importDiagramTab');

export type Get = (<T>(a: RecoilValue<T>) => T)
export type Set = (<T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void)

export interface DiagramEditor {
    handleAction(action: Action, get: Get, set: Set) : void
    snapToElements(get: Get, diagramPos: Coordinate): [Coordinate, DiagramElement] | undefined

    connectNodes(get: Get, set: Set, sourceId: Id, targetId: ElementRef, diagramPos: Coordinate): void;
    createAndConnectTo(get: Get, set: Set, name: string): void;
    getElement(get: Get, ref: ElementRef, diagram: Diagram): DiagramElement
}



export function useDispatch() {
    return useRecoilTransaction_UNSTABLE(
        ({get, set}) => (action: Action) => {
            handleAction(action, get, set);
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
    }else if (addDiagramTabAction.match(action)) {
        addDiagramTab(get, set, action.payload.diagramKind);
    }else if (closeDiagramTabAction.match(action)) {
        closeDiagramTab(get, set);
    }else if (exportDiagramTabAction.match(action)) {
        const { exportState, format } = action.payload ;
        exportDiagramTab(get, set, exportState, format);
    }else if (importDiagramTabAction.match(action)) {
        const { importState, format } = action.payload ;
        importDiagramTab(get, set, importState, format);
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

function snapToElements(get: Get, diagramKind: ElementType, diagramPos: Coordinate): [Coordinate, DiagramElement] | undefined {
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
        const snappedToElement = snapToElements(get, diagramKind, diagramPos)
        const snappedPos = snappedToElement? snappedToElement[0] : snapToGrid(diagramPos, get(snapGridSizeAtom))
        const targetElement = snappedToElement ? snappedToElement[1] : undefined;

        set(linkingAtom, {...linking, mousePos: mousePos, diagramPos: snappedPos, targetElement})
    }else if (phase === LinkingPhase.end) {
        const linking = get(linkingAtom)!;
        const endPos = toDiagramPos(linking, mousePos)!
        if (linking.targetElement) {
            diagramEditors[diagramKind].connectNodes(get, set, linking.sourceElement, linking.targetElement, endPos);
            scrubLinking(set);
        }else
            set(linkingAtom, {...linking!, drawing: false, showLinkToNewDialog: true, diagramPos: endPos})
    }
}


function handleElementSelection(get: Get, set: Set, idAndKind: ElementRef | undefined, shiftKey: boolean, ctrlKey: boolean) {
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

function addDiagramTab(get: Get, set: Set, diagramKind: ElementType) {
    const openDiagramIds = get(openDiagramIdsAtom);
    const newDiagramId = generateId();
    let diagram : Diagram = {id: "", selectedElements: [], type: ElementType.Unexpected, notes: {}};

    switch (diagramKind) {
        case ElementType.ClassDiagram:
            diagram = {
                id: newDiagramId,
                type: ElementType.ClassDiagram,
                title: "Class Diagram",
                nodes: {},
                ports: {},
                links: {},
                notes: {}

            } as StructureDiagramState;
            break;

        case ElementType.DeploymentDiagram:
            diagram = {
                id: newDiagramId,
                type: ElementType.DeploymentDiagram,
                title: "Deployment Diagram",
                nodes: {},
                ports: {},
                links: {},
                notes: {}

            } as DeploymentDiagramState;
            break;

        case ElementType.SequenceDiagram:
            diagram = {
                id: newDiagramId,
                type: ElementType.SequenceDiagram,
                title: "Sequence Diagram",
                lifelines: {},
                messages: {},
                activations: {},
                notes: {}
            } as SequenceDiagramState;
            break;


        default: throw new Error(`Unknown diagram kind: ${diagramKind}`);

    }
    set(elementsAtom(newDiagramId), diagram)
    set(openDiagramIdsAtom, [...openDiagramIds, newDiagramId])
    set(activeDiagramIdAtom, newDiagramId)
}

function closeDiagramTab(get: Get, set: Set) {
    const diagramId = get(activeDiagramIdAtom);
    const openDiagramIds = get(openDiagramIdsAtom);
    set(openDiagramIdsAtom, openDiagramIds.filter(id => id !== diagramId))
    set(activeDiagramIdAtom, openDiagramIds.length === 0 ? "" : openDiagramIds[-1])
}

export function exportDiagramTab(get: Get, set: Set, exportState: ExportPhase, format: ExportImportFormat | undefined) {

    switch (exportState) {
        case ExportPhase.start:
            set(exportingAtom, {phase: ExportPhase.exporting})
            break;

        case ExportPhase.selected:
            set(exportingAtom, {phase: ExportPhase.exporting, format: format})
            break;

         case ExportPhase.cancel:
            set(exportingAtom, undefined)
    }
}

export function importDiagramTab(get: Get, set: Set, phase: ImportPhase, format: ExportImportFormat | undefined) {

    switch (phase) {
        case ImportPhase.start:
            set(importingAtom, {phase: ImportPhase.importing})
            break;

        case ImportPhase.selected:
            set(importingAtom, {phase: ImportPhase.importing, format} as Importing)
            break;

         case ImportPhase.cancel:
            set(importingAtom, undefined)
    }
}



export const diagramEditors: Record<any, DiagramEditor> = {
    [ElementType.ClassDiagram]: classDiagramEditor,
    [ElementType.DeploymentDiagram]: deploymentDiagramEditor,
    [ElementType.SequenceDiagram]: sequenceDiagramEditor,
};
