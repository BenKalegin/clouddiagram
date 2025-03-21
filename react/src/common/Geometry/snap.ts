import {Bounds, Coordinate} from "../model";

export const snapToGrid = (pos: Coordinate, gridSize: number): Coordinate => {
    return {
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize
    }
}

export const snapToBounds = (pos: Coordinate, bounds: Bounds): Coordinate => {
    return {
        x: bounds.x,
        y: pos.y
    }
}
