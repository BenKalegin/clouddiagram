/// <reference types="react" />
import { Bounds } from "../../common/model";
import { ElementRef } from "../../package/packageModel";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
export interface BackgroundProps {
    backgroundBounds: Bounds;
    nodeBounds: Bounds;
    origin: ElementRef;
    diagramId: DiagramId;
}
export declare const Background: (props: BackgroundProps) => JSX.Element;
//# sourceMappingURL=Background.d.ts.map