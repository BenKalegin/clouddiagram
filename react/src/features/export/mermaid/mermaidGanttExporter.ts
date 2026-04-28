import {Diagram} from "../../../common/model";
import {DiagramElement, GanttTaskState, Id, LinkState, NodeState, PortState} from "../../../package/packageModel";
import {ElementResolver} from "../CloudDiagramFormat";
import {GanttDiagramState} from "../../ganttDiagram/ganttDiagramModel";
import {defaultGanttDateFormat, getGanttTaskDurationDays} from "../../ganttDiagram/ganttDiagramUtils";

interface ExportableGanttTask {
    nodeId: Id;
    task: GanttTaskState;
    x: number;
    y: number;
}

export function exportGanttDiagramAsMermaid(diagram: Diagram, resolveElement?: ElementResolver): string {
    const ganttDiagram = diagram as GanttDiagramState;
    const tasks = collectGanttTasks(ganttDiagram, resolveElement);
    const taskIdMap = createTaskIdMap(tasks);
    const dependencies = collectGanttDependencies(ganttDiagram, resolveElement);
    const dateFormat = ganttDiagram.gantt?.dateFormat ?? defaultGanttDateFormat;
    const lines = [
        "gantt",
        `    title ${sanitizeMermaidText(ganttDiagram.title ?? "Gantt Diagram")}`,
        `    dateFormat ${dateFormat}`
    ];

    let currentSection: string | undefined;
    tasks.forEach(({task}) => {
        if (task.section !== currentSection) {
            currentSection = task.section;
            lines.push(`    section ${sanitizeMermaidText(currentSection || "Tasks")}`);
        }

        const exportedTaskId = taskIdMap.get(task.taskId) ?? sanitizeMermaidId(task.taskId);
        const dependencyIds = dependencies.get(task.taskId)
            ?.map(dependencyId => taskIdMap.get(dependencyId))
            .filter((dependencyId): dependencyId is string => !!dependencyId) ?? [];
        const statusPrefix = task.status ? `${task.status}, ` : "";

        if (dependencyIds.length > 0) {
            lines.push(`    ${sanitizeMermaidText(task.label)} :${statusPrefix}${exportedTaskId}, after ${dependencyIds.join(" ")}, ${getGanttTaskDurationDays(task)}d`);
        } else {
            lines.push(`    ${sanitizeMermaidText(task.label)} :${statusPrefix}${exportedTaskId}, ${task.start}, ${task.end}`);
        }
    });

    return `${lines.join("\n")}\n`;
}

function collectGanttTasks(diagram: GanttDiagramState, resolveElement?: ElementResolver): ExportableGanttTask[] {
    return Object.entries(diagram.nodes)
        .map(([nodeId, placement]) => {
            const node = resolveDiagramElement(diagram, nodeId, resolveElement) as NodeState | undefined;
            if (!node?.ganttTask) return undefined;
            return {
                nodeId,
                task: node.ganttTask,
                x: placement.bounds.x,
                y: placement.bounds.y
            };
        })
        .filter((task): task is ExportableGanttTask => task !== undefined)
        .sort((a, b) => a.y - b.y || a.x - b.x);
}

function collectGanttDependencies(diagram: GanttDiagramState, resolveElement?: ElementResolver): Map<string, string[]> {
    const dependencies = new Map<string, string[]>();

    Object.keys(diagram.links).forEach(linkId => {
        const link = resolveDiagramElement(diagram, linkId, resolveElement) as LinkState | undefined;
        const dependency = link?.ganttDependency ?? inferGanttDependency(diagram, link, resolveElement);
        if (!dependency) return;

        const existing = dependencies.get(dependency.targetTaskId) ?? [];
        dependencies.set(dependency.targetTaskId, [...existing, dependency.sourceTaskId]);
    });

    return dependencies;
}

function inferGanttDependency(
    diagram: GanttDiagramState,
    link: LinkState | undefined,
    resolveElement?: ElementResolver
): { sourceTaskId: string; targetTaskId: string } | undefined {
    if (!link) return undefined;

    const sourcePort = resolveDiagramElement(diagram, link.port1, resolveElement) as PortState | undefined;
    const targetPort = resolveDiagramElement(diagram, link.port2, resolveElement) as PortState | undefined;
    if (!sourcePort || !targetPort) return undefined;

    const sourceNode = resolveDiagramElement(diagram, sourcePort.nodeId, resolveElement) as NodeState | undefined;
    const targetNode = resolveDiagramElement(diagram, targetPort.nodeId, resolveElement) as NodeState | undefined;
    if (!sourceNode?.ganttTask || !targetNode?.ganttTask) return undefined;

    return {
        sourceTaskId: sourceNode.ganttTask.taskId,
        targetTaskId: targetNode.ganttTask.taskId
    };
}

function createTaskIdMap(tasks: ExportableGanttTask[]): Map<string, string> {
    const usedIds = new Set<string>();
    return new Map(tasks.map(({task, nodeId}) => {
        const baseId = sanitizeMermaidId(task.taskId) || sanitizeMermaidId(task.label) || sanitizeMermaidId(nodeId) || "task";
        let nextId = baseId;
        let suffix = 2;
        while (usedIds.has(nextId)) {
            nextId = `${baseId}-${suffix}`;
            suffix++;
        }
        usedIds.add(nextId);
        return [task.taskId, nextId];
    }));
}

function resolveDiagramElement(diagram: Diagram, id: Id, resolveElement?: ElementResolver): DiagramElement | undefined {
    const embeddedElements = (diagram as Diagram & { elements?: Record<Id, DiagramElement> }).elements ?? {};
    return embeddedElements[id] ?? resolveElement?.(id);
}

function sanitizeMermaidText(value: string): string {
    return value.replace(/[\r\n]+/g, " ").replace(/[:,]/g, " ").trim() || "Task";
}

function sanitizeMermaidId(value: string): string {
    return value.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_-]/g, "").replace(/^-|-$/g, "");
}
