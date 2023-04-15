import {ActivationId, LifelineState, MessageState, SequenceDiagramState} from "../sequenceDiagram/sequenceDiagramModel";
import {Diagram} from "../../common/model";
import {PredefinedSvg} from "../graphics/graphicsReader";

function className(lifeline: LifelineState) {
    switch (lifeline.customShape?.pictureId) {
        case PredefinedSvg.Entity: return "entity";
        case PredefinedSvg.Control: return "control";
        case PredefinedSvg.Boundary: return "boundary";
        case PredefinedSvg.Actor: return "actor";
        // todo support database, collections, queue https://plantuml.com/sequence-diagram
        default: return "participant"
    }
}

function arrow(message: MessageState) {
    if (message.isReturn)
        return "-->";
    return "->";
}

export function exportSequenceDiagramAsPlantUml(baseDiagram: Diagram): string {
    const diagram = baseDiagram as SequenceDiagramState;
    const lifelines = diagram.lifelines;

    const lines: string[] = [];

    // noinspection SpellCheckingInspection
    lines.push(`@startuml`);

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

    console.log(lifelineAliases);
    Object.values(lifelines)
        .sort((a, b) => a.placement.headBounds.x - b.placement.headBounds.x)
        .forEach(lifeline =>
            lines.push(`${className(lifeline)} ${lifeline.title} as ${lifelineAliases[lifeline.id]} `)); // to lifeline

    const activationOffsets = Object.values(diagram.activations).reduce((acc, activation) => {
        acc[activation.id] = activation.start;
        return acc;
    }, {} as Record<ActivationId, number>);

    Object.values(diagram.messages)
        .sort((a, b) => activationOffsets[a.activation1] + a.sourceActivationOffset - activationOffsets[b.activation1] - b.sourceActivationOffset)
        .forEach(message => {
            lines.push(`${lifelineAliases[diagram.activations[message.activation1].lifelineId]} ${arrow(message)} ${lifelineAliases[diagram.activations[message.activation2].lifelineId]}`); // to activation
        })


    // noinspection SpellCheckingInspection
    lines.push(`@enduml`);
    return lines.join("\n");
}
