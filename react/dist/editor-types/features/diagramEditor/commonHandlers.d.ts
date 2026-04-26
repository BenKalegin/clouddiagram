import { KonvaNodeEvents } from "react-konva/ReactKonvaCore";
import { ElementRef } from "../../package/packageModel";
import { Bounds } from "../../common/model";
import { DiagramId } from "./diagramEditorModel";
import { Vector2d } from "konva/lib/types";
import { Node } from "konva/lib/Node";
interface CustomDispatchOptions {
    onClick?: boolean;
    onDrag?: boolean;
    disableVerticalDrag?: boolean;
    element: ElementRef;
    diagramId: DiagramId;
    bounds: Bounds;
}
export interface DragBoundFunc {
    dragBoundFunc?: (this: Node, pos: Vector2d) => Vector2d;
}
export declare const useCustomDispatch: ({ element, bounds, diagramId, onClick, onDrag, disableVerticalDrag }: CustomDispatchOptions) => Partial<KonvaNodeEvents> & DragBoundFunc;
export {};
//# sourceMappingURL=commonHandlers.d.ts.map