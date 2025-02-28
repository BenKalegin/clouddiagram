import {NodeState} from "../../package/packageModel";
import {NodePlacement} from "../classDiagram/classDiagramModel";
import {NodeEventHandlers} from "../diagramEditor/commonHandlers";

export interface NodeContentProps {
    node: NodeState,
    placement: NodePlacement,
    eventHandlers: NodeEventHandlers,
    shadowEnabled: boolean,
    image?: HTMLImageElement | undefined
}
