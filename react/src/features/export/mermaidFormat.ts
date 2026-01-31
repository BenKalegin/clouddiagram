import {Diagram} from "../../common/model";
import {ElementType} from "../../package/packageModel";
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
        const messageMatch = line.match(/^(\S+)\s*(--?>>?|--?\)|--?>)\s*(\S+)\s*:\s*(.*)$/);
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
            continue;
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
        display: baseDiagram.display,
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
export function importMermaidStructureDiagram(baseDiagram: Diagram, content: string): Diagram {
    idCounter = 0;
    const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));

    // Check if it's a class diagram or flowchart
    const headerLine = lines.find(l =>
        l.toLowerCase().startsWith('classDiagram') ||
        l.toLowerCase().startsWith('flowchart') ||
        l.toLowerCase().startsWith('graph')
    );

    if (!headerLine) {
        throw new Error('Not a valid Mermaid class diagram or flowchart');
    }

    const nodes: { [id: string]: any } = {};
    const ports: { [id: string]: any } = {};
    const links: { [id: string]: any } = {};

    // Map node names to their IDs
    const nodeMap: { [name: string]: string } = {};
    let nodeIndex = 0;

    function getOrCreateNode(name: string, label?: string): string {
        const normalizedName = name.trim();
        if (nodeMap[normalizedName]) {
            return nodeMap[normalizedName];
        }

        const nodeId = generateId();
        const nodeWidth = 120;
        const nodeHeight = 60;
        const nodesPerRow = 4;
        const spacing = 50;

        const row = Math.floor(nodeIndex / nodesPerRow);
        const col = nodeIndex % nodesPerRow;

        nodes[nodeId] = {
            bounds: {
                x: 50 + col * (nodeWidth + spacing),
                y: 50 + row * (nodeHeight + spacing),
                width: nodeWidth,
                height: nodeHeight
            }
        };

        // Store node info in package elements (will be merged later)
        nodeMap[normalizedName] = nodeId;
        nodeIndex++;
        return nodeId;
    }

    function createPort(nodeId: string, alignment: number): string {
        const portId = generateId();
        ports[portId] = {
            alignment,
            edgePosRatio: 50
        };
        return portId;
    }

    function createLink(sourceNodeId: string, targetNodeId: string, _label?: string): void {
        const linkId = generateId();
        const sourcePortId = createPort(sourceNodeId, 1); // Right
        const targetPortId = createPort(targetNodeId, 0); // Left

        links[linkId] = {};

        // Store port-link relationships for later
    }

    // Parse lines
    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('classdiagram') ||
            lowerLine.startsWith('flowchart') ||
            lowerLine.startsWith('graph')) continue;

        // Parse class diagram relationships: ClassA <|-- ClassB or ClassA --> ClassB
        const classRelMatch = line.match(/^(\w+)\s*(<\|--|--|\.\.>|-->|--\*|--o|<--)\s*(\w+)(?:\s*:\s*(.*))?$/);
        if (classRelMatch) {
            const [, from, , to] = classRelMatch;
            getOrCreateNode(from);
            getOrCreateNode(to);
            createLink(nodeMap[from], nodeMap[to]);
            continue;
        }

        // Parse flowchart nodes and edges: A --> B or A[Label] --> B[Label]
        const flowMatch = line.match(/^(\w+)(?:\[([^\]]+)\])?\s*(-->|---|-\.-|==>)\s*(\w+)(?:\[([^\]]+)\])?(?:\s*\|([^|]+)\|)?$/);
        if (flowMatch) {
            const [, from, fromLabel, , to, toLabel] = flowMatch;
            getOrCreateNode(from, fromLabel);
            getOrCreateNode(to, toLabel);
            createLink(nodeMap[from], nodeMap[to]);
            continue;
        }

        // Parse standalone class declarations: class ClassName
        const classMatch = line.match(/^class\s+(\w+)/);
        if (classMatch) {
            getOrCreateNode(classMatch[1]);
            continue;
        }

        // Parse standalone node declarations in flowchart: A[Label]
        const nodeMatch = line.match(/^(\w+)\[([^\]]+)\]$/);
        if (nodeMatch) {
            getOrCreateNode(nodeMatch[1], nodeMatch[2]);
            continue;
        }
    }

    const result: StructureDiagramState = {
        ...baseDiagram,
        nodes,
        ports,
        links
    };

    return result;
}
