/// <reference types="react" />
import { DiagramId } from "../diagramEditor/diagramEditorModel";
import { ColorSchema } from "../../package/packageModel";
import { NodeId, PortId } from "./structureDiagramState";
export interface PortProps {
    portId: PortId;
    nodeId: NodeId;
    diagramId: DiagramId;
    colorSchema: ColorSchema;
}
export declare const Port: ({ diagramId, nodeId, portId, colorSchema }: PortProps) => JSX.Element;
//# sourceMappingURL=Port.d.ts.map