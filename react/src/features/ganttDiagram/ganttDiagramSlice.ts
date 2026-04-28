import { Action } from "@reduxjs/toolkit";
import { Coordinate } from "../../common/model";
import { defaultColorSchema } from "../../common/colors/colorSchemas";
import {
    defaultCornerStyle,
    ElementRef,
    ElementType,
    Id,
    LinkState,
    NodeState,
    PortAlignment,
    PortState,
    RouteStyle,
    TipStyle
} from "../../package/packageModel";
import { activeDiagramIdAtom } from "../diagramTabs/diagramTabsModel";
import { elementsAtom, generateId } from "../diagramEditor/diagramEditorModel";
import { Get, Set } from "../diagramEditor/diagramEditorSlice";
import { withHistory } from "../diagramEditor/historySlice";
import { addNewPort } from "../structureDiagram/structureDiagramModel";
import { StructureDiagramHandler } from "../structureDiagram/structureDiagramHandler";
import { LinkPlacement, PortPlacement, StructureDiagramState } from "../structureDiagram/structureDiagramState";

class GanttDiagramHandler extends StructureDiagramHandler {
    handleAction(action: Action, get: Get, set: Set): void {
        super.handleAction(action, get, set);
    }

    connectNodes(get: Get, set: Set, sourceId: Id, target: ElementRef, _diagramPos: Coordinate): void {
        autoConnectGanttTasks(get, set, sourceId, target);
    }
}

const autoConnectGanttTasksImpl = (get: Get, set: Set, sourceId: Id, target: ElementRef) => {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as StructureDiagramState;

    const sourceNode = get(elementsAtom(sourceId)) as NodeState;
    const port1 = addNewPort(get, set, sourceNode);
    const placement1: PortPlacement = {alignment: PortAlignment.Right, edgePosRatio: 50};

    let targetNode: NodeState;
    let port2: PortState;
    let placement2: PortPlacement;
    if (target.type === ElementType.ClassNode || target.type === ElementType.DeploymentNode) {
        targetNode = get(elementsAtom(target.id)) as NodeState;
        port2 = addNewPort(get, set, targetNode);
        placement2 = {alignment: PortAlignment.Left, edgePosRatio: 50};
    } else if (target.type === ElementType.ClassPort) {
        port2 = get(elementsAtom(target.id)) as PortState;
        targetNode = get(elementsAtom(port2.nodeId)) as NodeState;
        placement2 = diagram.ports[port2.id];
    } else {
        throw new Error("Invalid target type " + target.type);
    }

    const linkId = generateId();
    const link: LinkState = {
        id: linkId,
        type: ElementType.ClassLink,
        port1: port1.id,
        port2: port2.id,
        tipStyle1: TipStyle.None,
        tipStyle2: TipStyle.Arrow,
        colorSchema: defaultColorSchema,
        routeStyle: RouteStyle.OrthogonalSquare,
        cornerStyle: defaultCornerStyle,
        ganttDependency: sourceNode.ganttTask && targetNode.ganttTask ? {
            sourceTaskId: sourceNode.ganttTask.taskId,
            targetTaskId: targetNode.ganttTask.taskId
        } : undefined
    };
    set(elementsAtom(linkId), link);

    set(elementsAtom(port1.id), {...port1, links: [...port1.links, linkId]} as PortState);
    set(elementsAtom(port2.id), {...port2, links: [...port2.links, linkId]} as PortState);

    const linkPlacement: LinkPlacement = {};
    const updatedDiagram = {
        ...diagram,
        ports: {
            ...diagram.ports,
            [port1.id]: placement1,
            [port2.id]: placement2
        },
        links: {...diagram.links, [linkId]: linkPlacement}
    };

    set(elementsAtom(diagramId), updatedDiagram);
};

const autoConnectGanttTasks = withHistory(autoConnectGanttTasksImpl, "Connect Gantt Tasks");

export const ganttDiagramEditor = new GanttDiagramHandler();
