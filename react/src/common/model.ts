import {DiagramElement, Id} from "../package/packageModel";

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

export function shift(bounds: Bounds, dx: number, dy: number): Bounds {
    return {
        x: bounds.x + dx,
        y: bounds.y + dy,
        width: bounds.width,
        height: bounds.height
    };
}

export const minus = (coordinate: Coordinate, delta: Coordinate): Coordinate => ({
    x: coordinate.x - delta.x,
    y: coordinate.y - delta.y
});

export const center = (bounds: Bounds): Coordinate => ({
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
});

export interface Diagram extends DiagramElement{
    title?: string
}

export interface ConnectorPlacement {
    x: number;
    y: number;
    points: number[];
}

// export const generateId = (): Id => {
//     return nanoid(6);
// }


