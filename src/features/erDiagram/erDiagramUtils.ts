import {Bounds} from "../../common/model";
import {ErAttributeState, ErCardinality, ErEntityState, NodeState} from "../../package/packageModel";

export const erCardinalityOptions: ErCardinality[] = ["||", "|o", "}o", "}|"];

export function createErEntity(entityId: string, alias?: string, attributes: ErAttributeState[] = []): ErEntityState {
    return {
        entityId,
        alias: normalizeErAlias(alias),
        attributes
    };
}

export function getErEntityDisplayName(entity: ErEntityState): string {
    return entity.alias || entity.entityId;
}

export function getErAttributesText(node: NodeState): string {
    return (node.erEntity?.attributes ?? [])
        .map(formatErAttribute)
        .join("\n");
}

export function replaceErAttributesText(text: string): ErAttributeState[] {
    return text
        .split("\n")
        .map(parseErAttributeLine);
}

export function parseErAttributeLine(line: string): ErAttributeState {
    const trimmed = line.trim();
    if (!trimmed) {
        return {type: "", name: ""};
    }

    const commentMatch = trimmed.match(/^(.*?)\s+"([^"]*)"\s*$/);
    const withoutComment = (commentMatch ? commentMatch[1] : trimmed).trim();
    const comment = commentMatch?.[2];
    const tokens = withoutComment.split(/\s+/);
    const type = tokens.shift() ?? "";
    const name = tokens.shift() ?? "";
    const keys = tokens.join(" ").trim();

    return {
        type,
        name,
        keys: keys || undefined,
        comment
    };
}

export function formatErAttribute(attribute: ErAttributeState): string {
    const base = [attribute.type, attribute.name, attribute.keys]
        .filter(value => value !== undefined && value !== "")
        .join(" ");
    return attribute.comment ? `${base} "${attribute.comment}"` : base;
}

export function normalizeErAlias(alias: string | undefined): string | undefined {
    const trimmed = (alias ?? "").trim();
    return trimmed || undefined;
}

export function normalizeErCardinality(value: unknown): ErCardinality {
    return erCardinalityOptions.includes(value as ErCardinality) ? value as ErCardinality : "||";
}

export function minimumErNodeHeight(node: NodeState): number {
    const attributes = (node.erEntity?.attributes ?? []).filter(attribute => attribute.type || attribute.name);
    return Math.max(70, 38 + Math.max(attributes.length, 1) * 20 + 12);
}

export function erBoundsForAttributeCount(bounds: Bounds, node: NodeState): Bounds {
    return {
        ...bounds,
        height: Math.max(bounds.height, minimumErNodeHeight(node))
    };
}
