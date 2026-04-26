/// <reference types="react" />
import { Bounds, Coordinate } from "../../common/model";
import { Id } from "../../package/packageModel";
interface ContextButtonProps {
    svgPath: string;
    placement: Bounds;
    draggable?: boolean;
    onMouseDown?: (mousePos: Coordinate, relativePos: Coordinate, shiftKey: boolean, ctrlKey: boolean) => void;
}
export declare const ContextButton: (props: ContextButtonProps) => JSX.Element;
interface ContextButtonsProps {
    placement: Coordinate;
    elementId: Id;
}
export declare const ContextButtons: (props: ContextButtonsProps) => JSX.Element;
export {};
//# sourceMappingURL=ContextButtons.d.ts.map