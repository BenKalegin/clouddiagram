import {PieSliceState} from "../../package/packageModel";

export function getPieSlicesText(slices: PieSliceState[]): string {
    return slices.map(formatPieSlice).join("\n");
}

export function replacePieSlicesText(text: string): PieSliceState[] {
    return text
        .split("\n")
        .map(parsePieSliceLine);
}

export function parsePieSliceLine(line: string): PieSliceState {
    const trimmed = line.trim();
    if (!trimmed) {
        return {label: "", value: 0};
    }

    const quotedMatch = trimmed.match(/^"([^"]+)"\s*:\s*(.+)$/);
    const looseMatch = quotedMatch ? undefined : trimmed.match(/^(.+?)\s*:\s*(.+)$/);
    const label = quotedMatch?.[1] ?? looseMatch?.[1]?.trim() ?? trimmed;
    const rawValue = quotedMatch?.[2] ?? looseMatch?.[2] ?? "0";
    const value = Number(rawValue.trim());

    return {
        label,
        value: Number.isFinite(value) ? Math.max(value, 0) : 0
    };
}

export function formatPieSlice(slice: PieSliceState): string {
    if (!slice.label && slice.value === 0) {
        return "";
    }
    return `"${escapePieLabel(slice.label)}" : ${formatPieValue(slice.value)}`;
}

export function normalizedPieSlices(slices: PieSliceState[]): PieSliceState[] {
    return slices
        .map(slice => ({
            label: slice.label.trim(),
            value: Number.isFinite(slice.value) ? slice.value : 0
        }))
        .filter(slice => slice.label && slice.value > 0);
}

export function normalizePieTextPosition(value: unknown): number {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return 0.75;
    }
    return Math.min(Math.max(numericValue, 0), 1);
}

export function formatPieValue(value: number): string {
    if (!Number.isFinite(value)) {
        return "0";
    }
    return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function escapePieLabel(label: string): string {
    return label.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
}
