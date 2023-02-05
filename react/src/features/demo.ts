import {ClassDiagramState, CornerStyle, LinkPlacement, NodePlacement, PortPlacement} from "./classDiagram/model";
import {zeroBounds} from "../common/model";
import {
    ActivationState,
    lifelineDefaultHeight,
    lifelineDefaultWidth,
    lifelineHeadY,
    LifelinePlacement,
    LifelineState,
    MessageKind,
    messagePlacement,
    MessageState,
    placeActivation,
    SequenceDiagramState
} from "./sequenceDiagram/model";
import {DiagramElement, ElementType, Id, LinkState, NodeState, PortAlignment, PortState} from "../package/packageModel";


export const elements: {[id: Id]: DiagramElement } = {
}

export const getClassDemoDiagram = (id: string, title: string): ClassDiagramState => {
    const port11: PortState = {
        type: ElementType.ClassPort,
        id: "port11",
        depthRatio: 50,
        latitude: 8,
        longitude: 8
    }
    elements[port11.id] = port11;

    const port11Placement: PortPlacement = {
        edgePosRatio: 50,
        alignment: PortAlignment.Right,
    }

    const port12: PortState = {
        type: ElementType.ClassPort,
        id: "port12",
        depthRatio: 50,
        latitude: 8,
        longitude: 8
    }
    elements[port12.id] = port12;

    const port12Placement: PortPlacement = {
        edgePosRatio: 50,
        alignment: PortAlignment.Top,
    }

    const port13: PortState = {
        type: ElementType.ClassPort,
        id: "port13",
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
    }
    elements[port13.id] = port13;


    const port13Placement: PortPlacement = {
        edgePosRatio: 50,
        alignment: PortAlignment.Bottom,
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
    elements[node1.id] = node1;

    const node1Placement: NodePlacement = {
        bounds: {
            y: 50,
            x: 50,
            width: 100,
            height: 80
        }
    }

    const port2: PortState = {
        type: ElementType.ClassPort,
        id: "port21",
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
    }
    elements[port2.id] = port2;

    const port2Placement: PortPlacement = {
        alignment: PortAlignment.Left,
        edgePosRatio: 50,
    }

    const portPlacements:  {[id: Id]: PortPlacement} = {
        [port11.id]: port11Placement,
        [port12.id]: port12Placement,
        [port13.id]: port13Placement,
        [port2.id]: port2Placement
    }

    const node2: NodeState = {
        type: ElementType.ClassNode,
        id: "node2",
        ports: [
            port2.id,
        ],
        text: "Bob",
    };
    elements[node2.id] = node2;

    const node2Placement: NodePlacement = {
        bounds: {
            y: 300,
            x: 300,
            width: 100,
            height: 80
        }
    }

    const nodePlacements: { [id: Id]: NodePlacement } = {
        [node1.id]: node1Placement,
        [node2.id]: node2Placement
    }

    const link1: LinkState = {
        id: "link1",
        type: ElementType.ClassLink,
        port1: port11.id,
        port2: port2.id,
    };

    elements[link1.id] = link1;

    const Link1Placement: LinkPlacement = {
        //cornerStyle: CornerStyle.Straight
    }

    const linkPlacements: { [id: Id]: LinkPlacement } = {
        // [link1.id]: Link1Placement
    }


    return {
        id: id,
        title: title,
        type: ElementType.ClassDiagram,
        nodes: nodePlacements,
        ports: portPlacements,
        links: linkPlacements
    };
};

export const getSequenceDemoDiagram = (): SequenceDiagramState => {
    const activation1: ActivationState = {
        type: ElementType.SequenceActivation,
        id: 'act1',
        start: 50,
        length: 100,
        placement: zeroBounds
    };

    const lifeline1Placement: LifelinePlacement = {
        headBounds: {
            x: 100,
            y: lifelineHeadY,
            width: lifelineDefaultWidth,
            height: lifelineDefaultHeight
        },
        lifelineEnd: 200,
    }


    const lifeline1: LifelineState = {
        placement: lifeline1Placement,
        type: ElementType.SequenceLifeLine,
        id: 'line1',
        title: 'Alice',
        activations: [activation1]
    }
    elements[lifeline1.id] = lifeline1;

    const activation2: ActivationState = {
        type: ElementType.SequenceActivation,
        id: 'act2',
        start: 50,
        length: 100,
        placement: zeroBounds
    };

    const lifeline2Placement: LifelinePlacement = {
        headBounds: {
            x: 320,
            y: lifelineHeadY,
            width: lifelineDefaultWidth,
            height: lifelineDefaultHeight
        },
        lifelineEnd: 200,
    }

    const lifeline2: LifelineState = {
        type: ElementType.SequenceLifeLine,
        id: 'line2',
        title: 'Bob',
        activations: [activation2],
        placement: lifeline2Placement
    }
    elements[lifeline2.id] = lifeline2;

    const lifelines: { [id: Id]: LifelineState } = {
        [lifeline1.id]: lifeline1,
        [lifeline2.id]: lifeline2
    }

    const message1: MessageState =
    {
        type: ElementType.SequenceMessage,
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
            activation.placement = placeActivation(activation, lifeline.placement);

    for (let message of Object.values(messages))
        message.placement = messagePlacement(activations[message.sourceActivation], activations[message.targetActivation], message.sourceActivationOffset);

    return {
        lifelines,
        messages,
        type: ElementType.SequenceDiagram,
        id: 'sequence-d-1',
        title: 'Demo Sequence Diagram'
    } as SequenceDiagramState
}

const demoDiagram1 = getClassDemoDiagram( "class-d-1", "Demo Class Diagram 1")
const demoDiagram2 = getClassDemoDiagram( "class-d-2", "Demo Class Diagram 2")
const demoDiagram3 = getSequenceDemoDiagram()

elements[demoDiagram1.id] = demoDiagram1;
elements[demoDiagram2.id] = demoDiagram2;
elements[demoDiagram3.id] = demoDiagram3;

export const demoActiveDiagramId = demoDiagram1.id;
export const demoOpenDiagramIds = [demoDiagram1.id, demoDiagram2.id, demoDiagram3.id];





