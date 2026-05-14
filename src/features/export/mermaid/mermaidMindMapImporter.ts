import {Diagram} from "../../../common/model";
import {
    CornerStyle,
    ElementType,
    FlowchartNodeKind,
    LinkState,
    NodeState,
    PortAlignment,
    PortState,
    RouteStyle,
    TipStyle,
} from "../../../package/packageModel";
import {defaultColorSchema} from "../../../common/colors/colorSchemas";
import {StructureDiagramState} from "../../structureDiagram/structureDiagramState";
import {createMermaidIdGenerator} from "./mermaidImportUtils";
import {applyAutoLayout, LayoutLink} from "@benkalegin/doodles-api";
import {computeDisplaySize} from "./mermaidStructureImporter";

const CODE_FENCE_RE = /^`{3,}(?:mermaid)?$/i;
const LAYOUT_ORIGIN_X = 80;

function rawBodyLines(content: string): string[] {
    const lines = content.split("\n");
    let inFrontmatter = false;
    let hasSeenContent = false;

    return lines.filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        if (CODE_FENCE_RE.test(trimmed)) return false;
        if (!hasSeenContent && trimmed === "---") {
            inFrontmatter = !inFrontmatter;
            hasSeenContent = true;
            return false;
        }
        if (inFrontmatter) {
            if (trimmed === "---") inFrontmatter = false;
            return false;
        }
        hasSeenContent = true;
        if (trimmed.startsWith("%%")) return false;
        if (trimmed.toLowerCase() === "mindmap") return false;
        return true;
    });
}

function indentDepth(line: string): number {
    let count = 0;
    for (const ch of line) {
        if (ch === " ") count++;
        else if (ch === "\t") count += 2;
        else break;
    }
    return count;
}

function extractText(raw: string): string {
    const text = raw.trim()
        .replace(/::icon\([^)]*\)/g, "")
        .replace(/:::\S+/g, "")
        .trim();

    const shapeRe = [
        /^(?:\w+)?\(\((.+)\)\)$/,
        /^(?:\w+)?\{\{(.+)\}\}$/,
        /^(?:\w+)?\)\)(.+)\(\($/,
        /^(?:\w+)?\[(.+)\]$/,
        /^(?:\w+)?\((.+)\)$/,
        /^(?:\w+)?\(!(.+)!\)$/,
        /^"(.+)"$/,
    ];

    for (const re of shapeRe) {
        const m = text.match(re);
        if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    }

    return text;
}

interface TreeNode {
    text: string;
    children: TreeNode[];
}

function parseTree(content: string): TreeNode | undefined {
    const stack: Array<{ depth: number; node: TreeNode }> = [];
    let root: TreeNode | undefined;

    for (const line of rawBodyLines(content)) {
        const depth = indentDepth(line);
        const text = extractText(line);
        if (!text) continue;

        const node: TreeNode = { text, children: [] };

        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
            stack.pop();
        }

        if (stack.length === 0) {
            // Mermaid mindmaps have a single root; ignore additional top-level lines.
            if (!root) root = node;
        } else {
            stack[stack.length - 1].node.children.push(node);
        }

        stack.push({ depth, node });
    }

    return root;
}

type Side = "root" | "right" | "left";

export async function importMermaidMindMapDiagram(baseDiagram: Diagram, content: string): Promise<Diagram> {
    const generateId = createMermaidIdGenerator();

    const elements: { [id: string]: any } = {};
    const nodes: { [id: string]: any } = {};
    const ports: { [id: string]: any } = {};
    const links: { [id: string]: any } = {};
    const rightSubtree = new Set<string>();
    const leftSubtree = new Set<string>();
    const rightEdges: LayoutLink[] = [];
    const leftEdges: LayoutLink[] = [];
    let nodeIndex = 0;

    function createNode(text: string): string {
        const nodeId = generateId();
        const width = Math.max(100, Math.min(220, text.length * 9 + 24));
        const height = 45;
        const col = nodeIndex % 5;
        const row = Math.floor(nodeIndex / 5);

        elements[nodeId] = {
            id: nodeId,
            type: ElementType.ClassNode,
            text,
            ports: [],
            colorSchema: defaultColorSchema,
            flowchartKind: FlowchartNodeKind.MindMapTopic,
        } as NodeState;

        nodes[nodeId] = {
            bounds: { x: 100 + col * 160, y: 100 + row * 80, width, height }
        };

        nodeIndex++;
        return nodeId;
    }

    function createPort(nodeId: string, alignment: PortAlignment): string {
        const portId = generateId();
        elements[portId] = {
            id: portId,
            type: ElementType.ClassPort,
            nodeId,
            links: [],
            depthRatio: 50,
            latitude: 10,
            longitude: 10,
        } as PortState;

        (elements[nodeId] as NodeState).ports.push(portId);
        ports[portId] = { alignment, edgePosRatio: 50 };
        return portId;
    }

    function connect(parentId: string, childId: string, side: Side): void {
        const linkId = generateId();
        const [srcAlign, tgtAlign] = side === "left"
            ? [PortAlignment.Left, PortAlignment.Right]
            : [PortAlignment.Right, PortAlignment.Left];
        const srcPortId = createPort(parentId, srcAlign);
        const tgtPortId = createPort(childId, tgtAlign);

        elements[linkId] = {
            id: linkId,
            type: ElementType.ClassLink,
            port1: srcPortId,
            port2: tgtPortId,
            tipStyle1: TipStyle.None,
            tipStyle2: TipStyle.None,
            routeStyle: RouteStyle.Bezier,
            cornerStyle: CornerStyle.Straight,
            colorSchema: defaultColorSchema,
        } as LinkState;

        (elements[srcPortId] as PortState).links.push(linkId);
        (elements[tgtPortId] as PortState).links.push(linkId);
        links[linkId] = {};

        const edges = side === "left" ? leftEdges : rightEdges;
        edges.push({ source: parentId, target: childId });
    }

    function emptyResult(): Diagram {
        return {
            ...baseDiagram,
            elements,
            nodes,
            ports,
            links,
            notes: {},
            selectedElements: [],
            display: {
                ...baseDiagram.display,
                width: 800,
                height: 600,
                offset: { x: 0, y: 0 },
            },
        } as StructureDiagramState;
    }

    const root = parseTree(content);
    if (!root) return emptyResult();

    // Split first-level children: first half on the right, second half on the left.
    const halfPoint = Math.ceil(root.children.length / 2);

    function buildTree(treeNode: TreeNode, parentId: string | null, side: Side): string {
        const nodeId = createNode(treeNode.text);
        if (side === "right") rightSubtree.add(nodeId);
        else if (side === "left") leftSubtree.add(nodeId);

        if (parentId !== null) {
            connect(parentId, nodeId, side);
        }

        if (side === "root") {
            treeNode.children.forEach((child, i) => {
                const childSide: Side = i < halfPoint ? "right" : "left";
                buildTree(child, nodeId, childSide);
            });
        } else {
            for (const child of treeNode.children) {
                buildTree(child, nodeId, side);
            }
        }

        return nodeId;
    }

    const rootId = buildTree(root, null, "root");

    await applyMindMapRadialLayout(nodes, rootId, rightSubtree, leftSubtree, rightEdges, leftEdges);

    const { width: displayWidth, height: displayHeight } = computeDisplaySize(nodes);

    return {
        ...baseDiagram,
        elements,
        nodes,
        ports,
        links,
        notes: {},
        selectedElements: [],
        display: {
            ...baseDiagram.display,
            width: displayWidth,
            height: displayHeight,
            offset: { x: 0, y: 0 },
        },
    } as StructureDiagramState;
}

async function applyMindMapRadialLayout(
    nodes: { [id: string]: any },
    rootId: string,
    rightSubtree: Set<string>,
    leftSubtree: Set<string>,
    rightEdges: LayoutLink[],
    leftEdges: LayoutLink[],
): Promise<void> {
    const cloneBounds = (ids: Iterable<string>) => {
        const out: { [id: string]: any } = {};
        for (const id of ids) out[id] = { bounds: { ...nodes[id].bounds } };
        return out;
    };

    const rightNodes = cloneBounds([rootId, ...rightSubtree]);
    const leftNodes = cloneBounds([rootId, ...leftSubtree]);

    if (rightSubtree.size > 0) {
        await applyAutoLayout(rightNodes, rightEdges, { direction: "LR" });
    }
    if (leftSubtree.size > 0) {
        await applyAutoLayout(leftNodes, leftEdges, { direction: "LR" });
    }

    // Anchor: right side's root position (or left's if no right side)
    const anchor = rightSubtree.size > 0 ? rightNodes[rootId] : leftNodes[rootId];
    nodes[rootId].bounds.x = anchor.bounds.x;
    nodes[rootId].bounds.y = anchor.bounds.y;

    for (const id of rightSubtree) {
        nodes[id].bounds.x = rightNodes[id].bounds.x;
        nodes[id].bounds.y = rightNodes[id].bounds.y;
    }

    if (leftSubtree.size > 0) {
        const rightRootCx = nodes[rootId].bounds.x + nodes[rootId].bounds.width / 2;
        const leftRootCx = leftNodes[rootId].bounds.x + leftNodes[rootId].bounds.width / 2;

        for (const id of leftSubtree) {
            const cx = leftNodes[id].bounds.x + leftNodes[id].bounds.width / 2;
            const offset = cx - leftRootCx;
            const mirroredCx = rightRootCx - offset;
            nodes[id].bounds.x = mirroredCx - leftNodes[id].bounds.width / 2;
            nodes[id].bounds.y = leftNodes[id].bounds.y;
        }
    }

    // Normalize: shift so leftmost node is at LAYOUT_ORIGIN_X.
    const allIds = [rootId, ...rightSubtree, ...leftSubtree];
    let minX = Infinity;
    for (const id of allIds) {
        if (nodes[id].bounds.x < minX) minX = nodes[id].bounds.x;
    }
    const shift = LAYOUT_ORIGIN_X - minX;
    if (shift !== 0) {
        for (const id of allIds) {
            nodes[id].bounds.x += shift;
        }
    }
}
