import {Bounds, Coordinate, defaultDiagramDisplay, Diagram, zeroCoordinate} from "../../common/model";
import {
    elementIdsAtom,
    elementsAtom,
    exportingAtom,
    ExportPhase,
    generateId,
    Importing,
    importingAtom,
    ImportPhase,
    Linking,
    linkingAtom,
    showContextAtom,
    snapGridSizeAtom
} from "./diagramEditorModel";
import {DiagramElement, ElementRef, ElementType, Id} from "../../package/packageModel";
import {RecoilState, RecoilValue, useRecoilTransaction_UNSTABLE} from "recoil";
import {activeDiagramIdAtom, openDiagramIdsAtom} from "../diagramTabs/diagramTabsModel";
import {classDiagramEditor} from "../classDiagram/classDiagramSlice";
import {Action, createAction} from "@reduxjs/toolkit";
import {sequenceDiagramEditor} from "../sequenceDiagram/sequenceDiagramSlice";
import Konva from "konva";
import {SequenceDiagramState} from "../sequenceDiagram/sequenceDiagramModel";
import {TypeAndSubType} from "../diagramTabs/HtmlDrop";
import {ExportImportFormat, importDiagramAs} from "../export/exportFormats";
import {DeploymentDiagramState} from "../deploymentDiagram/deploymentDaigramModel";
import {deploymentDiagramEditor} from "../deploymentDiagram/deploymentDiagramSlice";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";
import {Command} from "../propertiesEditor/propertiesEditorModel";
import { FlowchartDiagramState } from "../flowchartDiagram/flowchartDiagramModel";
import { flowchartDiagramEditor } from "../flowchartDiagram/flowchartDiagramSlice";
import KonvaEventObject = Konva.KonvaEventObject;

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
    importedCode?: string
}>('tabs/importDiagramTab');

export const showContextAction = createAction<{
    elementId: Id
    mousePos: Coordinate
    diagramPos: Coordinate
}>("editor/showContext");

export const hideContextAction = createAction<{
}>("editor/hideContext");

export const updateDiagramDisplayAction = createAction<{
    scale: number;
    offset: Coordinate;
}>("editor/updateDiagramDisplay");

export type Get = (<T>(a: RecoilValue<T>) => T)
export type Set = (<T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void)

export interface DiagramHandler {
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
        exportDiagramTab(set, exportState, format);
    }else if (importDiagramTabAction.match(action)) {
        const { importState, format, importedCode } = action.payload ;
        importDiagramTab(get, set, importState, format, importedCode);
    }else if(showContextAction.match(action)) {
        const {elementId, mousePos, diagramPos} = action.payload;
        showContext(set, elementId, mousePos, diagramPos);
    }else if(hideContextAction.match(action)) {
        hideContext(set);
    }else if(updateDiagramDisplayAction.match(action)) {
        updateDiagramDisplay(get, set, action.payload.scale, action.payload.offset);
    }
    else
        diagramEditors[diagramKind].handleAction(action, get, set);
}

export function screenToCanvas(e: KonvaEventObject<DragEvent | MouseEvent>) {
    const stage = e.target.getStage();
    if (!stage) return zeroCoordinate;

    const stagePos = stage.getPointerPosition() ?? zeroCoordinate;
    // Convert screen coordinates to stage coordinates
    return {
        x: (stagePos.x - stage.x()) / stage.scaleX(),
        y: (stagePos.y - stage.y()) / stage.scaleY()
    };
}

const snapToGrid = (pos: Coordinate, gridSize: number) => {
    const x = Math.round(pos.x / gridSize) * gridSize;
    const y = Math.round(pos.y / gridSize) * gridSize;
    return {x, y}
}

export function toDiagramPos(linking: Linking, screenPos: Coordinate) : Coordinate {
    const scale = linking.scale || 1;
    return {
        x: (screenPos.x - linking.mouseStartPos.x) / scale + linking.diagramStartPos.x,
        y: (screenPos.y - linking.mouseStartPos.y) / scale + linking.diagramStartPos.y
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
        const diagramId = get(activeDiagramIdAtom);
        const diagram = get(elementsAtom(diagramId)) as Diagram;
        const scale = diagram.display?.scale ?? 1;
        set(linkingAtom, {
            sourceElement: elementId,
            mouseStartPos: mousePos,
            diagramStartPos: diagramPos!,
            mousePos: mousePos,
            diagramPos: diagramPos!,
            scale: scale,
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
                selection = [...selection, idAndKind];
            } else {
                selection = selection.filter(e => e.id !== idAndKind.id);
            }
        }

        const updatedDiagram = {...diagram, selectedElements: selection}
        set(elementsAtom(diagramId), updatedDiagram)
    }
}

function createDiagramBase(id: Id, type: ElementType, title: string): Pick<Diagram, "id" | "type" | "title" | "selectedElements" | "notes" | "display"> {
    return {
        id,
        type,
        title,
        selectedElements: [],
        notes: {},
        display: {
            ...defaultDiagramDisplay,
            offset: { ...defaultDiagramDisplay.offset }
        }
    };
}

function normalizeDiagram(diagram: Diagram): Diagram {
    const display = diagram.display ?? defaultDiagramDisplay;
    return {
        ...diagram,
        selectedElements: diagram.selectedElements ?? [],
        notes: diagram.notes ?? {},
        display: {
            ...defaultDiagramDisplay,
            ...display,
            offset: display.offset ?? defaultDiagramDisplay.offset
        }
    };
}

function addDiagramTab(get: Get, set: Set, diagramKind: ElementType) {
    const openDiagramIds = get(openDiagramIdsAtom);
    const newDiagramId = generateId();
    let diagram : Diagram = {id: "", selectedElements: [], type: ElementType.Unexpected, notes: {}, display: defaultDiagramDisplay};

    switch (diagramKind) {
        case ElementType.ClassDiagram:
            diagram = {
                ...createDiagramBase(newDiagramId, ElementType.ClassDiagram, "Class Diagram"),
                nodes: {},
                ports: {},
                links: {},
            } as StructureDiagramState;
            break;

        case ElementType.DeploymentDiagram:
            diagram = {
                ...createDiagramBase(newDiagramId, ElementType.DeploymentDiagram, "Deployment Diagram"),
                nodes: {},
                ports: {},
                links: {},
            } as DeploymentDiagramState;
            break;

        case ElementType.SequenceDiagram:
            diagram = {
                ...createDiagramBase(newDiagramId, ElementType.SequenceDiagram, "Sequence Diagram"),
                lifelines: {},
                messages: {},
                activations: {},
            } as SequenceDiagramState;
            break;

        case ElementType.FlowchartDiagram:
            diagram = {
                ...createDiagramBase(newDiagramId, ElementType.FlowchartDiagram, "Flowchart Diagram"),
                nodes: {},
                ports: {},
                links: {},
            } as FlowchartDiagramState;
            break;


        default: throw new Error(`Unknown diagram kind: ${diagramKind}`);

    }
    set(elementsAtom(newDiagramId), normalizeDiagram(diagram))
    set(openDiagramIdsAtom, [...openDiagramIds, newDiagramId])
    set(activeDiagramIdAtom, newDiagramId)
}

function closeDiagramTab(get: Get, set: Set) {
    const diagramId = get(activeDiagramIdAtom);
    const openDiagramIds = get(openDiagramIdsAtom);
    const filteredDiagramIds = openDiagramIds.filter(id => id !== diagramId);
    set(openDiagramIdsAtom, filteredDiagramIds);
    set(activeDiagramIdAtom, filteredDiagramIds.length === 0 ? "" : filteredDiagramIds[filteredDiagramIds.length - 1]);
}

export function exportDiagramTab(set: Set, exportState: ExportPhase, format: ExportImportFormat | undefined) {

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

export function importDiagramTab(get: Get, set: Set, phase: ImportPhase, format: ExportImportFormat | undefined, code: string | undefined) {

    switch (phase) {
        case ImportPhase.start:
            set(importingAtom, {phase: ImportPhase.importing})
            break;

        case ImportPhase.selected:
            set(importingAtom, {phase: ImportPhase.importing, format} as Importing)
            break;

        case ImportPhase.importing:
            if (format && code) {
                const diagramId = get(activeDiagramIdAtom);
                const originalDiagram = get(elementsAtom(diagramId)) as Diagram;
                const imported = normalizeDiagram(importDiagramAs(originalDiagram, format, code));
                
                // If the imported diagram contains elements (nodes, ports, links),
                // we need to set them individually in the elementsAtom family.
                const importedWithElements = imported as any;
                if (importedWithElements.elements) {
                    const importedIds = Object.keys(importedWithElements.elements);
                    importedIds.forEach(id => {
                        set(elementsAtom(id), importedWithElements.elements[id] as DiagramElement);
                    });
                    
                    // Update elementIdsAtom with new IDs
                    const currentIds = get(elementIdsAtom);
                    const newIds = Array.from(new Set([...currentIds, ...importedIds]));
                    set(elementIdsAtom, newIds);
                }
                
                // Set the diagram itself
                set(elementsAtom(diagramId), imported);
            }

            set(importingAtom, undefined);
            break;

        case ImportPhase.cancel:
            set(importingAtom, undefined);
            break;
    }
}

function showContext(set: Set, elementId: string, mousePos: Coordinate, diagramPos: Coordinate) {
    set(showContextAtom, {
        elementId,
        mousePos,
        diagramPos
    })
}

function hideContext(set: <T>(s: RecoilState<T>, u: (((currVal: T) => T) | T)) => void) {
    set(showContextAtom, undefined)
}

// Calculate the bounds of a diagram based on node positions
export function calculateDiagramBounds(diagram: Diagram): { width: number, height: number } {
    let minX = Number.MAX_VALUE;
    let minY = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let maxY = Number.MIN_VALUE;

    function updateMinMax(bounds: Bounds) {
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + bounds.width);
        maxY = Math.max(maxY, bounds.y + bounds.height);
    }

    // Check if the diagram has nodes property (structure diagrams). Todo: should be refactored to use OOP
    if ('nodes' in diagram) {
        const structureDiagram = diagram as any;
        // Process nodes
        for (const nodeId in structureDiagram.nodes) {
            updateMinMax(structureDiagram.nodes[nodeId].bounds);
        }

        // Process notes
        for (const noteId in structureDiagram.notes) {
            updateMinMax(structureDiagram.notes[noteId].bounds);
        }
    }

    // Check if the diagram has lifelines property (sequence diagrams)
    if ('lifelines' in diagram) {
        const sequenceDiagram = diagram as any;
        // Process lifelines
        for (const lifelineId in sequenceDiagram.lifelines) {
            const lifeline = sequenceDiagram.lifelines[lifelineId];
            if (lifeline.bounds) {
                updateMinMax(lifeline.bounds);
            }
        }
    }

    // If no elements found, return the default size
    if (minX === Number.MAX_VALUE || minY === Number.MAX_VALUE ||
        maxX === Number.MIN_VALUE || maxY === Number.MIN_VALUE) {
        return { width: 0, height: 0 };
    }

    // Add some padding
    const padding = 100;
    const width = maxX - minX + padding * 2;
    const height = maxY - minY + padding * 2;

    return { width, height };
}

function updateDiagramDisplay(get: Get, set: Set, scale: number, offset: Coordinate) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as Diagram;
    const display = diagram.display ?? defaultDiagramDisplay;

    // Calculate diagram bounds
    const bounds = calculateDiagramBounds(diagram);

    // Update the diagram's display property
    const updatedDiagram = {
        ...diagram,
        display: {
            ...defaultDiagramDisplay,
            ...display,
            scale,
            offset,
            width: bounds.width,
            height: bounds.height
        }
    };

    set(elementsAtom(diagramId), updatedDiagram);
}


export const diagramEditors: Record<any, DiagramHandler> = {
    [ElementType.ClassDiagram]: classDiagramEditor,
    [ElementType.DeploymentDiagram]: deploymentDiagramEditor,
    [ElementType.SequenceDiagram]: sequenceDiagramEditor,
    [ElementType.FlowchartDiagram]: flowchartDiagramEditor,
};
