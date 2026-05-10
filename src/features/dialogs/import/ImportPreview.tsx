import React, {useEffect, useMemo, useRef} from "react";
import {Box, Typography} from "@mui/material";
import {Stage} from "react-konva";
import {createStore, Provider as JotaiProvider} from "jotai";
import {Diagram, defaultDiagramDisplay} from "../../../common/model";
import {DiagramElement, ElementType, Id} from "../../../package/packageModel";
import {elementIdsAtom, elementsAtom} from "../../diagramEditor/diagramEditorModel";
import {getDiagramEditor} from "../../diagramTypes/diagramEditorRegistry";
import {ExportImportFormat, importDiagramAs} from "../../export/exportFormats";
import {createDiagramForType} from "../../diagramTypes/diagramTypeRegistry";
import {clearPersistedStateByPrefix, STORAGE_KEY} from "../../../common/persistence/statePersistence";

const PREVIEW_DIAGRAM_ID = "__import_preview__";
const PREVIEW_KEY_PREFIX = `${STORAGE_KEY}_element___import_preview__`;

export interface ImportPreviewProps {
    diagramKind: ElementType;
    format?: ExportImportFormat;
    source: string;
    width: number;
    height: number;
}

interface PreviewData {
    diagram: Diagram;
    elements: Record<Id, DiagramElement>;
}

interface PreviewBounds {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

function computeBounds(diagram: Diagram): PreviewBounds | undefined {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const update = (b: {x: number; y: number; width: number; height: number}) => {
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width);
        maxY = Math.max(maxY, b.y + b.height);
    };
    const d = diagram as any;
    if (d.nodes) Object.values(d.nodes).forEach((n: any) => n?.bounds && update(n.bounds));
    if (d.notes) Object.values(d.notes).forEach((n: any) => n?.bounds && update(n.bounds));
    if (d.lifelines) Object.values(d.lifelines).forEach((l: any) => l?.placement?.headBounds && update({
        ...l.placement.headBounds,
        height: l.placement.headBounds.height + (l.placement.lifelineEnd ?? 0),
    }));
    if (d.pie?.bounds) update(d.pie.bounds);
    if (!isFinite(minX)) return undefined;
    return {minX, minY, maxX, maxY};
}

export const ImportPreview: React.FC<ImportPreviewProps> = ({diagramKind, format, source, width, height}) => {
    const previewStoreRef = useRef<ReturnType<typeof createStore> | null>(null);
    if (!previewStoreRef.current) previewStoreRef.current = createStore();

    const parsed = useMemo<{data?: PreviewData; error?: string}>(() => {
        if (!format || !source.trim()) return {};
        try {
            const baseDiagram = createDiagramForType(diagramKind, PREVIEW_DIAGRAM_ID);
            const result = importDiagramAs(baseDiagram, format, source);
            const diagram = {
                ...result.diagram,
                id: PREVIEW_DIAGRAM_ID,
                display: defaultDiagramDisplay,
                selectedElements: [],
            };
            return {data: {diagram, elements: result.elements}};
        } catch (e) {
            return {error: e instanceof Error ? e.message : "Failed to parse"};
        }
    }, [diagramKind, format, source]);
    const previewData = parsed.data;
    const error = parsed.error;

    useEffect(() => {
        const store = previewStoreRef.current;
        if (!store || !previewData) return;
        store.set(elementsAtom(PREVIEW_DIAGRAM_ID), previewData.diagram);
        const ids: string[] = [];
        for (const [id, el] of Object.entries(previewData.elements)) {
            store.set(elementsAtom(id), el);
            ids.push(id);
        }
        store.set(elementIdsAtom, [PREVIEW_DIAGRAM_ID, ...ids]);
    }, [previewData]);

    useEffect(() => () => clearPersistedStateByPrefix(PREVIEW_KEY_PREFIX), []);

    const layout = useMemo(() => {
        if (!previewData) return {scale: 1, x: 0, y: 0};
        const b = computeBounds(previewData.diagram);
        if (!b) return {scale: 1, x: 0, y: 0};
        const w = Math.max(b.maxX - b.minX, 1);
        const h = Math.max(b.maxY - b.minY, 1);
        const padding = 24;
        const scale = Math.min((width - padding * 2) / w, (height - padding * 2) / h, 1);
        const x = padding - b.minX * scale + ((width - padding * 2) - w * scale) / 2;
        const y = padding - b.minY * scale + ((height - padding * 2) - h * scale) / 2;
        return {scale, x, y};
    }, [previewData, width, height]);

    if (!source.trim()) {
        return <PreviewMessage width={width} height={height}>Paste, drop, or pick a source to see a preview</PreviewMessage>;
    }
    if (!format) {
        return <PreviewMessage width={width} height={height}>Pick an import format to see a preview</PreviewMessage>;
    }
    if (error) {
        return <PreviewMessage width={width} height={height} error>Cannot preview: {error}</PreviewMessage>;
    }
    if (!previewData) {
        return <PreviewMessage width={width} height={height}>Preparing preview…</PreviewMessage>;
    }

    const DiagramEditor = getDiagramEditor(previewData.diagram.type as ElementType);

    return (
        <Box
            sx={{
                width,
                height,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                bgcolor: "background.default",
                overflow: "hidden",
                position: "relative",
            }}
        >
            <Stage
                width={width}
                height={height}
                scaleX={layout.scale}
                scaleY={layout.scale}
                x={layout.x}
                y={layout.y}
                listening={false}
            >
                <JotaiProvider store={previewStoreRef.current!}>
                    <DiagramEditor diagramId={PREVIEW_DIAGRAM_ID} />
                </JotaiProvider>
            </Stage>
        </Box>
    );
};

const PreviewMessage: React.FC<{width: number; height: number; error?: boolean; children: React.ReactNode}> = ({width, height, error, children}) => (
    <Box
        sx={{
            width, height,
            border: "1px dashed",
            borderColor: error ? "error.main" : "divider",
            borderRadius: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: error ? "error.main" : "text.secondary",
            p: 2,
            textAlign: "center",
        }}
    >
        <Typography variant="body2">{children}</Typography>
    </Box>
);

