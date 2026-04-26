import { Bounds, Diagram } from "../../common/model";
import { Id, PortAlignment } from "../../package/packageModel";
export type NodePlacement = {
    bounds: Bounds;
};
export interface PortPlacement {
    alignment: PortAlignment;
    /**
     * Percentage of edge wide where the port center is located, counting from left or top
     * For example, 50 for the top oriented is the center of the top edge
     */
    edgePosRatio: number;
}
export declare const defaultLinkPlacement: LinkPlacement;
export interface LinkPlacement {
}
export interface LinkRender {
    svgPath: string[];
    bounds: Bounds;
}
export type PortRender = {
    bounds: Bounds;
};
export type NodeId = Id;
export type PortId = Id;
export type LinkId = Id;
export interface StructureDiagramState extends Diagram {
    nodes: {
        [id: NodeId]: NodePlacement;
    };
    ports: {
        [id: PortId]: PortPlacement;
    };
    links: {
        [id: LinkId]: LinkPlacement;
    };
}
//# sourceMappingURL=structureDiagramState.d.ts.map