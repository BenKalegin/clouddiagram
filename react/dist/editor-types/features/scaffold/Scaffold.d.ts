/// <reference types="react" />
import { Bounds } from "../../common/model";
import { ElementRef } from "../../package/packageModel";
export interface ScaffoldProps {
    bounds: Bounds;
    isFocused: boolean;
    isLinking: boolean;
    element: ElementRef;
    excludeDiagonalResize?: boolean;
    excludeVerticalResize?: boolean;
    linkingDrawing: JSX.Element | undefined;
}
export declare const Scaffold: (props: ScaffoldProps) => JSX.Element;
//# sourceMappingURL=Scaffold.d.ts.map