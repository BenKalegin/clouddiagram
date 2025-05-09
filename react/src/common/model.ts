import {DiagramElement, ElementRef} from "../package/packageModel";
import {NoteId, NoteState} from "../features/commonComponents/commonComponentsModel";

export interface Coordinate {
    y: number;
    x: number;
}

export const zeroCoordinate : Coordinate = {x: 0, y: 0};
export const zeroBounds : Bounds = {x: 0, y: 0, width: 0, height: 0};

export interface Bounds extends Coordinate {
    width: number;
    height: number;
}

export const inflate = (bounds: Bounds, dx: number, dy: number): Bounds => ({
    x: bounds.x - dx,
    y: bounds.y - dy,
    width: bounds.width + dx * 2,
    height: bounds.height + dy * 2
});

export const rightOf = (bounds: Bounds, width: number): Bounds => ({
    x: bounds.x + bounds.width,
    y: bounds.y,
    width: width,
    height: bounds.height
})

export const withinBounds = (bounds: Bounds, pos: Coordinate, tolerance: number): boolean =>
    bounds.x - tolerance <= pos.x &&
    bounds.x + bounds.width + tolerance >= pos.x &&
    bounds.y - tolerance <= pos.y &&
    bounds.y + bounds.height + tolerance >= pos.y

export const withinYBounds = (bounds: Bounds, y: number, tolerance: number): boolean =>
    bounds.y - tolerance <= y &&
    bounds.y + bounds.height + tolerance >= y

export const withinXBounds = (bounds: Bounds, x: number, tolerance: number): boolean =>
    bounds.x - tolerance <= x &&
    bounds.x + bounds.width + tolerance >= x

export const minus = (coordinate: Coordinate, delta: Coordinate): Coordinate => ({
    x: coordinate.x - delta.x,
    y: coordinate.y - delta.y
});

export const center = (bounds: Bounds): Coordinate => ({
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
});

export interface DiagramDisplay {
    width: number
    height: number
    scale: number
    offset: Coordinate
}

export const defaultDiagramDisplay: DiagramDisplay = {
    width: 0,
    height: 0,
    scale: 1,
    offset: zeroCoordinate
}

export interface Diagram extends DiagramElement{
    title?: string
    selectedElements: ElementRef[]
    notes: {[id: NoteId]: NoteState}
    display: DiagramDisplay
}


