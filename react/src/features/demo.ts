import {
    ClassDiagramState,
    LinkPlacement,
    linkPlacement,
    NodePlacement,
    portBounds,
    PortPlacement
} from "./classDiagram/model";
import {zeroBounds} from "../common/model";
import {ClassDiagramEditor} from "./classDiagram/classDiagramSlice";
import {
    activationPlacement,
    ActivationState,
    lifelineDefaultHeight,
    lifelineDefaultWidth,
    lifelineHeadY, LifelinePlacement,
    LifelineState,
    MessageKind,
    messagePlacement,
    MessageState,
    SequenceDiagramState
} from "./sequenceDiagram/model";
import {OpenDiagrams} from "./diagramTabs/diagramTabsSlice";
import {SequenceDiagramEditor} from "./sequenceDiagram/sequenceDiagramSlice";
import {ElementType, Id, LinkState, NodeState, PortAlignment, PortState} from "../package/packageModel";

export const getClassDemoDiagram = (): ClassDiagramState => {
    const port11: PortState = {
        type: ElementType.ClassPort,
        id: "port11",
        edgePosRatio: 50,
        alignment: PortAlignment.Right,
        depthRatio: 50,
        latitude: 8,
        longitude: 8
    }

    const port12: PortState = {
        type: ElementType.ClassPort,
        id: "port12",
        edgePosRatio: 50,
        alignment: PortAlignment.Top,
        depthRatio: 50,
        latitude: 8,
        longitude: 8
    }

    const port13: PortState = {
        type: ElementType.ClassPort,
        id: "port13",
        edgePosRatio: 50,
        alignment: PortAlignment.Bottom,
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
    }

    const node1: NodeState = {
        type: ElementType.ClassNode,
        id: "node1",
        ports: [
            port11.id,
            port12.id,
            port13.id
        ],
        text: "Alice",
    };

    const node1Placement: NodePlacement = {
        y: 50,
        x: 50,
        width: 100,
        height: 80
    }

    const port2: PortState = {
        type: ElementType.ClassPort,
        id: "port21",
        edgePosRatio: 50,
        alignment: PortAlignment.Left,
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
    }

    const node2: NodeState = {
        type: ElementType.ClassNode,
        id: "node2",
        ports: [
            port2.id,
        ],
        text: "Bob",
    };

    const node2Placement: NodePlacement = {
        y: 300,
        x: 300,
        width: 100,
        height: 80
    }

    const nodes: NodeState[] = [
        node1,
        node2,
    ]

    const nodePlacements: { [id: Id]: NodePlacement } = {
        [node1.id]: node1Placement,
        [node2.id]: node2Placement
    }

    const ports: { [id: Id]: PortState } = {
        [port11.id]: port11,
        [port12.id]: port12,
        [port13.id]: port13,
        [port2.id]: port2
    }

    const portPlacements: { [id: Id]: PortPlacement } = {}

    for (let node of Object.values(nodes)) {
        node.ports.map(portId => portPlacements[portId] = portBounds(nodePlacements[node.id], ports[portId]!));
    }

    const link1: LinkState = {
        id: "link1",
        type: ElementType.ClassLink,
        port1: port11.id,
        port2: port2.id,
    };

    const linkPlacements: { [id: Id]: LinkPlacement } = {}


    const links: { [id: Id]: LinkState } = {
        [link1.id]: link1
    }

    for (let link of Object.values(links)) {
        linkPlacements[link.id] = linkPlacement(ports[link.port1], ports[link.port2]);
    }

    return {
        nodes: nodePlacements,
        links: linkPlacements,
        ports: portPlacements
    };
};

export const getSequenceDemoDiagram = (): SequenceDiagramState => {
    const activation1 = {
        id: 'act1',
        start: 50,
        length: 100,
        placement: zeroBounds
    };
    const lifeLine1: LifelineState = {
        id: 'line1',
        title: 'Alice',
        activations: [activation1.id],
    }

    const lifeline1Placement: LifelinePlacement = {
        headBounds: {
            x: 100,
            y: lifelineHeadY,
            width: lifelineDefaultWidth,
            height: lifelineDefaultHeight
        },
        lifelineEnd: 200,
    }

    const activation2 = {
        id: 'act2',
        start: 50,
        length: 100,
        placement: zeroBounds
    };
    const lifeLine2: LifelineState = {
        id: 'line2',
        title: 'Bob',
        activations: [activation2.id],
    }

    const lifeline2Placement: LifelinePlacement = {
        headBounds: {
            x: 320,
                y: lifelineHeadY,
                width: lifelineDefaultWidth,
                height: lifelineDefaultHeight
        },
        lifelineEnd: 200,
    }

    const lifelinePlacements: { [id: Id]: LifelinePlacement } = {
        [lifeLine1.id]: lifeline1Placement,
        [lifeLine2.id]: lifeline2Placement
    }

    const message1: MessageState =
    {
        kind: MessageKind.Call,
        id: 'message1',
        sourceActivation: 'act1',
        targetActivation: 'act2',
        sourceActivationOffset: 10,
        placement: {
            x: 0, y: 0, points: []
        }
    }


    const messages: { [id: Id]: MessageState } = {
        [message1.id]: message1
    }

    const activations: { [id: Id]:  ActivationState} = {
        [activation1.id]: activation1,
        [activation2.id]: activation2
    }

    for (let lifeline of Object.values(lifelines))
        for(let activation of lifeline.activations)
            activations[activation].placement = activationPlacement(activations[activation], lifeline.placement);

    for (let message of Object.values(messages))
        message.placement = messagePlacement(activations[message.sourceActivation], activations[message.targetActivation], message.sourceActivationOffset);

    return {
        lifelines,
        messages,
        activations
    }
}

export const demoClassDiagramEditor = (title: string): ClassDiagramEditor => {
    return {
        diagram: {...getClassDemoDiagram(), title: title},
        selectedElements: [],
        type: DiagramEditorType.Class,
        snapGridSize: 5
    }
}

export const demoSequenceDiagramEditor = (title: string): SequenceDiagramEditor => {
    return {
        diagram: {...getSequenceDemoDiagram(), title: title},
        selectedElements: [],
        type: DiagramEditorType.Sequence,
        snapGridSize: 5
    }
}

export const demoDiagramEditors: OpenDiagrams = {
    activeIndex: 0,
    editors: [
        demoClassDiagramEditor("Demo Class 1"),
        demoClassDiagramEditor("Demo Class 2"),
        demoSequenceDiagramEditor("Demo Sequence 1"),
    ]
}





