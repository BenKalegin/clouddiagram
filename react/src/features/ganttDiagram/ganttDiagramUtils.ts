import {Bounds} from "../../common/model";
import {ColorSchema, GanttTaskState, GanttTaskStatus, NodeState} from "../../package/packageModel";
import {defaultColorSchema} from "../../common/colors/colorSchemas";
import {GanttDiagramState} from "./ganttDiagramModel";

export const ganttLayout = {
    dayWidth: 18,
    rowHeight: 54,
    barHeight: 34,
    minBarWidth: 80,
    milestoneWidth: 28,
    leftOffset: 220,
    topOffset: 130,
};

export const defaultGanttDateFormat = "YYYY-MM-DD";
export const defaultGanttChartStart = "2026-01-01";

const millisecondsPerDay = 24 * 60 * 60 * 1000;

export function parseGanttDateString(date: string): Date | undefined {
    const match = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return undefined;
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function formatGanttDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function addGanttDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
}

export function ganttDayOffset(start: Date, end: Date): number {
    return Math.max(Math.round((end.getTime() - start.getTime()) / millisecondsPerDay), 0);
}

export function ganttDurationDays(start: Date, end: Date): number {
    return Math.max(ganttDayOffset(start, end), 1);
}

export function getGanttTaskDurationDays(task: GanttTaskState): number {
    const start = parseGanttDateString(task.start);
    const end = parseGanttDateString(task.end);
    return start && end ? ganttDurationDays(start, end) : 1;
}

export function getGanttChartStart(diagram: GanttDiagramState): Date {
    return parseGanttDateString(diagram.gantt?.chartStart ?? "") ?? firstTaskStart(diagram) ?? parseGanttDateString(defaultGanttChartStart)!;
}

export function ganttTaskToText(task: GanttTaskState): string {
    return `${task.label}\n${task.start} - ${task.end}`;
}

export function ganttColorSchema(status: GanttTaskStatus): ColorSchema {
    if (status === "crit") {
        return { strokeColor: "#B42318", fillColor: "#FEE4E2", textColor: "#7A271A" };
    }
    if (status === "done") {
        return { strokeColor: "#027A48", fillColor: "#D1FADF", textColor: "#054F31" };
    }
    if (status === "active") {
        return { strokeColor: "#175CD3", fillColor: "#D1E9FF", textColor: "#194185" };
    }
    if (status === "milestone") {
        return { strokeColor: "#6941C6", fillColor: "#E9D7FE", textColor: "#42307D" };
    }
    return defaultColorSchema;
}

export function normalizeGanttStatus(value: unknown): GanttTaskStatus {
    switch (value) {
        case "active":
        case "done":
        case "crit":
        case "milestone":
            return value;
        default:
            return "";
    }
}

export function createGanttTaskNode(base: Omit<NodeState, "text" | "colorSchema" | "ganttTask">, task: GanttTaskState): NodeState {
    return {
        ...base,
        text: ganttTaskToText(task),
        colorSchema: ganttColorSchema(task.status),
        ganttTask: task
    };
}

export function updateGanttNodeTask(node: NodeState, task: GanttTaskState): NodeState {
    return {
        ...node,
        text: ganttTaskToText(task),
        colorSchema: ganttColorSchema(task.status),
        ganttTask: task
    };
}

export function boundsForGanttTask(task: GanttTaskState, chartStart: Date, rowY: number): Bounds {
    const start = parseGanttDateString(task.start) ?? chartStart;
    const end = parseGanttDateString(task.end) ?? addGanttDays(start, 1);
    return {
        x: ganttLayout.leftOffset + ganttDayOffset(chartStart, start) * ganttLayout.dayWidth,
        y: rowY,
        width: Math.max(
            ganttDurationDays(start, end) * ganttLayout.dayWidth,
            task.status === "milestone" ? ganttLayout.milestoneWidth : ganttLayout.minBarWidth
        ),
        height: ganttLayout.barHeight
    };
}

export function ganttTaskFromMovedBounds(task: GanttTaskState, bounds: Bounds, chartStart: Date): GanttTaskState {
    const duration = getGanttTaskDurationDays(task);
    const start = addGanttDays(chartStart, ganttDayFromX(bounds.x));
    const end = addGanttDays(start, duration);
    return {
        ...task,
        start: formatGanttDate(start),
        end: formatGanttDate(end)
    };
}

export function ganttTaskFromResizedBounds(task: GanttTaskState, bounds: Bounds, chartStart: Date): GanttTaskState {
    const start = addGanttDays(chartStart, ganttDayFromX(bounds.x));
    const duration = Math.max(Math.round(bounds.width / ganttLayout.dayWidth), 1);
    const end = addGanttDays(start, duration);
    return {
        ...task,
        start: formatGanttDate(start),
        end: formatGanttDate(end)
    };
}

export function snappedBoundsForGanttTask(task: GanttTaskState, bounds: Bounds, chartStart: Date): Bounds {
    const start = parseGanttDateString(task.start) ?? chartStart;
    const end = parseGanttDateString(task.end) ?? addGanttDays(start, 1);
    return {
        ...bounds,
        x: ganttLayout.leftOffset + ganttDayOffset(chartStart, start) * ganttLayout.dayWidth,
        width: Math.max(
            ganttDurationDays(start, end) * ganttLayout.dayWidth,
            task.status === "milestone" ? ganttLayout.milestoneWidth : ganttLayout.minBarWidth
        )
    };
}

function ganttDayFromX(x: number): number {
    return Math.max(Math.round((x - ganttLayout.leftOffset) / ganttLayout.dayWidth), 0);
}

function firstTaskStart(diagram: GanttDiagramState): Date | undefined {
    const embeddedElements = (diagram as GanttDiagramState & { elements?: Record<string, NodeState> }).elements ?? {};
    return Object.keys(diagram.nodes)
        .map(id => embeddedElements[id]?.ganttTask?.start)
        .filter((date): date is string => !!date)
        .map(date => parseGanttDateString(date))
        .filter((date): date is Date => !!date)
        .sort((a, b) => a.getTime() - b.getTime())[0];
}
