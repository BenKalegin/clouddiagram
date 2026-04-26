import { ReactNode } from "react";
import { ElementType, FlowchartNodeKind } from "../../package/packageModel";
import { PredefinedSvg } from "../graphics/graphicsReader";
export interface TypeAndSubType {
    type: ElementType;
    subType?: PredefinedSvg;
    flowchartKind?: FlowchartNodeKind;
}
export declare function HtmlDrop(props: {
    children: ReactNode;
}): JSX.Element;
//# sourceMappingURL=HtmlDrop.d.ts.map