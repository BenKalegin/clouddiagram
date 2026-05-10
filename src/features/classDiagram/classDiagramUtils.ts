import {ClassMemberKind, ClassMemberState, NodeState} from "../../package/packageModel";

export function createClassMember(text: string, forcedKind?: ClassMemberKind): ClassMemberState | undefined {
    const trimmed = text.trim();
    if (!trimmed) return undefined;

    return {
        kind: forcedKind ?? inferClassMemberKind(trimmed),
        text: trimmed
    };
}

export function inferClassMemberKind(text: string): ClassMemberKind {
    return /\([^)]*\)/.test(text) ? "method" : "field";
}

export function getClassFieldsText(node: NodeState): string {
    return getClassMembersText(node, "field");
}

export function getClassMethodsText(node: NodeState): string {
    return getClassMembersText(node, "method");
}

export function getClassMembersText(node: NodeState, kind: ClassMemberKind): string {
    return (node.classMembers ?? [])
        .filter(member => member.kind === kind)
        .map(member => member.text)
        .join("\n");
}

export function replaceClassMembersText(
    existingMembers: ClassMemberState[] | undefined,
    kind: ClassMemberKind,
    text: string
): ClassMemberState[] {
    const existing = existingMembers ?? [];
    const replacement = text
        .split("\n")
        .map(line => ({
            kind,
            text: line.trim()
        }));

    const fields = kind === "field"
        ? replacement
        : existing.filter(member => member.kind === "field");
    const methods = kind === "method"
        ? replacement
        : existing.filter(member => member.kind === "method");

    return [...fields, ...methods];
}

export function normalizeClassAnnotation(value: string): string | undefined {
    const trimmed = value.trim().replace(/^<<\s*/, "").replace(/\s*>>$/, "").trim();
    return trimmed || undefined;
}

export function minimumClassNodeHeight(node: NodeState): number {
    const fields = (node.classMembers ?? []).filter(member => member.kind === "field");
    const methods = (node.classMembers ?? []).filter(member => member.kind === "method");
    const titleLines = node.classAnnotation ? 2 : 1;
    const titleHeight = titleLines * 18 + 12;
    const fieldsHeight = fields.length > 0 ? fields.length * 18 + 12 : 0;
    const methodsHeight = methods.length > 0 ? methods.length * 18 + 12 : 0;

    return Math.max(60, titleHeight + fieldsHeight + methodsHeight);
}
