import {
    defaultLinkPlacement,
    LinkPlacement,
    NodePlacement,
    PortPlacement,
    StructureDiagramState
} from "./structureDiagram/structureDiagramState";
import {zeroBounds} from "../common/model";
import {
    ActivationState,
    lifelineDefaultHeight,
    lifelineDefaultWidth,
    lifelineHeadY,
    LifelinePlacement,
    LifelineState,
    MessageState,
    SequenceDiagramState
} from "./sequenceDiagram/sequenceDiagramModel";
import {
    CustomShape,
    defaultCornerStyle,
    defaultLineStyle,
    defaultRouteStyle,
    defaultNoteStyle,
    DiagramElement,
    ElementType,
    Id,
    LinkState,
    NodeState,
    PictureLayout,
    PortAlignment,
    PortState,
    RouteStyle,
    TipStyle,
} from "../package/packageModel";
import {NoteState} from "./commonComponents/commonComponentsModel";
import {DeploymentDiagramState} from "./deploymentDiagram/deploymentDaigramModel";
import {PredefinedSvg} from "./graphics/graphicsReader";
import {defaultColorSchema} from "../common/colors/colorSchemas";


export const elements: {[id: Id]: DiagramElement } = {
}

export const getClassDemoDiagram = (id: string, title: string): StructureDiagramState => {
    const node1Id = "node1";
    const port11: PortState = {
        type: ElementType.ClassPort,
        id: "port11",
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        nodeId: node1Id,
        links: []
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
        longitude: 8,
        nodeId: node1Id,
        links: []
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
        nodeId: node1Id,
        links: []
    }
    elements[port13.id] = port13;


    const port13Placement: PortPlacement = {
        edgePosRatio: 50,
        alignment: PortAlignment.Bottom,
    }

    const node1: NodeState = {
        type: ElementType.ClassNode,
        id: node1Id,
        ports: [
            port11.id,
            port12.id,
            port13.id
        ],
        text: "Alice",
        colorSchema: defaultColorSchema
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

    const nodeId2 = "node2";
    const port2: PortState = {
        type: ElementType.ClassPort,
        id: "port21",
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        nodeId: nodeId2,
        links: []
    }
    elements[port2.id] = port2;

    const port2Placement: PortPlacement = {
        alignment: PortAlignment.Left,
        edgePosRatio: 50,
    }

    const node2: NodeState = {
        type: ElementType.ClassNode,
        id: nodeId2,
        ports: [
            port2.id,
        ],
        text: "Bob",
        colorSchema: defaultColorSchema
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

    const node3Id = "node3";

    const port31: PortState = {
        type: ElementType.ClassPort,
        id: "port31",
        depthRatio: 50,
        latitude: 8,
        longitude: 8,
        nodeId: node3Id,
        links: []
    }

    const node3: NodeState = {
        type: ElementType.ClassNode,
        id: node3Id,
        ports: [port31.id],
        text: "Charlie",
        colorSchema: defaultColorSchema
    }

    elements[node3.id] = node3;

    const node3Placement: NodePlacement = {
        bounds: {
            y: 400,
            x: 150,
            width: 100,
            height: 80
        }
    }

    const nodePlacements: { [id: Id]: NodePlacement } = {
        [node1.id]: node1Placement,
        [node2.id]: node2Placement,
        [node3.id]: node3Placement
    }



    elements[port31.id] = port31;

    const port31Placement: PortPlacement = {
        alignment: PortAlignment.Top,
        edgePosRatio: 50,
    }

    const portPlacements:  {[id: Id]: PortPlacement} = {
        [port11.id]: port11Placement,
        [port12.id]: port12Placement,
        [port13.id]: port13Placement,
        [port2.id]: port2Placement,
        [port31.id]: port31Placement
    }



    const link1: LinkState = {
        id: "link1",
        type: ElementType.ClassLink,
        port1: port11.id,
        port2: port2.id,
        tipStyle1: TipStyle.Arrow,
        tipStyle2: TipStyle.Arrow,
        colorSchema: defaultColorSchema,
        routeStyle: defaultRouteStyle,
        cornerStyle: defaultCornerStyle
    };

    elements[link1.id] = link1;
    port11.links.push(link1.id);
    port2.links.push(link1.id);

    const link13: LinkState = {
        id: "link13",
        type: ElementType.ClassLink,
        port1: port13.id,
        port2: port31.id,
        tipStyle1: TipStyle.Diamond,
        tipStyle2: TipStyle.Diamond,
        colorSchema: defaultColorSchema,
        routeStyle: RouteStyle.Bezier,
        cornerStyle: defaultCornerStyle
    };

    elements[link13.id] = link13;
    port31.links.push(link13.id);
    port12.links.push(link13.id);


    const Link1Placement: LinkPlacement = {...defaultLinkPlacement};

    const linkPlacements: { [id: Id]: LinkPlacement } = {
        [link1.id]: Link1Placement,
        [link13.id]: Link1Placement
    }


    const note1: NoteState = {
        type: ElementType.Note,
        id: 'note1',
        text:
            'This is how we connect Alice to Bob',
        bounds: {
            x: 300,
            y: 120,
            width: 160,
            height: 60
        },
        colorSchema: defaultNoteStyle
    }

    return {
        id: id,
        title: title,
        selectedElements: [],
        type: ElementType.ClassDiagram,
        nodes: nodePlacements,
        ports: portPlacements,
        links: linkPlacements,
        notes: {[note1.id]: note1},
    };
};
export const getDeploymentDemoDiagram = (id: string, title: string): DeploymentDiagramState => {
    const node1Id = "node21";
    const customShape : CustomShape = {
        layout: PictureLayout.TopLeftCorner,
        pictureId: PredefinedSvg.SQS
    }

    const node1: NodeState = {
        type: ElementType.DeploymentNode,
        customShape: customShape,
        id: node1Id,
        ports: [],
        text: "Server",
        colorSchema: defaultColorSchema
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

    const nodeId2 = "node22";
    const node2: NodeState = {
        type: ElementType.DeploymentNode,
        id: nodeId2,
        ports: [],
        text: "Database",
        colorSchema: defaultColorSchema
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

    const note1: NoteState = {
        type: ElementType.Note,
        id: 'note1',
        text: 'This is how we connect Server to Database',
        bounds: {
            x: 300,
            y: 120,
            width: 160,
            height: 60
        },
        colorSchema: defaultNoteStyle
    }

    return {
        id: id,
        title: title,
        selectedElements: [],
        type: ElementType.DeploymentDiagram,
        nodes: nodePlacements,
        ports: {},
        links: {},
        notes: {[note1.id]: note1},
    };
};
export const getSequenceDemoDiagram = (): SequenceDiagramState => {
    const lifeline1Id = 'line1';
    const activation1: ActivationState = {
        type: ElementType.SequenceActivation,
        id: 'act1',
        lifelineId: lifeline1Id,
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
        lifelineStart: 0,
        lifelineEnd: 200,
    }


    const lifeline1: LifelineState = {
        placement: lifeline1Placement,
        type: ElementType.SequenceLifeLine,
        id: lifeline1Id,
        title: 'Alice',
        activations: [activation1.id],
        colorSchema: defaultColorSchema
    }

    const lifeline2Id = 'line2';
    const activation2: ActivationState = {
        type: ElementType.SequenceActivation,
        id: 'act2',
        lifelineId: lifeline2Id,
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
        lifelineStart: 0,
        lifelineEnd: 200,
    }

    const lifeline2: LifelineState = {
        type: ElementType.SequenceLifeLine,
        id: lifeline2Id,
        title: 'Bob',
        activations: [activation2.id],
        placement: lifeline2Placement,
        colorSchema: defaultColorSchema
    }

    const lifelines: { [id: Id]: LifelineState } = {
        [lifeline1.id]: lifeline1,
        [lifeline2.id]: lifeline2
    }

    const message1: MessageState =
    {
        isAsync: false,
        type: ElementType.SequenceMessage,
        isReturn: false,
        id: 'message1',
        activation1: 'act1',
        activation2: 'act2',
        sourceActivationOffset: 10,
        placement: {
            x: 0, y: 0, points: []
        },
        lineStyle: defaultLineStyle
    }


    const messages: { [id: Id]: MessageState } = {
        [message1.id]: message1
    }

    const activations: { [id: Id]: ActivationState } = {
        [activation1.id]: activation1,
        [activation2.id]: activation2
    }

    const note1: NoteState = {
        type: ElementType.Note,
        id: 'note1',
        text:
            'This is how we connect Alice to Bob',
        bounds: {
            x: 400,
            y: 120,
            width: 160,
            height: 60
        },
        colorSchema: defaultNoteStyle
    }
    const notes: { [id: Id]: NoteState } = {
        [note1.id]: note1
    }

    return {
        lifelines,
        messages,
        activations,
        type: ElementType.SequenceDiagram,
        id: 'sequence-d-1',
        title: 'Demo Sequence Diagram',
        notes: notes
    } as SequenceDiagramState
}

const demoDiagram1 = getClassDemoDiagram( "class-d-1", "Demo Class Diagram 1")
const demoDiagram2 = getDeploymentDemoDiagram("deployment-d-1", "Demo Deployment Diagram 1");
const demoDiagram3 = getSequenceDemoDiagram()

elements[demoDiagram1.id] = demoDiagram1;
elements[demoDiagram2.id] = demoDiagram2;
elements[demoDiagram3.id] = demoDiagram3;

export const demoActiveDiagramId = demoDiagram1.id;
export const demoOpenDiagramIds = [demoDiagram1.id, demoDiagram2.id, demoDiagram3.id];





