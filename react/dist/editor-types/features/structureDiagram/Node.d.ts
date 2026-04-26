import { FC } from "react";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
import { NodeId, NodePlacement } from "./structureDiagramState";
export interface NodeProps {
    nodeId: NodeId;
    diagramId: DiagramId;
}
export declare const nodePlacement: (param: {
    nodeId: NodeId;
    diagramId: DiagramId;
}) => import("recoil").RecoilState<NodePlacement>;
export declare const Node: FC<NodeProps>;
//# sourceMappingURL=Node.d.ts.map