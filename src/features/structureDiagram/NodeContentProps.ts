import {NodeState} from "../../package/packageModel";
import {NodePlacement} from "./structureDiagramState";

export interface NodeContentProps {
    node: NodeState,
    placement: NodePlacement,
    shadowEnabled: boolean,
    image?: HTMLImageElement | undefined
}
