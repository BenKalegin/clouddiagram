import { Bounds, Coordinate } from "../../common/model";
import { DiagramElement, ElementType, Id, ElementRef } from "../../package/packageModel";
import { ExportImportFormat } from "../export/exportFormats";
export interface Linking {
    sourceElement: Id;
    mouseStartPos: Coordinate;
    diagramStartPos: Coordinate;
    mousePos: Coordinate;
    diagramPos: Coordinate;
    scale: number;
    drawing: boolean;
    showLinkToNewDialog?: boolean;
    targetElement?: ElementRef;
}
export type DiagramId = Id;
export declare enum ExportPhase {
    start = 0,
    selected = 1,
    exporting = 2,
    cancel = 3
}
export declare enum ImportPhase {
    start = 0,
    selected = 1,
    importing = 2,
    cancel = 3
}
export interface Exporting {
    phase: ExportPhase;
    format?: ExportImportFormat;
}
export interface Importing {
    phase: ImportPhase;
    format?: ExportImportFormat;
}
export interface ContextPopupProps {
    elementId: Id;
    mousePos: Coordinate;
    diagramPos: Coordinate;
}
export declare const emptyElementSentinel: DiagramElement;
export declare const diagramTitleSelector: (param: string | undefined) => import("recoil").RecoilValueReadOnly<string | undefined>;
export declare const diagramKindSelector: (param: string) => import("recoil").RecoilValueReadOnly<ElementType>;
export declare const diagramDisplaySelector: (param: string) => import("recoil").RecoilValueReadOnly<import("../../common/model").DiagramDisplay>;
export declare const selectedRefsSelector: (param: string) => import("recoil").RecoilValueReadOnly<ElementRef[]>;
export declare const selectedElementsSelector: (param: string) => import("recoil").RecoilValueReadOnly<ElementRef[]>;
export declare const linkingAtom: import("recoil").RecoilState<Linking | undefined>;
export declare const exportingAtom: import("recoil").RecoilState<Exporting | undefined>;
export declare const importingAtom: import("recoil").RecoilState<Importing | undefined>;
export declare const showContextAtom: import("recoil").RecoilState<ContextPopupProps | undefined>;
export declare const snapGridSizeAtom: import("recoil").RecoilState<number>;
export declare const generateId: () => string;
export interface ConnectorRender {
    bounds: Bounds;
    points: number[];
}
export declare const elementsAtom: (param: string) => import("recoil").RecoilState<DiagramElement>;
export declare const elementIdsAtom: import("recoil").RecoilState<string[]>;
//# sourceMappingURL=diagramEditorModel.d.ts.map