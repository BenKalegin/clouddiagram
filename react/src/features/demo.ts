import {
    ClassDiagramState,
    linkPlacement,
    LinkState,
    NodeState,
    PortAlignment,
    portBounds,
    PortState
} from "./classDiagram/model";
import {Bounds, Id, zeroBounds, zeroCoordinate} from "../common/Model";
import {ClassDiagramEditor, DiagramEditorType, SequenceDiagramEditor} from "./classDiagram/diagramEditorSlice";
import {
    activationPlacement,
    ActivationState, lifelineDefaultHeight, lifelineDefaultWidth, lifelineHeadY,
    LifelineState,
    MessageKind,
    messagePlacement,
    MessageState,
    SequenceDiagramState
} from "./sequenceDiagram/model";

export const getClassDemoDiagram = (): ClassDiagramState => {
    const port11: PortState = {
        id: "port11",
        edgePosRatio: 50,
        alignment: PortAlignment.Right,
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        placement: {} as Bounds,
    }

    const port12: PortState = {
        id: "port12",
        edgePosRatio: 50,
        alignment: PortAlignment.Top,
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        placement: {} as Bounds,
    }

    const port13: PortState = {
        id: "port13",
        edgePosRatio: 50,
        alignment: PortAlignment.Bottom,
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        placement: {} as Bounds,
    }

    const node1: NodeState = {
        id: "node1",
        ports: [
            port11.id,
            port12.id,
            port13.id
        ],
        text: "Alice",
        placement: {
            y: 50,
            x: 50,
            width: 100,
            height: 80
        }
    };

    const port2: PortState = {
        id: "port21",
        edgePosRatio: 50,
        alignment: PortAlignment.Left,
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        placement: {} as Bounds,
    }

    const node2: NodeState = {
        id: "node2",
        ports: [
            port2.id,
        ],
        text: "Bob",
        placement: {
            y: 300,
            x: 300,
            width: 100,
            height: 80
        }
    };

    const nodes: { [id: Id]: NodeState } = {
        [node1.id]: node1,
        [node2.id]: node2
    }

    const ports: { [id: Id]: PortState } = {
        [port11.id]: port11,
        [port12.id]: port12,
        [port13.id]: port13,
        [port2.id]: port2
    }

    for (let node of Object.values(nodes)) {
        node.ports.map(portId => ports[portId].placement = portBounds(node.placement, ports[portId]!));
    }

    const link1: LinkState = {
        port1: port11.id,
        port2: port2.id,
        placement: {svgPath: []},
        id: "link1"
    };

    const links: { [id: Id]: LinkState } = {
        [link1.id]: link1
    }

    for (let link of Object.values(links)) {
        link.placement = linkPlacement(ports[link.port1], ports[link.port2]);
    }

    return {
        nodes,
        links,
        ports
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
        placement: {
            headBounds: {
                x: 100,
                y: lifelineHeadY,
                width: lifelineDefaultWidth,
                height: lifelineDefaultHeight
            },
            lifelineEnd: 200,
        },
        activations: [activation1.id],

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
        placement: {
            headBounds: {
                x: 320,
                y: lifelineHeadY,
                width: lifelineDefaultWidth,
                height: lifelineDefaultHeight
            },
            lifelineEnd: 200,
        },
        activations: [activation2.id],
    }

    const lifelines: { [id: Id]: LifelineState } = {
        [lifeLine1.id]: lifeLine1,
        [lifeLine2.id]: lifeLine2
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
        message.placement = messagePlacement(message, activations[message.sourceActivation], activations[message.targetActivation]);

    return {
        lifelines,
        messages,
        activations
    }
}

export const demoClassDiagramEditor = (title: string): ClassDiagramEditor => {
    return {
        linkingMousePos: zeroCoordinate,
        diagram: {...getClassDemoDiagram(), title: title},
        selectedElements: [],
        type: DiagramEditorType.Class

    }
}

export const demoSequenceDiagramEditor = (title: string): SequenceDiagramEditor => {
    return {
        linkingMousePos: zeroCoordinate,
        diagram: {...getSequenceDemoDiagram(), title: title},
        selectedElements: [],
        type: DiagramEditorType.Sequence
    }
}

