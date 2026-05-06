import {Diagram} from "../../../common/model";
import {ElementType, NodeState, PictureLayout} from "../../../package/packageModel";
import {importMermaidStructureDiagram, StructureImportOut} from "./mermaidStructureImporter";
import {detectIcon, iconHints} from "../../graphics/iconHints";
import {PredefinedSvg} from "../../graphics/graphicsReader";

export function importMermaidDeploymentDiagram(baseDiagram: Diagram, content: string): Diagram {
    const out: StructureImportOut = {
        nodeMap: new Map(),
        subgraphLabels: new Map(),
        nodeParents: new Map(),
    };

    const result = importMermaidStructureDiagram(baseDiagram, content, {forceFlowchart: true, out}) as any;

    // Detect icons for subgraphs (parent context for children)
    const subgraphIcons = new Map<string, { icon: PredefinedSvg; inherit: boolean }>();
    for (const [sid, label] of out.subgraphLabels) {
        const icon = detectIcon(sid, label);
        if (icon !== undefined) {
            const hint = iconHints.find(h => h.icon === icon);
            subgraphIcons.set(sid, {icon, inherit: hint?.inheritChildren ?? false});
        }
    }

    // Assign icons to leaf nodes
    let anyIcons = false;
    for (const [mermaidId, nodeId] of out.nodeMap) {
        const node = result.elements[nodeId] as NodeState | undefined;
        if (!node || node.type !== ElementType.ClassNode) continue;

        const parentSid = out.nodeParents.get(nodeId);
        const parentInfo = parentSid ? subgraphIcons.get(parentSid) : undefined;

        const icon = detectIcon(mermaidId, node.text ?? "", parentInfo?.icon, parentInfo?.inherit);
        if (icon === undefined) continue;

        node.customShape = {pictureId: icon, layout: PictureLayout.FullIconTextBelow};
        node.flowchartKind = undefined;
        // Icon nodes need more height for the picture + label layout
        const placement = result.nodes[nodeId];
        if (placement?.bounds) placement.bounds.height = Math.max(placement.bounds.height, 100);
        anyIcons = true;
    }

    if (!anyIcons) return result;

    return {...result, type: ElementType.DeploymentDiagram};
}
