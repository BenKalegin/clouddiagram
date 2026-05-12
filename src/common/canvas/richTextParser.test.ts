import {describe, expect, it} from "vitest";
import {parseRichText} from "./richTextParser";

describe("parseRichText", () => {
    it("returns a single segment for plain text", () => {
        const lines = parseRichText("hello");
        expect(lines).toEqual([[{text: "hello", bold: false, italic: false, underline: false}]]);
    });

    it("splits on explicit newlines", () => {
        const lines = parseRichText("a\nb");
        expect(lines).toHaveLength(2);
        expect(lines[0][0].text).toBe("a");
        expect(lines[1][0].text).toBe("b");
    });

    it("emits a bold segment for <b>...</b>", () => {
        const lines = parseRichText("<b>Long tail</b>~3,000+ transactions");
        expect(lines).toHaveLength(1);
        expect(lines[0]).toEqual([
            {text: "Long tail", bold: true, italic: false, underline: false},
            {text: "~3,000+ transactions", bold: false, italic: false, underline: false},
        ]);
    });

    it("treats <strong> as bold and <em> as italic", () => {
        const lines = parseRichText("<strong>x</strong><em>y</em>");
        expect(lines[0]).toEqual([
            {text: "x", bold: true, italic: false, underline: false},
            {text: "y", bold: false, italic: true, underline: false},
        ]);
    });

    it("handles nested tags", () => {
        const lines = parseRichText("<b><i>both</i></b>");
        expect(lines[0]).toEqual([
            {text: "both", bold: true, italic: true, underline: false},
        ]);
    });

    it("treats <br> and <br/> as line breaks", () => {
        const lines = parseRichText("a<br>b<br/>c");
        expect(lines.map(l => l[0]?.text)).toEqual(["a", "b", "c"]);
    });

    it("preserves underline via <u>", () => {
        const lines = parseRichText("<u>note</u>");
        expect(lines[0][0]).toEqual({text: "note", bold: false, italic: false, underline: true});
    });

    it("is case-insensitive on tag names", () => {
        const lines = parseRichText("<B>up</B>");
        expect(lines[0][0].bold).toBe(true);
    });

    it("leaves unknown tags as literal text", () => {
        const lines = parseRichText("<span>x</span>");
        expect(lines[0][0].text).toBe("<span>x</span>");
    });

    it("ignores unbalanced closing tags without crashing", () => {
        const lines = parseRichText("</b>plain");
        expect(lines[0][0]).toEqual({text: "plain", bold: false, italic: false, underline: false});
    });
});
