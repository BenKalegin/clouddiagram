import {Diagram} from "../../common/model";
import {LinkId, LinkPlacement, NodeId, NodePlacement, PortId, PortPlacement} from "../classDiagram/classDiagramModel";

    export interface StructureDiagramState extends Diagram {
    nodes: { [id: NodeId]: NodePlacement };
    ports: { [id: PortId]: PortPlacement };
    links: { [id: LinkId]: LinkPlacement };
}