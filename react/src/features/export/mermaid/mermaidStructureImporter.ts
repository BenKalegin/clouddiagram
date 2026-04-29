import {Diagram} from "../../../common/model";
import {
    CornerStyle,
    ElementType,
    FlowchartNodeKind,
    LinkState,
    NodeState,
    PortState,
    RouteStyle,
    TipStyle
} from "../../../package/packageModel";
import {defaultColorSchema} from "../../../common/colors/colorSchemas";
import {StructureDiagramState} from "../../structureDiagram/structureDiagramState";
import {createMermaidIdGenerator, mermaidSourceLines} from "./mermaidImportUtils";
import {createClassMember, minimumClassNodeHeight, normalizeClassAnnotation} from "../../classDiagram/classDiagramUtils";

interface ImportStructureOptions {
    forceFlowchart?: boolean;
}

function toFlowchartKind(shape: "process" | "decision" | "terminator" | "input-output" | undefined): FlowchartNodeKind | undefined {
    switch (shape) {
        case "decision":
            return FlowchartNodeKind.Decision;
        case "terminator":
            return FlowchartNodeKind.Terminator;
        case "input-output":
            return FlowchartNodeKind.InputOutput;
        case "process":
            return FlowchartNodeKind.Process;
        default:
            return undefined;
    }
}

/**
 * Import a Mermaid class/flowchart diagram into CloudDiagram structure format
 */
export function importMermaidFlowchartDiagram(baseDiagram: Diagram, content: string): Diagram {
    return importMermaidStructureDiagram(baseDiagram, content, { forceFlowchart: true });
}

export function importMermaidStructureDiagram(baseDiagram: Diagram, content: string, options?: ImportStructureOptions): Diagram {
    const generateId = createMermaidIdGenerator();
    const lines = mermaidSourceLines(content);

    const headerLine = lines.find(l =>
        l.toLowerCase().startsWith('classdiagram') ||
        l.toLowerCase().startsWith('c4context') ||
        l.toLowerCase().startsWith('c4container') ||
        l.toLowerCase().startsWith('c4component') ||
        l.toLowerCase().startsWith('c4dynamic') ||
        l.toLowerCase().startsWith('c4deployment') ||
        l.toLowerCase().startsWith('flowchart') ||
        l.toLowerCase().startsWith('graph')
    );

    if (!headerLine && !options?.forceFlowchart) {
        throw new Error('Not a valid Mermaid class diagram or flowchart');
    }

    const lowerHeaderLine = (headerLine ?? "flowchart").toLowerCase();
    const flowchartMode =
        options?.forceFlowchart === true ||
        baseDiagram.type === ElementType.FlowchartDiagram ||
        lowerHeaderLine.startsWith("flowchart") ||
        lowerHeaderLine.startsWith("graph");

    const elements: { [id: string]: any } = {};
    const nodes: { [id: string]: any } = {};
    const ports: { [id: string]: any } = {};
    const links: { [id: string]: any } = {};
    const nodeMap: { [name: string]: string } = {};
    let nodeIndex = 0;
    let currentClassBlock: string | undefined;

    function getOrCreateNode(
        name: string,
        label?: string,
        flowchartKind?: FlowchartNodeKind
    ): string {
        const normalizedName = name.trim();
        if (nodeMap[normalizedName]) {
            const nodeId = nodeMap[normalizedName];
            if (label) {
                (elements[nodeId] as NodeState).text = label.trim();
            }
            if (flowchartKind && flowchartMode) {
                (elements[nodeId] as NodeState).flowchartKind = flowchartKind;
            }
            return nodeId;
        }

        const nodeId = generateId();
        const nodeWidth = 140;
        const nodeHeight = 60;
        const nodesPerRow = 5;
        const spacingX = 60;
        const spacingY = 80;
        const row = Math.floor(nodeIndex / nodesPerRow);
        const col = nodeIndex % nodesPerRow;

        elements[nodeId] = {
            id: nodeId,
            type: ElementType.ClassNode,
            text: (label || normalizedName).trim(),
            ports: [],
            colorSchema: defaultColorSchema,
            flowchartKind: flowchartMode ? (flowchartKind ?? FlowchartNodeKind.Process) : undefined
        } as NodeState;

        nodes[nodeId] = {
            bounds: {
                x: 100 + col * (nodeWidth + spacingX),
                y: 100 + row * (nodeHeight + spacingY),
                width: nodeWidth,
                height: nodeHeight
            }
        };

        nodeMap[normalizedName] = nodeId;
        nodeIndex++;
        return nodeId;
    }

    function addClassMember(className: string, memberText: string): void {
        const normalizedMember = memberText.trim();
        if (!normalizedMember) return;

        const annotationMatch = normalizedMember.match(/^<<(.+)>>$/);
        if (annotationMatch) {
            setClassAnnotation(className, annotationMatch[1]);
            return;
        }

        const member = createClassMember(normalizedMember);
        if (!member) return;

        const nodeId = getOrCreateNode(className);
        const node = elements[nodeId] as NodeState;
        node.classMembers = [...(node.classMembers ?? []), member];
        nodes[nodeId].bounds.height = Math.max(nodes[nodeId].bounds.height, minimumClassNodeHeight(node));
    }

    function setClassAnnotation(className: string, annotation: string): void {
        const nodeId = getOrCreateNode(className);
        const node = elements[nodeId] as NodeState;
        node.classAnnotation = normalizeClassAnnotation(annotation);
        nodes[nodeId].bounds.height = Math.max(nodes[nodeId].bounds.height, minimumClassNodeHeight(node));
    }

    function createPort(nodeId: string, alignment: number): string {
        const portId = generateId();
        elements[portId] = {
            id: portId,
            type: ElementType.ClassPort,
            nodeId,
            links: [],
            depthRatio: 50,
            latitude: 10,
            longitude: 10
        } as PortState;

        const node = elements[nodeId] as NodeState;
        node.ports.push(portId);

        ports[portId] = {
            alignment,
            edgePosRatio: 50
        };
        return portId;
    }

    function createLink(sourceNodeId: string, targetNodeId: string, arrowType?: string, edgeLabel?: string): void {
        let fromId = sourceNodeId;
        let toId = targetNodeId;
        const normalizedArrow = arrowType ?? "-->";

        if (flowchartMode && normalizedArrow.includes("<") && !normalizedArrow.includes(">")) {
            fromId = targetNodeId;
            toId = sourceNodeId;
        }

        const linkId = generateId();
        const sourcePortId = createPort(fromId, 1);
        const targetPortId = createPort(toId, 0);

        let tipStyle2 = TipStyle.Arrow;
        if (!flowchartMode) {
            if (normalizedArrow === '<|--') tipStyle2 = TipStyle.Triangle;
            if (normalizedArrow === '--*') tipStyle2 = TipStyle.Diamond;
            if (normalizedArrow === '--o') tipStyle2 = TipStyle.Circle;
        }

        elements[linkId] = {
            id: linkId,
            type: ElementType.ClassLink,
            port1: sourcePortId,
            port2: targetPortId,
            tipStyle1: TipStyle.None,
            tipStyle2,
            routeStyle: flowchartMode ? RouteStyle.OrthogonalSquare : RouteStyle.Direct,
            cornerStyle: CornerStyle.Straight,
            colorSchema: defaultColorSchema,
            text: edgeLabel?.trim() || undefined
        } as LinkState;

        (elements[sourcePortId] as PortState).links.push(linkId);
        (elements[targetPortId] as PortState).links.push(linkId);

        links[linkId] = {};
    }

    for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.startsWith('classdiagram') ||
            lowerLine.startsWith('c4context') ||
            lowerLine.startsWith('c4container') ||
            lowerLine.startsWith('c4component') ||
            lowerLine.startsWith('c4dynamic') ||
            lowerLine.startsWith('c4deployment') ||
            lowerLine.startsWith('flowchart') ||
            lowerLine.startsWith('graph')) continue;

        if (currentClassBlock) {
            if (/^}\s*;?$/.test(line)) {
                currentClassBlock = undefined;
            } else {
                addClassMember(currentClassBlock, line);
            }
            continue;
        }

        const inlineClassBlockMatch = line.match(/^class\s+([\w-]+)(?:~[^~]+~)?\s*\{\s*(.+?)\s*}\s*;?$/);
        if (inlineClassBlockMatch) {
            const [, className, members] = inlineClassBlockMatch;
            getOrCreateNode(className);
            members
                .split(/;|,/)
                .map(member => member.trim())
                .filter(Boolean)
                .forEach(member => addClassMember(className, member));
            continue;
        }

        const classBlockMatch = line.match(/^class\s+([\w-]+)(?:~[^~]+~)?(?:\s*<<(.+)>>)?\s*\{\s*$/);
        if (classBlockMatch) {
            const [, className, annotation] = classBlockMatch;
            getOrCreateNode(className);
            if (annotation) {
                setClassAnnotation(className, annotation);
            }
            currentClassBlock = className;
            continue;
        }

        const classMemberMatch = line.match(/^([\w-]+)\s*:\s*(.+)$/);
        if (!flowchartMode && classMemberMatch) {
            const [, className, memberText] = classMemberMatch;
            addClassMember(className, memberText);
            continue;
        }

        const classAnnotationMatch = line.match(/^<<(.+)>>\s+([\w-]+)$/);
        if (!flowchartMode && classAnnotationMatch) {
            const [, annotation, className] = classAnnotationMatch;
            setClassAnnotation(className, annotation);
            continue;
        }

        const c4NodeMatch = line.match(/^(Person|System|Container|Component)\s*\(\s*([\w-]+)\s*,\s*"?([^",)]+)"?(?:\s*,.*)?\)\s*$/i);
        if (c4NodeMatch) {
            const [, c4Type, id, label] = c4NodeMatch;
            const kindByType: Record<string, FlowchartNodeKind> = {
                person: FlowchartNodeKind.C4Person,
                system: FlowchartNodeKind.C4System,
                container: FlowchartNodeKind.C4Container,
                component: FlowchartNodeKind.C4Component
            };
            getOrCreateNode(id, label, kindByType[c4Type.toLowerCase()]);
            continue;
        }

        const c4RelMatch = line.match(/^Rel(?:_[UDLR])?\s*\(\s*([\w-]+)\s*,\s*([\w-]+)\s*,\s*"?([^",)]+)"?(?:\s*,.*)?\)\s*$/i);
        if (c4RelMatch) {
            const [, from, to, relLabel] = c4RelMatch;
            const fromNodeId = getOrCreateNode(from);
            const toNodeId = getOrCreateNode(to);
            createLink(fromNodeId, toNodeId, "-->", relLabel);
            continue;
        }

        const nodeMatch = line.match(/^([\w-]+)\s*(?:\[\/([^\]]+)\/\]|\[([^\]]+)\]|\(\[([^\]]+)\]\)|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\})$/);
        if (nodeMatch) {
            const [, id, ioLabel, squareLabel, stadiumLabel, circleLabel, roundLabel, decisionLabel] = nodeMatch;
            const label = ioLabel || squareLabel || stadiumLabel || circleLabel || roundLabel || decisionLabel;
            const shape = decisionLabel ? "decision"
                : ioLabel ? "input-output"
                    : (stadiumLabel || circleLabel || roundLabel) ? "terminator"
                        : "process";
            getOrCreateNode(id, label, toFlowchartKind(shape));
            continue;
        }

        const flowMatch = line.match(/^([\w-]+)\s*(?:\[\/([^\]]+)\/\]|\[([^\]]+)\]|\(\[([^\]]+)\]\)|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\})?\s*(<\|--|<-->|<--|-->|---|-\.-|==>|--|--\.\.|--o|--\*|<->)\s*(?:\|([^|]+)\|\s*)?([\w-]+)\s*(?:\[\/([^\]]+)\/\]|\[([^\]]+)\]|\(\[([^\]]+)\]\)|\(\(([^)]+)\)\)|\(([^)]+)\)|\{([^}]+)\})?(?:\s*\|([^|]+)\|)?$/);
        if (flowMatch) {
            const [, from, fio, fsquare, fstadium, fcircle, fround, fdecision, arrow, edgeLabelBefore, to, tio, tsquare, tstadium, tcircle, tround, tdecision, edgeLabelAfter] = flowMatch;
            const edgeLabel = edgeLabelBefore || edgeLabelAfter;
            const fromLabel = fio || fsquare || fstadium || fcircle || fround || fdecision;
            const toLabel = tio || tsquare || tstadium || tcircle || tround || tdecision;
            const fromShape = fromLabel
                ? (fdecision ? "decision"
                    : fio ? "input-output"
                        : (fstadium || fcircle || fround) ? "terminator"
                            : "process")
                : undefined;
            const toShape = toLabel
                ? (tdecision ? "decision"
                    : tio ? "input-output"
                        : (tstadium || tcircle || tround) ? "terminator"
                            : "process")
                : undefined;
            const fromNodeId = getOrCreateNode(from, fromLabel, toFlowchartKind(fromShape));
            const toNodeId = getOrCreateNode(to, toLabel, toFlowchartKind(toShape));
            createLink(fromNodeId, toNodeId, arrow, edgeLabel);
            continue;
        }

        const classRelMatch = line.match(/^([\w-]+)\s*(<\|--|--|\.\.>|-->|--\*|--o|<--|<->)\s*([\w-]+)(?:\s*:\s*(.*))?$/);
        if (classRelMatch) {
            const [, from, arrow, to, relLabel] = classRelMatch;
            const fromNodeId = getOrCreateNode(from);
            const toNodeId = getOrCreateNode(to);
            createLink(fromNodeId, toNodeId, arrow, relLabel);
            continue;
        }

        const classMatch = line.match(/^class\s+([\w-]+)(?:\s*\[\s*["`]?(.+?)["`]?\s*\])?(?:\s*<<(.+)>>)?/);
        if (classMatch) {
            const [, className, label, annotation] = classMatch;
            getOrCreateNode(className, label);
            if (annotation) {
                setClassAnnotation(className, annotation);
            }
            continue;
        }
    }

    const result: any = {
        ...baseDiagram,
        elements,
        nodes,
        ports,
        links,
        notes: {},
        selectedElements: [],
        display: {
            ...baseDiagram.display,
            width: 2000,
            height: 2000,
            offset: { x: 0, y: 0 }
        }
    };

    return result as StructureDiagramState;
}
