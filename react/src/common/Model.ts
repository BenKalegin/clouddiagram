export type Id = string;
export interface DiagramElement {
    id: Id;
}

export interface Coordinate {
    y: number;
    x: number;
}

export const ZeroCoordinate : Coordinate = {x: 0, y: 0};

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

export const shift = (bounds: Bounds, dx: number, dy: number): Bounds => ({
    x: bounds.x + dx,
    y: bounds.y + dy,
    width: bounds.width,
    height: bounds.height
});

export const center = (bounds: Bounds): Coordinate => ({
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
});
