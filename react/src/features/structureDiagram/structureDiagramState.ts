import {Bounds, Diagram} from "../../common/model";
import {Id, PortAlignment} from "../../package/packageModel";

export type NodePlacement = {
    bounds: Bounds
}

export interface PortPlacement {
    alignment: PortAlignment;
    /**
     * Percentage of edge wide where the port center is located, counting from left or top
     * For example, 50 for the top oriented is the center of the top edge
     */
    edgePosRatio: number
}

export const defaultLinkPlacement: LinkPlacement = {
    // linkStyle: LinkStyle.Direct,
    // cornerStyle: CornerStyle.Straight
}

export interface LinkPlacement {
    // TODO currently in the main model for PropertyEditor access.
    // linkStyle: LinkStyle;
    // cornerStyle: CornerStyle;
}

export interface LinkRender {
    svgPath: string[];
}

export type PortRender = {
    bounds: Bounds
}

export enum ClassDiagramModalDialog {
    nodeProperties = "props"
}

export interface ClassDiagramState extends StructureDiagramState {
    modalDialog: ClassDiagramModalDialog | undefined
}

export type NodeId = Id;
export type PortId = Id;
export type LinkId = Id;


export interface StructureDiagramState extends Diagram {
    nodes: { [id: NodeId]: NodePlacement };
    ports: { [id: PortId]: PortPlacement };
    links: { [id: LinkId]: LinkPlacement };
}
