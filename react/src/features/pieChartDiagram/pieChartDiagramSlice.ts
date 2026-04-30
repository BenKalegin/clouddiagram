import {Action} from "@reduxjs/toolkit";
import {Coordinate, Diagram} from "../../common/model";
import {DiagramElement, ElementRef, ElementType, Id} from "../../package/packageModel";
import {
    DiagramHandler,
    elementPropertyChangedAction,
    Get,
    Set
} from "../diagramEditor/diagramEditorSlice";
import {activeDiagramIdAtom} from "../diagramTabs/diagramTabsModel";
import {elementsAtom} from "../diagramEditor/diagramEditorModel";
import {withHistory} from "../diagramEditor/historySlice";
import {PieChartDiagramState} from "./pieChartDiagramModel";
import {
    normalizePieTextPosition,
    replacePieSlicesText
} from "./pieChartDiagramUtils";

class PieChartDiagramHandler implements DiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void {
        if (elementPropertyChangedAction.match(action)) {
            const {elements, propertyName, value} = action.payload;
            handlePieChartElementPropertyChanged(get, set, elements, propertyName, value);
        }
    }

    snapToElements(_get: Get, _diagramPos: Coordinate): [Coordinate, DiagramElement] | undefined {
        return undefined;
    }

    connectNodes(_get: Get, _set: Set, _sourceId: Id, _targetId: ElementRef, _diagramPos: Coordinate): void {
    }

    createAndConnectTo(_get: Get, _set: Set, _name: string): void {
    }

    getElement(_get: Get, ref: ElementRef, diagram: Diagram): DiagramElement {
        if (ref.type === ElementType.PieChartDiagram && ref.id === diagram.id) {
            return diagram;
        }
        throw new Error(`Unknown element type: ${ref.type}`);
    }
}

const handlePieChartElementPropertyChangedImpl = (get: Get, set: Set, elements: ElementRef[], propertyName: string, value: any) => {
    if (!elements.some(element => element.type === ElementType.PieChartDiagram)) return;

    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as PieChartDiagramState;
    const updatedDiagram = updatePieChartProperty(diagram, propertyName, value);
    set(elementsAtom(diagramId), updatedDiagram);
};

const handlePieChartElementPropertyChanged = withHistory(handlePieChartElementPropertyChangedImpl, "Change Pie Chart");

function updatePieChartProperty(diagram: PieChartDiagramState, propertyName: string, value: any): PieChartDiagramState {
    switch (propertyName) {
        case "title":
            return {...diagram, title: String(value ?? "")};
        case "pie.showData":
            return {...diagram, pie: {...diagram.pie, showData: Boolean(value)}};
        case "pie.textPosition":
            return {...diagram, pie: {...diagram.pie, textPosition: normalizePieTextPosition(value)}};
        case "pieSlices":
            return {...diagram, pie: {...diagram.pie, slices: replacePieSlicesText(String(value ?? ""))}};
        default:
            return diagram;
    }
}

export const pieChartDiagramEditor = new PieChartDiagramHandler();
