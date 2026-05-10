import {Diagram} from "../../../common/model";
import {
    CornerStyle,
    ElementType,
    GanttTaskState,
    GanttTaskStatus,
    LinkState,
    NodeState,
    PortAlignment,
    PortState,
    RouteStyle,
    TipStyle
} from "../../../package/packageModel";
import {defaultColorSchema} from "../../../common/colors/colorSchemas";
import {createMermaidIdGenerator, MermaidIdGenerator, mermaidSourceLines} from "./mermaidImportUtils";
import {
    addGanttDays,
    boundsForGanttTask,
    createGanttTaskNode,
    defaultGanttChartStart,
    defaultGanttDateFormat,
    formatGanttDate,
    ganttLayout,
    normalizeGanttStatus,
    parseGanttDateString
} from "../../ganttDiagram/ganttDiagramUtils";
import {GanttDiagramState} from "../../ganttDiagram/ganttDiagramModel";

interface ParsedGanttTask {
    id: string;
    label: string;
    section: string;
    start?: Date;
    end?: Date;
    durationDays?: number;
    dependencies: string[];
    status: GanttTaskStatus;
}

export function importMermaidGanttDiagram(baseDiagram: Diagram, content: string): Diagram {
    const generateId = createMermaidIdGenerator();
    const lines = mermaidSourceLines(content);
    const headerLine = lines.find(l => l.toLowerCase().startsWith("gantt"));
    if (!headerLine) {
        throw new Error("Not a valid Mermaid Gantt diagram");
    }

    let title = baseDiagram.title ?? "Gantt Diagram";
    let currentSection = "Tasks";
    const tasks: ParsedGanttTask[] = [];
    let dateFormat = defaultGanttDateFormat;

    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith("gantt")) continue;
        if (lowerLine.startsWith("title ")) {
            title = line.substring(6).trim();
            continue;
        }
        if (lowerLine.startsWith("dateformat ")) {
            dateFormat = line.substring(11).trim();
            continue;
        }
        if (lowerLine.startsWith("axisformat ") || lowerLine.startsWith("tickinterval ") || lowerLine.startsWith("excludes ")) {
            continue;
        }
        if (lowerLine.startsWith("section ")) {
            currentSection = line.substring(8).trim() || currentSection;
            continue;
        }

        const task = parseGanttTask(line, currentSection, dateFormat, generateId);
        if (task) {
            tasks.push(task);
        }
    }

    resolveGanttTaskDates(tasks);
    return buildGanttDiagram(baseDiagram, title, dateFormat, tasks, generateId);
}

function parseGanttTask(line: string, section: string, dateFormat: string, generateId: MermaidIdGenerator): ParsedGanttTask | undefined {
    const match = line.match(/^(.+?)\s*:\s*(.+)$/);
    if (!match) return undefined;

    const taskText = match[1].trim();
    const tokens = match[2].split(",").map(token => token.trim()).filter(Boolean);
    const dependencies: string[] = [];
    let status: GanttTaskStatus = "";
    let explicitId: string | undefined;
    let start: Date | undefined;
    let end: Date | undefined;
    let durationDays: number | undefined;

    for (const token of tokens) {
        const normalizedStatus = normalizeGanttStatus(token.toLowerCase());
        if (normalizedStatus) {
            status = higherPriorityGanttStatus(status, normalizedStatus);
            continue;
        }

        const afterMatch = token.match(/^after\s+(.+)$/i);
        if (afterMatch) {
            dependencies.push(...afterMatch[1].split(/\s+/).map(dependency => dependency.trim()).filter(Boolean));
            continue;
        }

        const parsedDuration = parseGanttDurationDays(token);
        if (parsedDuration !== undefined) {
            durationDays = parsedDuration;
            continue;
        }

        const parsedDate = parseGanttDate(token, dateFormat);
        if (parsedDate) {
            if (!start) {
                start = parsedDate;
            } else {
                end = parsedDate;
            }
            continue;
        }

        if (!explicitId) {
            explicitId = token;
        }
    }

    return {
        id: explicitId || taskText.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || generateId(),
        label: taskText,
        section,
        start,
        end,
        durationDays,
        dependencies,
        status
    };
}

function higherPriorityGanttStatus(current: GanttTaskStatus, next: GanttTaskStatus): GanttTaskStatus {
    const priority: Record<GanttTaskStatus, number> = {
        "": 0,
        active: 1,
        done: 2,
        crit: 3,
        milestone: 4
    };
    return priority[next] > priority[current] ? next : current;
}

function parseGanttDurationDays(token: string): number | undefined {
    const match = token.match(/^(\d+)\s*([dhw])$/i);
    if (!match) return undefined;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (unit === "w") return amount * 7;
    return Math.max(amount, 1);
}

function parseGanttDate(token: string, dateFormat: string): Date | undefined {
    const normalized = token.trim();
    const parsedIsoDate = parseGanttDateString(normalized);
    if (parsedIsoDate) {
        return parsedIsoDate;
    }

    if (dateFormat === defaultGanttDateFormat || dateFormat === "YYYY-MM-DD HH:mm") {
        const timestamp = Date.parse(normalized);
        return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
    }

    const timestamp = Date.parse(normalized);
    return Number.isNaN(timestamp) ? undefined : new Date(timestamp);
}

function resolveGanttTaskDates(tasks: ParsedGanttTask[]): void {
    const taskById = new Map(tasks.map(task => [task.id, task]));
    const fallbackStart = firstGanttStart(tasks) ?? parseGanttDateString(defaultGanttChartStart)!;
    const resolved = new Set<string>();
    const resolving = new Set<string>();

    const resolveTask = (task: ParsedGanttTask): Date => {
        if (resolved.has(task.id) && task.end) {
            return task.end;
        }

        if (resolving.has(task.id)) {
            task.start = task.start ?? fallbackStart;
            task.end = task.end ?? addGanttDays(task.start, task.durationDays ?? 1);
            return task.end;
        }

        resolving.add(task.id);
        const dependencyEnd = task.dependencies
            .map(dependencyId => taskById.get(dependencyId))
            .filter((dependency): dependency is ParsedGanttTask => dependency !== undefined)
            .map(dependency => resolveTask(dependency))
            .sort((a, b) => b.getTime() - a.getTime())[0];

        const dependencyStart = dependencyEnd ? addGanttDays(dependencyEnd, 1) : undefined;
        task.start = latestGanttDate(task.start, dependencyStart) ?? fallbackStart;
        task.end = task.end ?? addGanttDays(task.start, task.durationDays ?? 1);
        resolving.delete(task.id);
        resolved.add(task.id);
        return task.end;
    };

    tasks.forEach(resolveTask);
}

function latestGanttDate(...dates: Array<Date | undefined>): Date | undefined {
    return dates
        .filter((date): date is Date => date !== undefined)
        .sort((a, b) => b.getTime() - a.getTime())[0];
}

function firstGanttStart(tasks: ParsedGanttTask[]): Date | undefined {
    return tasks
        .map(task => task.start)
        .filter((date): date is Date => date !== undefined)
        .sort((a, b) => a.getTime() - b.getTime())[0];
}

function buildGanttDiagram(
    baseDiagram: Diagram,
    title: string,
    dateFormat: string,
    parsedTasks: ParsedGanttTask[],
    generateId: MermaidIdGenerator
): Diagram {
    const elements: { [id: string]: any } = {};
    const nodes: { [id: string]: any } = {};
    const ports: { [id: string]: any } = {};
    const links: { [id: string]: any } = {};
    const taskNodeIds = new Map<string, string>();
    const chartStart = firstGanttStart(parsedTasks) ?? parseGanttDateString(defaultGanttChartStart)!;
    let row = 0;
    let currentSection = "";

    parsedTasks.forEach(parsedTask => {
        if (parsedTask.section !== currentSection) {
            currentSection = parsedTask.section;
            row++;
        }

        const nodeId = generateId();
        const task = toGanttTaskState(parsedTask, chartStart);
        const y = ganttLayout.topOffset + row * ganttLayout.rowHeight;

        elements[nodeId] = createGanttTaskNode({
            id: nodeId,
            type: ElementType.ClassNode,
            ports: []
        }, task);
        nodes[nodeId] = {
            bounds: boundsForGanttTask(task, chartStart, y)
        };
        taskNodeIds.set(parsedTask.id, nodeId);
        row++;
    });

    parsedTasks.forEach(task => {
        const targetNodeId = taskNodeIds.get(task.id);
        if (!targetNodeId) return;

        task.dependencies.forEach(dependency => {
            const sourceNodeId = taskNodeIds.get(dependency);
            if (sourceNodeId) {
                createGanttLink(elements, ports, links, sourceNodeId, targetNodeId, dependency, task.id, generateId);
            }
        });
    });

    const sectionNotes: any = {};
    currentSection = "";
    row = 0;
    parsedTasks.forEach(task => {
        if (task.section !== currentSection) {
            currentSection = task.section;
            const noteId = generateId();
            sectionNotes[noteId] = {
                id: noteId,
                type: ElementType.Note,
                text: currentSection,
                bounds: {
                    x: 40,
                    y: ganttLayout.topOffset + (row + 1) * ganttLayout.rowHeight,
                    width: 150,
                    height: 34
                },
                colorSchema: defaultColorSchema
            };
            row++;
        }
        row++;
    });

    const metadataNoteId = generateId();
    const notes = {
        [metadataNoteId]: {
            id: metadataNoteId,
            type: ElementType.Note,
            text: `${title}\nDate format: ${dateFormat}`,
            bounds: { x: 40, y: 40, width: 420, height: 56 },
            colorSchema: defaultColorSchema
        },
        ...sectionNotes
    };

    return {
        ...baseDiagram,
        title,
        type: ElementType.GanttDiagram,
        gantt: {
            dateFormat,
            chartStart: formatGanttDate(chartStart)
        },
        elements,
        nodes,
        ports,
        links,
        notes,
        selectedElements: [],
        display: {
            ...baseDiagram.display,
            width: Math.max(2000, ganttLayout.leftOffset + 1200),
            height: Math.max(1000, ganttLayout.topOffset + (parsedTasks.length + Object.keys(sectionNotes).length + 3) * ganttLayout.rowHeight),
            offset: { x: 0, y: 0 }
        }
    } as GanttDiagramState & { elements: { [id: string]: any } };
}

function toGanttTaskState(task: ParsedGanttTask, chartStart: Date): GanttTaskState {
    const start = task.start ?? chartStart;
    const end = task.end ?? addGanttDays(start, task.durationDays ?? 1);
    return {
        taskId: task.id,
        label: task.label,
        section: task.section,
        start: formatGanttDate(start),
        end: formatGanttDate(end),
        status: task.status
    };
}

function createGanttLink(
    elements: { [id: string]: any },
    ports: { [id: string]: any },
    links: { [id: string]: any },
    sourceNodeId: string,
    targetNodeId: string,
    sourceTaskId: string,
    targetTaskId: string,
    generateId: MermaidIdGenerator
): void {
    const sourcePortId = generateId();
    const targetPortId = generateId();
    const linkId = generateId();

    elements[sourcePortId] = {
        id: sourcePortId,
        type: ElementType.ClassPort,
        nodeId: sourceNodeId,
        links: [linkId],
        depthRatio: 50,
        latitude: 10,
        longitude: 10
    } as PortState;

    elements[targetPortId] = {
        id: targetPortId,
        type: ElementType.ClassPort,
        nodeId: targetNodeId,
        links: [linkId],
        depthRatio: 50,
        latitude: 10,
        longitude: 10
    } as PortState;

    (elements[sourceNodeId] as NodeState).ports.push(sourcePortId);
    (elements[targetNodeId] as NodeState).ports.push(targetPortId);

    ports[sourcePortId] = { alignment: PortAlignment.Right, edgePosRatio: 50 };
    ports[targetPortId] = { alignment: PortAlignment.Left, edgePosRatio: 50 };

    elements[linkId] = {
        id: linkId,
        type: ElementType.ClassLink,
        port1: sourcePortId,
        port2: targetPortId,
        tipStyle1: TipStyle.None,
        tipStyle2: TipStyle.Arrow,
        routeStyle: RouteStyle.OrthogonalSquare,
        cornerStyle: CornerStyle.Straight,
        colorSchema: defaultColorSchema,
        ganttDependency: {
            sourceTaskId,
            targetTaskId
        }
    } as LinkState;

    links[linkId] = {};
}
