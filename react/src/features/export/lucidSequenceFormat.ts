import {
    ActivationId,
    ActivationState, lifelineDefaultSpacing, lifelineDefaultStart, lifelineDefaultWidth,
    LifelinePlacement,
    LifelineState,
    MessageState,
    SequenceDiagramState
} from "../sequenceDiagram/sequenceDiagramModel";
import {Diagram} from "../../common/model";
import {defaultShapeStyle, ElementType} from "../../package/packageModel";

function arrow(message: MessageState) {
    if (message.isReturn)
        return "-->";
    return "->";
}

export function exportSequenceDiagramAsLucid(baseDiagram: Diagram): string {
    const diagram = baseDiagram as SequenceDiagramState;
    const lifelines = diagram.lifelines;

    const lines: string[] = [];

    // TODO unify with plantuml - make some kind of view model for export
    const existingAliases = new Set<string>();

    const lifelineAliases = Object.values(lifelines)
        .sort((a, b) => a.placement.headBounds.x - b.placement.headBounds.x)
        .reduce((acc, lifeline) => {
            const alias = lifeline.title;
            if (existingAliases.has(alias)) {
                let i = 1;
                while (existingAliases.has(alias + i)) {
                    i++;
                }
                acc[lifeline.id] = alias + i;
                existingAliases.add(alias + i);
            }
            acc[lifeline.id] = alias;
            return acc;
        }, {} as Record<ActivationId, string>);

    const activationOffsets = Object.values(diagram.activations).reduce((acc, activation) => {
        acc[activation.id] = activation.start;
        return acc;
    }, {} as Record<ActivationId, number>);

    Object.values(diagram.messages)
        .sort((a, b) => activationOffsets[a.activation1] + a.sourceActivationOffset - activationOffsets[b.activation1] - b.sourceActivationOffset)
        .forEach(message => {
            lines.push(`${lifelineAliases[diagram.activations[message.activation1].lifelineId]} ${arrow(message)} ${lifelineAliases[diagram.activations[message.activation2].lifelineId]}`); // to activation
        })

    return lines.join("\n");
}

export function importSequenceDiagramFromLucid(markup: string): Diagram {
    const lines = markup.split(/\r?\n/);
    const messages = new Array<MessageState>();
    const lifeLines = new Map<string, LifelineState>();
    let lifelineCounter = 0;
    const activations = new Array<ActivationState>();

    function findOrAddLifeline(lifelineAlias: string) {
        if (!lifeLines.has(lifelineAlias)) {
            const lifeline: LifelineState = {
                activations: [],
                id: `ll${++lifelineCounter}`,
                placement: {
                    headBounds: {
                        x: (lifelineCounter-1) * (lifelineDefaultWidth + lifelineDefaultSpacing)+ lifelineDefaultStart,
                        width: lifelineDefaultWidth
                    }
                } as LifelinePlacement,
                shapeStyle: defaultShapeStyle,
                title: "",
                type: ElementType.SequenceLifeLine

            }
            lifeLines.set(lifelineAlias, lifeline);
        }
        return lifeLines.get(lifelineAlias);
    }

    for (const line of lines) {
       //  function addMessage(leftToRight: boolean, arrowPos: number) {
       //      const fromAlias = line.substring(0, arrowPos).trim();
       //      const toAlias = line.substring(arrowPos + 2).trim();
       //      const from
       //      messages.push();
       //  }
       //
       //  const rightArrow = line.indexOf("->");
       // if (rightArrow > 0) {
       //     addMessage();
       // }
       //
       //      parsedSequence.messages.push({
       //          from,
       //          to,
       //          content,
       //          isResponse,
       //      });
    }
    return {
        id: "", notes: {}, selectedElements: [],
        title: "new diagram",
        type: ElementType.SequenceDiagram
    }
}
