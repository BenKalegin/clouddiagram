import {Diagram} from "../../../common/model";
import {ElementType} from "../../../package/packageModel";
import {defaultColorSchema} from "../../../common/colors/colorSchemas";
import {defaultLineStyle} from "../../../package/packageModel";
import type {
    ActivationState,
    LifelineState,
    MessageState,
    SequenceDiagramState
} from "../../sequenceDiagram/sequenceDiagramModel";
import {createMermaidIdGenerator, mermaidSourceLines} from "./mermaidImportUtils";

const lifelineHeadY = 30;
const lifelineDefaultWidth = 100;
const lifelineDefaultStart = 30;
const lifelineDefaultSpacing = 20;
const lifelineDefaultHeight = 60;
const messageDefaultSpacing = 40;

/**
 * Import a Mermaid sequence diagram into CloudDiagram format
 */
export function importMermaidSequenceDiagram(baseDiagram: Diagram, content: string): Diagram {
    const generateId = createMermaidIdGenerator();
    const lines = mermaidSourceLines(content);

    const headerLine = lines.find(l => l.toLowerCase().startsWith('sequencediagram'));
    if (!headerLine) {
        throw new Error('Not a valid Mermaid sequence diagram');
    }

    const lifelines: { [id: string]: LifelineState } = {};
    const messages: { [id: string]: MessageState } = {};
    const activations: { [id: string]: ActivationState } = {};
    const participantMap: { [name: string]: string } = {};
    const aliasMap: { [alias: string]: string } = {};
    let lifelineIndex = 0;
    let messageOffset = 0;

    function getOrCreateLifeline(name: string): string {
        const normalizedName = name.trim();

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

    for (const line of lines) {
        if (line.toLowerCase().startsWith('sequencediagram')) continue;

        const participantMatch = line.match(/^participant\s+(\S+)(?:\s+as\s+(.+))?$/i);
        if (participantMatch) {
            const identifier = participantMatch[1];
            const displayName = participantMatch[2]?.replace(/["']/g, '') || identifier;
            getOrCreateLifeline(displayName);
            if (identifier !== displayName) {
                aliasMap[identifier] = displayName;
            }
            continue;
        }

        const actorMatch = line.match(/^actor\s+(\S+)(?:\s+as\s+(.+))?$/i);
        if (actorMatch) {
            const identifier = actorMatch[1];
            const displayName = actorMatch[2]?.replace(/["']/g, '') || identifier;
            getOrCreateLifeline(displayName);
            if (identifier !== displayName) {
                aliasMap[identifier] = displayName;
            }
            continue;
        }

        const messageMatch = line.match(/^(\S+?)\s*(--?>>?|--?\)|--?>)\s*(\S+?)\s*:\s*(.*)$/);
        if (messageMatch) {
            const [, from, arrow, to, text] = messageMatch;
            const fromLifelineId = getOrCreateLifeline(from);
            const toLifelineId = getOrCreateLifeline(to);

            const messageId = generateId();
            messages[messageId] = {
                id: messageId,
                type: ElementType.SequenceMessage,
                activation1: getActivationForLifeline(fromLifelineId),
                activation2: getActivationForLifeline(toLifelineId),
                text: text.trim(),
                isReturn: arrow.includes(')'),
                isAsync: arrow.includes('--'),
                sourceActivationOffset: messageDefaultSpacing + messageOffset,
                placement: {},
                lineStyle: defaultLineStyle
            };
            messageOffset += messageDefaultSpacing;
        }
    }

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
