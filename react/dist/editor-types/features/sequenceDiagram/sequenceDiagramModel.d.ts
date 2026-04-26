import { Bounds, Coordinate, Diagram } from "../../common/model";
import { DiagramElement, ElementRef, HasColorSchema, Id, LineStyle } from "../../package/packageModel";
import { ConnectorRender, DiagramId } from "../diagramEditor/diagramEditorModel";
import { Get, Set } from "../diagramEditor/diagramEditorSlice";
import { TypeAndSubType } from "../diagramTabs/HtmlDrop";
import { Command } from "../propertiesEditor/propertiesEditorModel";
export declare const lifelineHeadY = 30;
export declare const lifelineDefaultWidth = 100;
export declare const lifelineDefaultStart = 30;
export declare const lifelineDefaultSpacing = 20;
export declare const lifelineDefaultHeight = 60;
export declare const messageDefaultSpacing = 40;
export type LifelineId = Id;
export type ActivationId = Id;
export type MessageId = Id;
export interface ActivationPlacement {
}
export interface ActivationState extends DiagramElement {
    start: number;
    length: number;
    lifelineId: LifelineId;
    placement: ActivationPlacement;
}
export interface ActivationRender {
    bounds: Bounds;
}
export interface LifelinePlacement {
    headBounds: Bounds;
    /**
     * Relative position of the lifeline start. If 0, it will start right below the head
      */
    lifelineStart: number;
    /**
     * Relative position of the lifeline end. Length of the lifeline will be lifelineEnd - lifelineStart
     */
    lifelineEnd: number;
}
export interface LifelineState extends DiagramElement, HasColorSchema {
    activations: ActivationId[];
    placement: LifelinePlacement;
    title: string;
}
export interface MessageRender extends ConnectorRender {
}
export interface MessagePlacement {
}
export interface MessageState extends DiagramElement {
    isReturn: boolean;
    isAsync: boolean;
    text?: string;
    activation1: Id;
    activation2: Id;
    sourceActivationOffset: number;
    placement: MessagePlacement;
    lineStyle: LineStyle;
}
export interface SequenceDiagramState extends Diagram {
    lifelines: {
        [id: LifelineId]: LifelineState;
    };
    messages: {
        [id: MessageId]: MessageState;
    };
    activations: {
        [id: ActivationId]: ActivationState;
    };
}
export declare const renderActivation: (activation: ActivationState, lifelinePlacement: LifelinePlacement) => ActivationRender;
export declare const renderMessage: (activation1: ActivationRender, activation2: ActivationRender, messageOffset: number, selfMessage: boolean) => MessageRender;
export declare function handleSequenceMoveElement(get: Get, set: Set, elementId: ElementRef, currentPointerPos: Coordinate, startPointerPos: Coordinate, startNodePos: Coordinate): void;
export declare function handleSequenceResizeElement(get: Get, set: Set, element: ElementRef, suggestedBounds: Bounds): void;
export declare function handleSequenceDropFromLibrary(get: Get, set: Set, droppedAt: Coordinate, name: string, kind: TypeAndSubType): void;
/**
 * Calculate lifeline bounds relative to the headBounds
 */
export declare function lifelinePoints(headBounds: Bounds, lifelineStart: number, lifelineEnd: number): number[];
/**
 * Search for activation at the specified X, Y diagram position
 */
export declare function findActivationAtPos(get: Get, pos: Coordinate, diagramId: string, tolerance: number): [
    Id?,
    Bounds?
];
/**
 * Search for lifeline at specified X diagram position
 */
export declare function findLifelineAtPos(get: Get, pos: Coordinate, diagramId: string, tolerance: number): [
    LifelineId?,
    Bounds?
];
/**
 * Search for activation in lifeline at specified Y diagram position
 */
export declare function findLifelineActivationAt(get: Get, y: number, diagramId: string, lifeline: LifelineState, tolerance: number): [
    ActivationId?,
    Bounds?
];
export declare function autoConnectActivations(get: Get, set: Set, sourceId: Id, target: ElementRef, diagramPos: Coordinate): void;
export declare function createLifelineAndConnectTo(get: Get, set: Set, name: string): void;
export declare const drawingMessageRenderSelector: import("recoil").RecoilValueReadOnly<MessageRender | undefined>;
export declare const sequenceDiagramSelector: (param: string) => import("recoil").RecoilState<SequenceDiagramState>;
export declare const lifelineSelector: (param: {
    lifelineId: Id;
    diagramId: DiagramId;
}) => import("recoil").RecoilValueReadOnly<LifelineState>;
export declare const lifelinePlacementSelector: (param: {
    lifelineId: Id;
    diagramId: DiagramId;
}) => import("recoil").RecoilState<LifelinePlacement>;
export declare const activationSelector: (param: {
    activationId: Id;
    diagramId: DiagramId;
}) => import("recoil").RecoilValueReadOnly<ActivationState>;
export declare const activationRenderSelector: (param: {
    activationId: Id;
    diagramId: DiagramId;
}) => import("recoil").RecoilValueReadOnly<ActivationRender>;
export declare const messageSelector: (param: {
    messageId: MessageId;
    diagramId: DiagramId;
}) => import("recoil").RecoilValueReadOnly<MessageState>;
export declare const messageRenderSelector: (param: {
    messageId: MessageId;
    diagramId: DiagramId;
}) => import("recoil").RecoilValueReadOnly<MessageRender>;
export declare function handleSequenceElementPropertyChanged(get: Get, set: Set, elements: ElementRef[], propertyName: string, value: any): void;
export declare function handleSequenceCommand(get: Get, set: Set, elements: ElementRef[], command: Command): void;
//# sourceMappingURL=sequenceDiagramModel.d.ts.map