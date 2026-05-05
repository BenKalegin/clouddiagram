import {LayoutDirection, LayoutHints} from "../../layout/autoLayout";

export type MermaidIdGenerator = () => string;

export function createMermaidIdGenerator(): MermaidIdGenerator {
    let idCounter = 0;
    return () => `mermaid_${++idCounter}`;
}

export function normalizeMermaidDeclaration(line: string): string {
    return line.trim().split(/\s+/)[0].replace(/:/g, "").toLowerCase();
}

const CODE_FENCE_RE = /^`{3,}(?:mermaid)?$/i;

export function mermaidSourceLines(content: string): string[] {
    const lines = content.split("\n");
    let inFrontmatter = false;
    let hasSeenContent = false;

    return lines
        .map(line => line.trim())
        .filter(line => {
            if (!line) return false;

            // Drop ```mermaid / ``` fences without treating them as content,
            // so a frontmatter --- still gets detected when fences are present.
            if (CODE_FENCE_RE.test(line)) return false;

            if (!hasSeenContent && line === "---") {
                inFrontmatter = !inFrontmatter;
                hasSeenContent = true;
                return false;
            }

            if (inFrontmatter) {
                if (line === "---") {
                    inFrontmatter = false;
                }
                return false;
            }

            hasSeenContent = true;
            return !line.startsWith("%%");
        });
}

const DIRECTION_TOKEN_TO_LAYOUT: Record<string, LayoutDirection> = {
    td: "TB",
    tb: "TB",
    bt: "BT",
    lr: "LR",
    rl: "RL"
};

const FLOWCHART_HEADER_RE = /^(?:flowchart|graph)\s+([A-Za-z]{2})\b/i;
const CLASS_DIRECTION_RE = /^direction\s+(TB|BT|LR|RL)\b/i;
const RANK_SPACING_LINE_RE = /^ranksep\s*:\s*(\d+)/i;
const RANK_SPACING_FLOW_RE = /^rankspacing\s*:\s*(\d+)/i;
const NODE_SPACING_LINE_RE = /^nodesep\s*:\s*(\d+)/i;
const NODE_SPACING_FLOW_RE = /^nodespacing\s*:\s*(\d+)/i;

/**
 * Extract layout hints from a Mermaid source. Reads:
 *  - direction from the `flowchart`/`graph` header line (e.g. `flowchart TD`)
 *  - rankSep / nodeSep from frontmatter `config.flowchart.rankSpacing|nodeSpacing`
 *    or top-level `ranksep|nodesep`
 */
export function parseMermaidLayoutHints(content: string): LayoutHints {
    const hints: LayoutHints = {};
    const direction = readHeaderDirection(content);
    if (direction) hints.direction = direction;

    const frontmatter = readFrontmatterLines(content);
    for (const line of frontmatter) {
        const rankFlow = line.match(RANK_SPACING_FLOW_RE);
        if (rankFlow) hints.rankSep = Number(rankFlow[1]);
        const rankTop = line.match(RANK_SPACING_LINE_RE);
        if (rankTop && hints.rankSep === undefined) hints.rankSep = Number(rankTop[1]);
        const nodeFlow = line.match(NODE_SPACING_FLOW_RE);
        if (nodeFlow) hints.nodeSep = Number(nodeFlow[1]);
        const nodeTop = line.match(NODE_SPACING_LINE_RE);
        if (nodeTop && hints.nodeSep === undefined) hints.nodeSep = Number(nodeTop[1]);
    }

    return hints;
}

function readHeaderDirection(content: string): LayoutDirection | undefined {
    for (const line of mermaidSourceLines(content)) {
        const flowMatch = line.match(FLOWCHART_HEADER_RE);
        if (flowMatch) return DIRECTION_TOKEN_TO_LAYOUT[flowMatch[1].toLowerCase()];
        const classMatch = line.match(CLASS_DIRECTION_RE);
        if (classMatch) return DIRECTION_TOKEN_TO_LAYOUT[classMatch[1].toLowerCase()];
    }
    return undefined;
}

function readFrontmatterLines(content: string): string[] {
    const lines = content.split("\n").map(line => line.trim());
    if (lines[0] !== "---") return [];
    const closeIndex = lines.indexOf("---", 1);
    if (closeIndex === -1) return [];
    return lines.slice(1, closeIndex);
}
