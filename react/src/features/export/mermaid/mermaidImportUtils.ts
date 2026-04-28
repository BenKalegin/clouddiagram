export type MermaidIdGenerator = () => string;

export function createMermaidIdGenerator(): MermaidIdGenerator {
    let idCounter = 0;
    return () => `mermaid_${++idCounter}`;
}

export function normalizeMermaidDeclaration(line: string): string {
    return line.trim().split(/\s+/)[0].replace(/:/g, "").toLowerCase();
}

export function mermaidSourceLines(content: string): string[] {
    const lines = content.split("\n");
    let inFrontmatter = false;
    let hasSeenContent = false;

    return lines
        .map(line => line.trim())
        .filter(line => {
            if (!line) return false;

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
