import {NodeState} from "../../package/packageModel";
import {NodeEventHandlers} from "../diagramEditor/commonHandlers";
import {NodePlacement} from "./structureDiagramState";

export interface NodeContentProps {
    node: NodeState,
    placement: NodePlacement,
    eventHandlers: NodeEventHandlers,
    shadowEnabled: boolean,
    image?: HTMLImageElement | undefined
}
