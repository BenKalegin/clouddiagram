import { DiagramElement, ElementRef } from "../package/packageModel";
import { NoteId, NoteState } from "../features/commonComponents/commonComponentsModel";
export interface Coordinate {
    y: number;
    x: number;
}
export declare const zeroCoordinate: Coordinate;
export declare const zeroBounds: Bounds;
export interface Bounds extends Coordinate {
    width: number;
    height: number;
}
export declare const inflate: (bounds: Bounds, dx: number, dy: number) => Bounds;
export declare const rightOf: (bounds: Bounds, width: number) => Bounds;
export declare const withinBounds: (bounds: Bounds, pos: Coordinate, tolerance: number) => boolean;
export declare const withinYBounds: (bounds: Bounds, y: number, tolerance: number) => boolean;
export declare const withinXBounds: (bounds: Bounds, x: number, tolerance: number) => boolean;
export declare const minus: (coordinate: Coordinate, delta: Coordinate) => Coordinate;
export declare const center: (bounds: Bounds) => Coordinate;
export interface DiagramDisplay {
    width: number;
    height: number;
    scale: number;
    offset: Coordinate;
}
export declare const defaultDiagramDisplay: DiagramDisplay;
export interface Diagram extends DiagramElement {
    title?: string;
    selectedElements: ElementRef[];
    notes: {
        [id: NoteId]: NoteState;
    };
    display: DiagramDisplay;
}
//# sourceMappingURL=model.d.ts.map