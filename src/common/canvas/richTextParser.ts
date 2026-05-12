export interface RichSegment {
    text: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
}

const TAG_RE = /<(\/?)(b|strong|i|em|u|br)(?:\s*\/)?\s*>/gi;
export const HAS_RICH_TAGS_RE = /<\/?(?:b|strong|i|em|u|br)(?:\s*\/)?\s*>/i;

export function parseRichText(input: string): RichSegment[][] {
    const lines: RichSegment[][] = [];
    let current: RichSegment[] = [];
    const stack = {b: 0, i: 0, u: 0};

    const emit = (text: string) => {
        if (!text) return;
        current.push({text, bold: stack.b > 0, italic: stack.i > 0, underline: stack.u > 0});
    };
    const flushLine = () => {
        lines.push(current);
        current = [];
    };
    const consumeText = (raw: string) => {
        const parts = raw.split("\n");
        for (let i = 0; i < parts.length; i++) {
            emit(parts[i]);
            if (i < parts.length - 1) flushLine();
        }
    };

    let lastIdx = 0;
    TAG_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = TAG_RE.exec(input)) !== null) {
        consumeText(input.slice(lastIdx, m.index));
        const closing = m[1] === "/";
        const tag = m[2].toLowerCase();
        if (tag === "br") {
            flushLine();
        } else {
            const key = (tag === "strong" ? "b" : tag === "em" ? "i" : tag) as "b" | "i" | "u";
            if (closing) {
                if (stack[key] > 0) stack[key]--;
            } else {
                stack[key]++;
            }
        }
        lastIdx = m.index + m[0].length;
    }
    consumeText(input.slice(lastIdx));
    flushLine();

    return lines;
}
