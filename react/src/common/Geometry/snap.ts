import {Coordinate} from "../Model";

export const snapToGrid = (pos: Coordinate, gridSize: number): Coordinate => {
    return {
        x: Math.round(pos.x / gridSize) * gridSize,
        y: Math.round(pos.y / gridSize) * gridSize
    }
}
