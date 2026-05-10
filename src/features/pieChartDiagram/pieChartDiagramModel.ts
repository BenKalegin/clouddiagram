import {atomFamily} from "jotai-family";
import {atom} from "jotai";
import {Bounds, Diagram} from "../../common/model";
import {PieSliceState} from "../../package/packageModel";
import {DiagramId, elementsAtom} from "../diagramEditor/diagramEditorModel";

export interface PieChartMetadata {
    showData: boolean;
    textPosition: number;
    slices: PieSliceState[];
    bounds: Bounds;
}

export interface PieChartDiagramState extends Diagram {
    pie: PieChartMetadata;
}

export const defaultPieChartBounds: Bounds = {
    x: 80,
    y: 80,
    width: 760,
    height: 520
};

export const defaultPieSlices: PieSliceState[] = [
    {label: "Slice A", value: 40},
    {label: "Slice B", value: 35},
    {label: "Slice C", value: 25}
];

export const pieChartDiagramSelector = atomFamily((id: DiagramId) =>
    atom(
        (get) => get(elementsAtom(id)) as PieChartDiagramState,
        (_get, set, newValue: PieChartDiagramState) => {
            set(elementsAtom(id), newValue);
        }
    )
);
