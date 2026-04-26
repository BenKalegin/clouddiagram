/// <reference types="react" />
import { Bounds } from "../../common/model";
import { ElementRef } from "../../package/packageModel";
export declare enum ResizeHandleDirection {
    North = "n",
    NorthEast = "ne",
    NorthWest = "nw",
    South = "s",
    SouthEast = "se",
    SouthWest = "sw",
    East = "e",
    West = "w"
}
export interface ResizeHandleProps {
    element: ElementRef;
    cursor: string;
    handlerBounds: Bounds;
    direction: ResizeHandleDirection;
    nodeBounds: Bounds;
}
export declare const ResizeHandle: (props: ResizeHandleProps) => JSX.Element;
export interface ResizeHandlesProps {
    perimeterBounds: Bounds;
    nodeBounds: Bounds;
    element: ElementRef;
    excludeDiagonal?: boolean;
    excludeVertical?: boolean;
}
export declare const ResizeHandles: ({ nodeBounds, perimeterBounds, element, excludeDiagonal, excludeVertical }: ResizeHandlesProps) => JSX.Element;
//# sourceMappingURL=ResizeHandle.d.ts.map