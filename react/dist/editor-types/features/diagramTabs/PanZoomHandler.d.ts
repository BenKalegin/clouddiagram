import { StageHandler, ScrollHandler } from "./DiagramStage";
interface PanZoomHandlerProps {
    stageHandler: StageHandler | null;
    scrollHandler: ScrollHandler | null;
    scale: number;
    position: {
        x: number;
        y: number;
    };
    padding: number;
}
export declare const usePanZoomHandlers: ({ stageHandler, scrollHandler, scale, position, padding }: PanZoomHandlerProps) => {
    isRightMouseDown: boolean;
    lastPointerPosition: {
        x: number;
        y: number;
    } | null;
};
export {};
//# sourceMappingURL=PanZoomHandler.d.ts.map