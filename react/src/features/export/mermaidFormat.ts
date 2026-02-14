import {Diagram} from "../../common/model";
import {
    CornerStyle,
    ElementType,
    FlowchartNodeKind,
    LinkState,
    NodeState,
    PortState,
    RouteStyle,
    TipStyle
} from "../../package/packageModel";
import {
    ActivationState,
    LifelineState,
    lifelineDefaultWidth,
    lifelineDefaultHeight,
    lifelineDefaultSpacing,
    lifelineHeadY,
    lifelineDefaultStart,
    messageDefaultSpacing,
    MessageState,
    SequenceDiagramState
} from "../sequenceDiagram/sequenceDiagramModel";
import {StructureDiagramState} from "../structureDiagram/structureDiagramState";
import {defaultColorSchema} from "../../common/colors/colorSchemas";
import {defaultLineStyle} from "../../package/packageModel";

let idCounter = 0;
function generateId(): string {
    return `mermaid_${++idCounter}`;
}

/**
 * Import a Mermaid sequence diagram into CloudDiagram format
 */
export function importMermaidSequenceDiagram(baseDiagram: Diagram, content: string): Diagram {
    idCounter = 0;
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));

    // Check if it's a sequence diagram
    const headerLine = lines.find(l => l.toLowerCase().startsWith('sequencediagram'));
    if (!headerLine) {
        throw new Error('Not a valid Mermaid sequence diagram');
    }

    const lifelines: { [id: string]: LifelineState } = {};
    const messages: { [id: string]: MessageState } = {};
    const activations: { [id: string]: ActivationState } = {};

    // Map participant names to their IDs (including aliases)
    const participantMap: { [name: string]: string } = {};
    // Map short identifiers to full names
    const aliasMap: { [alias: string]: string } = {};
    let lifelineIndex = 0;
    let messageOffset = 0;

    function getOrCreateLifeline(name: string): string {
        const normalizedName = name.trim();

        // Check if this is an alias that maps to a known participant
        if (aliasMap[normalizedName]) {
            return participantMap[aliasMap[normalizedName]];
        }

        if (participantMap[normalizedName]) {
            return participantMap[normalizedName];
        }

        const lifelineId = generateId();
        const activationId = generateId();

        const headBounds = {
            x: 50 + lifelineIndex * (lifelineDefaultWidth + lifelineDefaultSpacing),
            y: lifelineHeadY,
            width: lifelineDefaultWidth,
            height: lifelineDefaultHeight
        };

        lifelines[lifelineId] = {
            id: lifelineId,
            type: ElementType.SequenceLifeLine,
            title: normalizedName,
            activations: [activationId],
            placement: {
                headBounds,
                lifelineStart: lifelineDefaultStart,
                lifelineEnd: 300
            },
            colorSchema: defaultColorSchema
        };

        activations[activationId] = {
            id: activationId,
            type: ElementType.SequenceActivation,
            lifelineId: lifelineId,
            start: 0,
            length: 300,
            placement: {}
        };

        participantMap[normalizedName] = lifelineId;
        lifelineIndex++;
        return lifelineId;
    }

    function getActivationForLifeline(lifelineId: string): string {
        const lifeline = lifelines[lifelineId];
        return lifeline.activations[0];
    }

    // Parse lines
    for (const line of lines) {
        if (line.toLowerCase().startsWith('sequencediagram')) continue;

        // Parse participant declarations: participant A or participant A as "Alias"
        const participantMatch = line.match(/^participant\s+(\S+)(?:\s+as\s+(.+))?$/i);
        if (participantMatch) {
            const identifier = participantMatch[1];
            const displayName = participantMatch[2]?.replace(/["']/g, '') || identifier;
            getOrCreateLifeline(displayName);
            // Map the identifier to the display name so messages using the identifier work
            if (identifier !== displayName) {
                aliasMap[identifier] = displayName;
            }
            continue;
        }

        // Parse actor declarations
        const actorMatch = line.match(/^actor\s+(\S+)(?:\s+as\s+(.+))?$/i);
        if (actorMatch) {
            const identifier = actorMatch[1];
            const displayName = actorMatch[2]?.replace(/["']/g, '') || identifier;
            getOrCreateLifeline(displayName);
            // Map the identifier to the display name so messages using the identifier work
            if (identifier !== displayName) {
                aliasMap[identifier] = displayName;
            }
            continue;
        }

        // Parse messages: A->>B: message or A-->>B: message (async) or A--)B: message
        const messageMatch = line.match(/^(\S+?)\s*(--?>>?|--?\)|--?>)\s*(\S+?)\s*:\s*(.*)$/);
        if (messageMatch) {
            const [, from, arrow, to, text] = messageMatch;
            const fromLifelineId = getOrCreateLifeline(from);
            const toLifelineId = getOrCreateLifeline(to);

            const isAsync = arrow.includes('--');
            const isReturn = arrow.includes(')');

            const messageId = generateId();
            messages[messageId] = {
                id: messageId,
                type: ElementType.SequenceMessage,
                activation1: getActivationForLifeline(fromLifelineId),
                activation2: getActivationForLifeline(toLifelineId),
                text: text.trim(),
                isReturn,
                isAsync,
                sourceActivationOffset: messageDefaultSpacing + messageOffset,
                placement: {},
                lineStyle: defaultLineStyle
            };
            messageOffset += messageDefaultSpacing;
        }
    }

    // Adjust lifeline lengths based on messages
    const totalHeight = messageOffset + 100;
    Object.values(lifelines).forEach(lifeline => {
        lifeline.placement.lifelineEnd = totalHeight;
    });
    Object.values(activations).forEach(activation => {
        activation.length = totalHeight - lifelineDefaultStart;
    });

    const result: SequenceDiagramState = {
        id: baseDiagram.id,
        display: {
            ...baseDiagram.display,
            width: 2000,
            height: totalHeight + 200,
            offset: { x: 0, y: 0 }
        },
        type: ElementType.SequenceDiagram,
        lifelines,
        messages,
        activations,
        notes: {},
        selectedElements: []
    };

    return result;
}

/**
 * Import a Mermaid class/flowchart diagram into CloudDiagram structure format
 */
export function importMermaidFlowchartDiagram(baseDiagram: Diagram, content: string): Diagram {
    return importMermaidStructureDiagram(baseDiagram, content, { forceFlowchart: true });
}

interface ImportStructureOptions {
    forceFlowchart?: boolean;
}

function toFlowchartKind(shape: "process" | "decision" | "terminator" | "input-output" | undefined): FlowchartNodeKind | undefined {
    switch (shape) {
        case "decision":
            return FlowchartNodeKind.Decision;
        case "terminator":
            return FlowchartNodeKind.Terminator;
        case "input-output":
            return FlowchartNodeKind.InputOutput;
        case "process":
            return FlowchartNodeKind.Process;
        default:
            return undefined;
    }
}

export function importMermaidStructureDiagram(baseDiagram: Diagram, content: string, options?: ImportStructureOptions): Diagram {
    idCounter = 0;
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));

    // Check if it's a class diagram or flowchart
    const headerLine = lines.find(l =>
        l.toLowerCase().startsWith('classdiagram') ||
        l.toLowerCase().startsWith('flowchart') ||
        l.toLowerCase().startsWith('graph')
    );

    if (!headerLine && !options?.forceFlowchart) {
        throw new Error('Not a valid Mermaid class diagram or flowchart');
    }

    const lowerHeaderLine = (headerLine ?? "flowchart").toLowerCase();
    const flowchartMode =
        options?.forceFlowchart === true ||
        baseDiagram.type === ElementType.FlowchartDiagram ||
        lowerHeaderLine.startsWith("flowchart") ||
        lowerHeaderLine.startsWith("graph");

    const elements: { [id: string]: any } = {};
    const nodes: { [id: string]: any } = {};
    const ports: { [id: string]: any } = {};
    const links: { [id: string]: any } = {};

    // Map node names to their IDs
    const nodeMap: { [name: string]: string } = {};
    let nodeIndex = 0;

    function getOrCreateNode(
        name: string,
        label?: string,
        flowchartKind?: FlowchartNodeKind
    ): string {
        const normalizedName = name.trim();
        if (nodeMap[normalizedName]) {
            const nodeId = nodeMap[normalizedName];
            // Update label if provided and previously not set
            if (label) {
                (elements[nodeId] as NodeState).text = label.trim();
            }
            if (flowchartKind && flowchartMode) {
                (elements[nodeId] as NodeState).flowchartKind = flowchartKind;
            }
            return nodeId;
        }

        const nodeId = generateId();
        const nodeWidth = 140; // Slightly wider for better text fit
        const nodeHeight = 60;
        const nodesPerRow = 5; // More nodes per row
        const spacingX = 60;
        const spacingY = 80;

        const row = Math.floor(nodeIndex / nodesPerRow);
        const col = nodeIndex % nodesPerRow;

        const bounds = {
            x: 100 + col * (nodeWidth + spacingX), // More initial offset
            y: 100 + row * (nodeHeight + spacingY),
            width: nodeWidth,
            height: nodeHeight
        };

        elements[nodeId] = {
            id: nodeId,
            type: ElementType.ClassNode,
            text: (label || normalizedName).trim(),
            ports: [],
            colorSchema: defaultColorSchema,
            flowchartKind: flowchartMode ? (flowchartKind ?? FlowchartNodeKind.Process) : undefined
        } as NodeState;

        nodes[nodeId] = {
            bounds
        };

        nodeMap[normalizedName] = nodeId;
        nodeIndex++;
        return nodeId;
    }

    function createPort(nodeId: string, alignment: number): string {
        const portId = generateId();
        elements[portId] = {
            id: portId,
            type: ElementType.ClassPort,
            nodeId,
            links: [],
            depthRatio: 50,
            latitude: 10,
            longitude: 10
        } as PortState;

        const node = elements[nodeId] as NodeState;
        node.ports.push(portId);

        ports[portId] = {
            alignment,
            edgePosRatio: 50
        };
        return portId;
    }

    function createLink(sourceNodeId: string, targetNodeId: string, arrowType?: string, edgeLabel?: string): void {
        let fromId = sourceNodeId;
        let toId = targetNodeId;
        const normalizedArrow = arrowType ?? "-->";

        // Mermaid flowchart can express reverse directions (`<--`); normalize to one-way link.
        if (flowchartMode && normalizedArrow.includes("<") && !normalizedArrow.includes(">")) {
            fromId = targetNodeId;
            toId = sourceNodeId;
        }

        const linkId = generateId();
        const sourcePortId = createPort(fromId, 1); // Right
        const targetPortId = createPort(toId, 0); // Left

        let tipStyle2 = TipStyle.Arrow;
        if (!flowchartMode) {
            if (normalizedArrow === '<|--') tipStyle2 = TipStyle.Triangle;
            if (normalizedArrow === '--*') tipStyle2 = TipStyle.Diamond;
            if (normalizedArrow === '--o') tipStyle2 = TipStyle.Circle;
        }

        elements[linkId] = {
            id: linkId,
            type: ElementType.ClassLink,
            port1: sourcePortId,
            port2: targetPortId,
            tipStyle1: TipStyle.None,
            tipStyle2,
            routeStyle: flowchartMode ? RouteStyle.OrthogonalSquare : RouteStyle.Direct,
            cornerStyle: CornerStyle.Straight,
            colorSchema: defaultColorSchema,
            text: edgeLabel?.trim() || undefined
        } as LinkState;

        (elements[sourcePortId] as PortState).links.push(linkId);
        (elements[targetPortId] as PortState).links.push(linkId);

        links[linkId] = {};
    }

    // Parse lines
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('classdiagram') ||
            lowerLine.startsWith('flowchart') ||
            lowerLine.startsWith('graph')) continue;

        // Parse simple C4-style definitions:
        // Person(user, "User"), System(core, "Core System"), Container(web, "Web App"), Component(api, "API")
        const c4NodeMatch = line.match(/^(Person|System|Container|Component)\s*\(\s*([\w-]+)\s*,\s*"?([^",)]+)"?(?:\s*,.*)?\)\s*$/i);
        if (c4NodeMatch) {
            const [, c4Type, id, label] = c4NodeMatch;
            const kindByType: Record<string, FlowchartNodeKind> = {
                person: FlowchartNodeKind.C4Person,
                system: FlowchartNodeKind.C4System,
                container: FlowchartNodeKind.C4Container,
                component: FlowchartNodeKind.C4Component
            };
            getOrCreateNode(id, label, kindByType[c4Type.toLowerCase()]);
            continue;
        }

        // Parse simple C4 relationships:
        // Rel(user, core, "Uses"), Rel_D(containerA, containerB, "Calls")
        const c4RelMatch = line.match(/^Rel(?:_[UDLR])?\s*\(\s*([\w-]+)\s*,\s*([\w-]+)\s*,\s*"?([^",)]+)"?(?:\s*,.*)?\)\s*$/i);
        if (c4RelMatch) {
            const [, from, to, relLabel] = c4RelMatch;
            const fromNodeId = getOrCreateNode(from);
            const toNodeId = getOrCreateNode(to);
            createLink(fromNodeId, toNodeId, "-->", relLabel);
            continue;
        }

        // Parse standalone node declarations in flowchart:
        // A[/Input/], A[Label], A(Label), A((Label)), A{Label}
        // Identifier can be followed by an optional space before the shape
        const nodeMatch = line.match(/^([\w-]+)\s*(?:\[\/([^\]]+)\/\]|\[([^\]]+)\]|\(\[([^\]]+)\]\)|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\})$/);
        if (nodeMatch) {
            const [, id, ioLabel, squareLabel, stadiumLabel, circleLabel, roundLabel, decisionLabel] = nodeMatch;
            const label = ioLabel || squareLabel || stadiumLabel || circleLabel || roundLabel || decisionLabel;
            const shape = decisionLabel ? "decision"
                : ioLabel ? "input-output"
                    : (stadiumLabel || circleLabel || roundLabel) ? "terminator"
                        : "process";
            getOrCreateNode(id, label, toFlowchartKind(shape));
            continue;
        }

        // Parse flowchart nodes and edges: A --> B or A[Label] --> B[Label]
        // Match both alphanumeric and hyphenated/underscored identifiers
        // Support optional space before shapes
        const flowMatch = line.match(/^([\w-]+)\s*(?:\[\/([^\]]+)\/\]|\[([^\]]+)\]|\(\[([^\]]+)\]\)|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\})?\s*(<\|--|<-->|<--|-->|---|-\.-|==>|--|--\.\.|--o|--\*|<->)\s*(?:\|([^|]+)\|\s*)?([\w-]+)\s*(?:\[\/([^\]]+)\/\]|\[([^\]]+)\]|\(\[([^\]]+)\]\)|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\})?(?:\s*\|([^|]+)\|)?$/);
        if (flowMatch) {
            const [, from, fio, fsquare, fstadium, fcircle, fround, fdecision, arrow, edgeLabelBefore, to, tio, tsquare, tstadium, tcircle, tround, tdecision, edgeLabelAfter] = flowMatch;
            const edgeLabel = edgeLabelBefore || edgeLabelAfter;
            const fromLabel = fio || fsquare || fstadium || fcircle || fround || fdecision;
            const toLabel = tio || tsquare || tstadium || tcircle || tround || tdecision;
            const fromShape = fromLabel
                ? (fdecision ? "decision"
                    : fio ? "input-output"
                        : (fstadium || fcircle || fround) ? "terminator"
                            : "process")
                : undefined;
            const toShape = toLabel
                ? (tdecision ? "decision"
                    : tio ? "input-output"
                        : (tstadium || tcircle || tround) ? "terminator"
                            : "process")
                : undefined;
            const fromNodeId = getOrCreateNode(from, fromLabel, toFlowchartKind(fromShape));
            const toNodeId = getOrCreateNode(to, toLabel, toFlowchartKind(toShape));
            createLink(fromNodeId, toNodeId, arrow, edgeLabel);
            continue;
        }

        // Parse class diagram relationships: ClassA <|-- ClassB or ClassA --> ClassB
        const classRelMatch = line.match(/^([\w-]+)\s*(<\|--|--|\.\.>|-->|--\*|--o|<--|<->)\s*([\w-]+)(?:\s*:\s*(.*))?$/);
        if (classRelMatch) {
            const [, from, arrow, to, relLabel] = classRelMatch;
            const fromNodeId = getOrCreateNode(from);
            const toNodeId = getOrCreateNode(to);
            createLink(fromNodeId, toNodeId, arrow, relLabel);
            continue;
        }

        // Parse standalone class declarations: class ClassName
        const classMatch = line.match(/^class\s+([\w-]+)/);
        if (classMatch) {
            getOrCreateNode(classMatch[1]);
            continue;
        }
    }

    const result: any = {
        ...baseDiagram,
        elements,
        nodes,
        ports,
        links,
        notes: {},
        selectedElements: [],
        display: {
            ...baseDiagram.display,
            width: 2000,
            height: 2000,
            offset: { x: 0, y: 0 }
        }
    };

    return result as StructureDiagramState;
}
