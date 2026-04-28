import {defaultDiagramDisplay, Diagram} from "../../common/model";
import {ElementType, Id} from "../../package/packageModel";
import type {StructureDiagramState} from "../structureDiagram/structureDiagramState";
import type {DeploymentDiagramState} from "../deploymentDiagram/deploymentDaigramModel";
import type {FlowchartDiagramState} from "../flowchartDiagram/flowchartDiagramModel";
import type {GanttDiagramState} from "../ganttDiagram/ganttDiagramModel";
import type {SequenceDiagramState} from "../sequenceDiagram/sequenceDiagramModel";
import {defaultGanttChartStart, defaultGanttDateFormat} from "../ganttDiagram/ganttDiagramUtils";

export interface DiagramTypeDefinition {
    type: ElementType;
    title: string;
    testId: string;
    createDiagram: (id: Id) => Diagram;
}

function createDiagramBase(id: Id, type: ElementType, title: string): Pick<Diagram, "id" | "type" | "title" | "selectedElements" | "notes" | "display"> {
    return {
        id,
        type,
        title,
        selectedElements: [],
        notes: {},
        display: {
            ...defaultDiagramDisplay,
            offset: { ...defaultDiagramDisplay.offset }
        }
    };
}

function createStructureDiagram(id: Id, type: ElementType, title: string): StructureDiagramState {
    return {
        ...createDiagramBase(id, type, title),
        nodes: {},
        ports: {},
        links: {},
    } as StructureDiagramState;
}

export const diagramTypeDefinitions: DiagramTypeDefinition[] = [
    {
        type: ElementType.ClassDiagram,
        title: "Class Diagram",
        testId: "add-class-diagram",
        createDiagram: (id) => createStructureDiagram(id, ElementType.ClassDiagram, "Class Diagram")
    },
    {
        type: ElementType.DeploymentDiagram,
        title: "Deployment Diagram",
        testId: "add-deployment-diagram",
        createDiagram: (id) => createStructureDiagram(id, ElementType.DeploymentDiagram, "Deployment Diagram") as DeploymentDiagramState
    },
    {
        type: ElementType.FlowchartDiagram,
        title: "Flowchart Diagram",
        testId: "add-flowchart-diagram",
        createDiagram: (id) => createStructureDiagram(id, ElementType.FlowchartDiagram, "Flowchart Diagram") as FlowchartDiagramState
    },
    {
        type: ElementType.GanttDiagram,
        title: "Gantt Diagram",
        testId: "add-gantt-diagram",
        createDiagram: (id) => ({
            ...createStructureDiagram(id, ElementType.GanttDiagram, "Gantt Diagram"),
            gantt: {
                dateFormat: defaultGanttDateFormat,
                chartStart: defaultGanttChartStart
            }
        } as GanttDiagramState)
    },
    {
        type: ElementType.SequenceDiagram,
        title: "Sequence Diagram",
        testId: "add-sequence-diagram",
        createDiagram: (id) => ({
            ...createDiagramBase(id, ElementType.SequenceDiagram, "Sequence Diagram"),
            lifelines: {},
            messages: {},
            activations: {},
        } as SequenceDiagramState)
    },
];

export function getDiagramTypeDefinition(type: ElementType): DiagramTypeDefinition {
    const definition = diagramTypeDefinitions.find(candidate => candidate.type === type);
    if (!definition) {
        throw new Error(`Unknown diagram kind: ${type}`);
    }
    return definition;
}

export function createDiagramForType(type: ElementType, id: Id): Diagram {
    return getDiagramTypeDefinition(type).createDiagram(id);
}
