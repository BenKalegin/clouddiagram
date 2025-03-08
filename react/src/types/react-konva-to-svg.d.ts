// types/react-konva-to-svg.d.ts
declare module 'react-konva-to-svg' {
    import Konva from 'konva';

    export interface ExportOptions {
        onBefore?: (args: [Konva.Stage, Konva.Layer]) => void;
        onAfter?: (args: [Konva.Stage, Konva.Layer]) => void;
    }

    /**
     * Exports a Konva Stage to an SVG string or Blob.
     * @param stage The Konva Stage instance.
     * @param blob If true, returns a Blob; otherwise, returns a string.
     * @param options Callbacks for before and after export adjustments.
     */
    export function exportStageSVG(
        stage: Konva.Stage,
        blob?: boolean,
        options?: ExportOptions
    ): Promise<string | Blob>;
}
