import React, {FC, useMemo} from "react";
import {Group, Text} from "react-konva";
import {HAS_RICH_TAGS_RE, parseRichText, RichSegment} from "./richTextParser";

export {parseRichText} from "./richTextParser";

export interface RichTextProps {
    text: string | undefined;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    fontSize: number;
    fontFamily?: string;
    fontStyle?: string;
    fill?: string;
    align?: "left" | "center" | "right";
    verticalAlign?: "top" | "middle" | "bottom" | "center";
    lineHeight?: number;
    listening?: boolean;
    visible?: boolean;
    padding?: number;
    draggable?: boolean;
    preventDefault?: boolean;
}

const measureCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
const measureCtx = measureCanvas ? measureCanvas.getContext("2d") : null;

function measureSegment(text: string, fontSize: number, fontFamily: string, bold: boolean, italic: boolean): number {
    if (!measureCtx) return text.length * fontSize * 0.6;
    const style = [italic ? "italic" : "", bold ? "bold" : ""].filter(Boolean).join(" ");
    measureCtx.font = `${style} ${fontSize}px ${fontFamily}`;
    return measureCtx.measureText(text).width;
}

interface PositionedSegment {
    text: string;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    x: number;
    width: number;
}

interface VisualLine {
    segments: PositionedSegment[];
    width: number;
}

function layoutLogicalLine(
    segments: RichSegment[],
    maxWidth: number | undefined,
    fontSize: number,
    fontFamily: string,
): VisualLine[] {
    type Tok = {seg: RichSegment; text: string; width: number; isSpace: boolean};
    const tokens: Tok[] = [];
    for (const seg of segments) {
        const parts = seg.text.split(/(\s+)/);
        for (const p of parts) {
            if (!p) continue;
            const isSpace = /^\s+$/.test(p);
            tokens.push({
                seg, text: p, isSpace,
                width: measureSegment(p, fontSize, fontFamily, seg.bold, seg.italic),
            });
        }
    }

    const tokenLines: Tok[][] = [];
    let lineTokens: Tok[] = [];
    let lineWidth = 0;
    for (const tok of tokens) {
        const fits = maxWidth == null || lineWidth + tok.width <= maxWidth || lineTokens.length === 0;
        if (!fits && !tok.isSpace) {
            while (lineTokens.length > 0 && lineTokens[lineTokens.length - 1].isSpace) {
                lineWidth -= lineTokens.pop()!.width;
            }
            tokenLines.push(lineTokens);
            lineTokens = [];
            lineWidth = 0;
        }
        if (tok.isSpace && lineTokens.length === 0) continue;
        lineTokens.push(tok);
        lineWidth += tok.width;
    }
    if (lineTokens.length > 0) tokenLines.push(lineTokens);
    if (tokenLines.length === 0) tokenLines.push([]);

    return tokenLines.map(line => {
        const positioned: PositionedSegment[] = [];
        let curr: PositionedSegment | null = null;
        let cursor = 0;
        for (const tok of line) {
            const same = curr
                && curr.bold === tok.seg.bold
                && curr.italic === tok.seg.italic
                && curr.underline === tok.seg.underline;
            if (same) {
                curr!.text += tok.text;
                curr!.width += tok.width;
            } else {
                curr = {
                    text: tok.text,
                    bold: tok.seg.bold,
                    italic: tok.seg.italic,
                    underline: tok.seg.underline,
                    x: cursor,
                    width: tok.width,
                };
                positioned.push(curr);
            }
            cursor += tok.width;
        }
        return {segments: positioned, width: cursor};
    });
}

export const RichText: FC<RichTextProps> = (props) => {
    const {
        text, x = 0, y = 0, width, height,
        fontSize, fontFamily = "Arial", fill,
        align = "left", verticalAlign = "top",
        lineHeight = 1, listening, visible, padding = 0,
        draggable, preventDefault,
    } = props;

    const hasTags = !!text && HAS_RICH_TAGS_RE.test(text);

    const layout = useMemo(() => {
        if (!hasTags || !text) return null;
        const logicalLines = parseRichText(text);
        const innerWidth = width != null ? width - padding * 2 : undefined;
        const visual: VisualLine[] = [];
        for (const line of logicalLines) {
            if (line.length === 0) {
                visual.push({segments: [], width: 0});
                continue;
            }
            visual.push(...layoutLogicalLine(line, innerWidth, fontSize, fontFamily));
        }
        return visual;
    }, [hasTags, text, width, padding, fontSize, fontFamily]);

    if (!hasTags || !layout) {
        return (
            <Text
                x={x} y={y} width={width} height={height}
                fontSize={fontSize} fontFamily={fontFamily} fill={fill}
                align={align} verticalAlign={verticalAlign}
                lineHeight={lineHeight} text={text}
                listening={listening} visible={visible} padding={padding}
                draggable={draggable} preventDefault={preventDefault}
            />
        );
    }

    const lineHeightPx = fontSize * lineHeight;
    const blockHeight = layout.length * lineHeightPx;
    const innerWidth = width != null ? width - padding * 2 : 0;

    let blockY = padding;
    if (height != null) {
        if (verticalAlign === "middle" || verticalAlign === "center") {
            blockY = padding + (height - padding * 2 - blockHeight) / 2;
        } else if (verticalAlign === "bottom") {
            blockY = height - padding - blockHeight;
        }
    }

    return (
        <Group x={x} y={y} listening={listening} visible={visible} draggable={draggable}>
            {layout.flatMap((line, lineIdx) => {
                let lineX = padding;
                if (width != null) {
                    if (align === "center") lineX = padding + (innerWidth - line.width) / 2;
                    else if (align === "right") lineX = padding + (innerWidth - line.width);
                }
                const lineY = blockY + lineIdx * lineHeightPx;
                return line.segments.map((seg, i) => {
                    const fontStyle = [seg.italic ? "italic" : "", seg.bold ? "bold" : ""]
                        .filter(Boolean).join(" ") || "normal";
                    return (
                        <Text
                            key={`${lineIdx}-${i}`}
                            x={lineX + seg.x}
                            y={lineY}
                            text={seg.text}
                            fontSize={fontSize}
                            fontFamily={fontFamily}
                            fontStyle={fontStyle}
                            textDecoration={seg.underline ? "underline" : ""}
                            fill={fill}
                            listening={false}
                            preventDefault={preventDefault}
                        />
                    );
                });
            })}
        </Group>
    );
};
