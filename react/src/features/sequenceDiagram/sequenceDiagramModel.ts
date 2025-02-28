import {Bounds, Coordinate, Diagram, withinBounds, withinXBounds, withinYBounds, zeroBounds} from "../../common/model";
import {
    CustomShape,
    defaultLineStyle,
    defaultNoteHeight,
    defaultNoteStyle,
    defaultNoteWidth,
    defaultShapeStyle,
    DiagramElement,
    ElementRef,
    ElementType,
    Id,
    LineStyle,
    PictureLayout,
    ColorSchema
} from "../../package/packageModel";
import {DefaultValue, selector, selectorFamily} from "recoil";
import {ConnectorRender, DiagramId, elementsAtom, generateId, linkingAtom,} from "../diagramEditor/diagramEditorModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {ElementMoveResizePhase, Get, Set} from "../diagramEditor/diagramEditorSlice";
import produce, {Draft} from 'immer';
import {Command} from "../propertiesEditor/PropertiesEditor";
import {NoteState} from "../commonComponents/commonComponentsModel";
import {TypeAndSubType} from "../diagramTabs/HtmlDrop";

export const lifelineHeadY = 30;
export const lifelineDefaultWidth = 100;
export const lifelineDefaultStart = 30;
export const lifelineDefaultSpacing = 20;
export const lifelineDefaultHeight = 60;
export const messageDefaultSpacing = 40;

const activationWidth = 10;


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

export interface LifelinePlacement{
    headBounds: Bounds;
    /**
     * Relative position of the start of the lifeline. If 0, it will start right below the head
      */
    lifelineStart: number;
    /**
     * Relative position of the end of the lifeline. Length of the lifeline will be lifelineEnd - lifelineStart
     */
    lifelineEnd: number;
}

export interface LifelineState extends DiagramElement {
    activations: ActivationId[]
    placement: LifelinePlacement;
    title: string;
    shapeStyle: ColorSchema
}

export interface MessageRender extends ConnectorRender {
}

export interface MessagePlacement {
    //cornerStyle: CornerStyle;
}

export interface MessageState extends DiagramElement {
    isReturn: boolean
    isAsync: boolean
    text?: string
    activation1: Id
    activation2: Id
    sourceActivationOffset: number
    placement: MessagePlacement
    lineStyle: LineStyle
}

export interface SequenceDiagramState extends Diagram {
    lifelines: {[id: LifelineId]: LifelineState}
    messages: {[id: MessageId]: MessageState}
    activations: {[id: ActivationId]: ActivationState}
}


export const renderActivation = (activation: ActivationState, lifelinePlacement: LifelinePlacement): ActivationRender => {
    return {
        bounds:
            {
                x: lifelinePlacement.headBounds.x + lifelinePlacement.headBounds.width / 2 - activationWidth / 2,
                y: lifelinePlacement.headBounds.y + lifelinePlacement.headBounds.height + 2 /* shadow*/ + activation.start,
                width: activationWidth,
                height: activation.length
            }
    }
}

export const renderMessage = (activation1: ActivationRender, activation2: ActivationRender, messageOffset: number, selfMessage: boolean): MessageRender => {
    if (selfMessage) {
        return {
            bounds:{
                x: activation1.bounds.x + activation1.bounds.width,
                y:activation1.bounds.y + messageOffset,
                width: 20,
                height: 20,
            },
            points: [
                0, 0,
                20, 0,
                20, 20,
                0, 20],
        }
    }

    const rightToLeft = activation1.bounds.x + activation1.bounds.width > activation2.bounds.x;
    if (rightToLeft) {
        return {
            bounds: {
                x: activation2.bounds.x + activation1.bounds.width,
                y: activation1.bounds.y + messageOffset,
                width: activation1.bounds.x - activation2.bounds.x -  activation1.bounds.width,
                height: 0,
            },
            points: [activation1.bounds.x - activation2.bounds.x - activation1.bounds.width, 0, 0, 0],
        }
    }

    return {
        bounds: {
            x: activation1.bounds.x + activation1.bounds.width,
            y: activation1.bounds.y + messageOffset,
            width: activation2.bounds.x - activation1.bounds.x - activation1.bounds.width,
            height: 0,
        },
        points: [0, 0, activation2.bounds.x - activation1.bounds.x - activation1.bounds.width, 0],
    }
}

export function handleSequenceMoveElement(get: Get, set: Set, phase: ElementMoveResizePhase, elementId: ElementRef, currentPointerPos: Coordinate, startPointerPos: Coordinate, startNodePos: Coordinate) {
    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    const update = produce(diagram, (draft: Draft<SequenceDiagramState>) => {
        switch (elementId.type) {
            case ElementType.SequenceLifeLine:
                const placement = draft.lifelines[elementId.id].placement
                placement.headBounds.x = currentPointerPos.x - startPointerPos.x + startNodePos.x
                placement.headBounds.y = startNodePos.y
                break;

            case ElementType.SequenceMessage:
                const message = draft.messages[elementId.id]
                const activation = draft.activations[message.activation1]
                const lifelinePlacement = draft.lifelines[activation.lifelineId].placement
                const activationStart = lifelinePlacement.headBounds.y + lifelinePlacement.headBounds.height + 2 /* shadow*/ + activation.start
                let activationOffset = currentPointerPos.y - startPointerPos.y + startNodePos.y - activationStart
                if (activationOffset < 0) {
                    activationOffset = 0
                }
                if (activationOffset > activation.length) {
                    activationOffset = activation.length
                }
                message.sourceActivationOffset = activationOffset
                break;

            case ElementType.Note:
                const note = draft.notes[elementId.id]
                note.bounds.x = currentPointerPos.x - startPointerPos.x + startNodePos.x
                note.bounds.y = currentPointerPos.y - startPointerPos.y + startNodePos.y
                break;
        }
    })

    set(elementsAtom(diagramId), update)

}

export function handleSequenceResizeElement(get: Get, set: Set, phase: ElementMoveResizePhase, element: ElementRef, suggestedBounds: Bounds) {
    const diagramId = get(activeDiagramIdAtom);
    const originalDiagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
    const update = produce(originalDiagram, (diagram: Draft<SequenceDiagramState>) => {
        switch (element.type) {
            case ElementType.SequenceLifeLine:
                const placement = diagram.lifelines[element.id].placement
                placement.headBounds.x = suggestedBounds.x
                placement.headBounds.width = Math.max(10, suggestedBounds.width)
                break;
            case ElementType.Note:
                const note = diagram.notes[element.id]
                note.bounds.x = suggestedBounds.x
                note.bounds.y = suggestedBounds.y
                note.bounds.width = Math.max(10, suggestedBounds.width)
                note.bounds.height = Math.max(10, suggestedBounds.height)
                break;
        }
    })
    set(elementsAtom(diagramId), update)
}


export function handleSequenceDropFromLibrary(get: Get, set: Set, droppedAt: Coordinate, name: string, kind: TypeAndSubType) {
    const diagramId = get(activeDiagramIdAtom);
    const originalDiagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    const update = produce(originalDiagram, (diagram: Draft<SequenceDiagramState>) => {
        switch (kind.type) {
            case ElementType.SequenceLifeLine:
                const customShape : CustomShape | undefined  = kind.subType?
                {
                    layout: PictureLayout.FullIconTextBelow,
                    pictureId: kind.subType,
                }
                : undefined;
                const newLifeline: LifelineState = {
                    type: ElementType.SequenceLifeLine,
                    id: generateId(),
                    title: name,
                    customShape: customShape,
                    placement: {
                        headBounds: {
                            x: droppedAt.x - lifelineDefaultWidth / 2,
                            y: lifelineHeadY,
                            width: lifelineDefaultWidth,
                            height: lifelineDefaultHeight
                        },
                        lifelineStart: 0,
                        lifelineEnd: 100
                    },
                    activations: [],
                    shapeStyle: defaultShapeStyle
                };

                diagram.lifelines[newLifeline.id] = newLifeline;
                break;

            case ElementType.Note:
                const note: NoteState = {
                    type: ElementType.Note,
                    id: generateId(),
                    text: name,
                    shapeStyle: defaultNoteStyle,
                    bounds: {
                        x: droppedAt.x - defaultNoteWidth / 2,
                        y: droppedAt.y,
                        width: defaultNoteWidth,
                        height: defaultNoteHeight
                    }
                };
                diagram.notes[note.id] = note;

                break;
            default:
                throw new Error('Invalid element type ' + kind)
        }
    })
    set(elementsAtom(diagramId), update)
}

/**
 * Calculate lifeline bounds relative to the headBounds
 */
export function lifelinePoints(headBounds: Bounds, lifelineStart: number, lifelineEnd: number): number[] {
    return [
        headBounds.width/2,
        headBounds.height + 2 /* shadow*/ + lifelineStart,
        headBounds.width/2,
        headBounds.height + 2 + lifelineEnd
    ];

}

/**
 * Search for activation at specified X,Y diagram position
 */
export function findActivationAtPos(get: Get, pos: Coordinate, diagramId: string, tolerance: number) :
    [Id?, Bounds?]  {
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    function activationRender(activationId: ActivationId) : ActivationRender {
        const activation = diagram.activations[activationId];


        const lifeline = diagram.lifelines[activation.lifelineId];
        const lifelinePlacement = lifeline.placement;

        return renderActivation(activation!, lifelinePlacement)
    }

    for (const activationId of Object.keys(diagram.activations)) {
        const bounds = activationRender(activationId).bounds;
        if (withinBounds(bounds, pos, tolerance))
            return [activationId, bounds];
    }

    return [undefined, undefined];
}

/**
 * Search for lifeline at specified X diagram position
 */
export function findLifelineAtPos(get: Get, pos: Coordinate, diagramId: string, tolerance: number) :
    [LifelineId?, Bounds?]  {
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    for (const lifelineId of Object.keys(diagram.lifelines)) {
        const headBounds = diagram.lifelines[lifelineId].placement.headBounds;
        const lifelineBounds: Bounds = {
            x: headBounds.x + headBounds.width / 2,
            y: 0,
            width: 1,
            height: 0
        };
        if (withinXBounds(lifelineBounds, pos.x, tolerance))
            return [lifelineId, lifelineBounds];
    }

    return [undefined, undefined];
}

/**
 * Search for activation in lifeline at specified Y diagram position
 */
export function findLifelineActivationAt(get: Get, y: number, diagramId: string, lifeline: LifelineState, tolerance: number) :
    [ActivationId?, Bounds?]  {
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    function activationRender(activationId: ActivationId) : ActivationRender {
        const activation = diagram.activations[activationId];
        return renderActivation(activation!, lifeline.placement)
    }

    for (const activationId of lifeline.activations) {
        const bounds = activationRender(activationId).bounds;
        if (withinYBounds(bounds, y, tolerance))
            return [activationId, bounds];
    }

    return [undefined, undefined];
}



const DefaultActivationLength = 40;
const LifelineTailAfterActivation = 40;


function createActivation(diagramPos: Coordinate, lifeline: Draft<LifelineState>) {
    const length = DefaultActivationLength;

    // todo check if activation overlaps another and adjust length

    let start = diagramPos.y - lifeline.placement.headBounds.y - lifeline.placement.headBounds.height - 2 /* shadow */;

    if (start < 0)
        start = 0;


    const activation = {
        type: ElementType.SequenceActivation,
        id: generateId(),
        length: length,
        lifelineId: lifeline.id,
        placement: {},
        start: start,
    };
    lifeline.activations.push(activation.id);

    const activationEnd = activation.start + activation.length

    lifeline.placement.lifelineEnd = Math.max(lifeline.placement.lifelineEnd, activationEnd + LifelineTailAfterActivation);

    return activation;
}

export function autoConnectActivations(get: Get, set: Set, sourceId: Id, target: ElementRef, diagramPos: Coordinate) {
    const messageId = generateId()

    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    const update = produce(diagram, (draft: Draft<SequenceDiagramState>) => {

        const sourceLifeline = draft.lifelines[sourceId];
        let [sourceActivationId, sourceActivationBounds] = findLifelineActivationAt(get, diagramPos.y, diagramId, sourceLifeline, 1);

        if (!sourceActivationId) {
            // create activation for the source lifeline
            sourceActivationId = generateId()
            const sourceActivation = createActivation(diagramPos, sourceLifeline);
            sourceActivationId = sourceActivation.id;
            sourceActivationBounds = renderActivation(sourceActivation, sourceLifeline.placement).bounds;
            draft.activations[sourceActivationId] = sourceActivation;
        }

        let targetActivationId: ActivationId;

        if (target.type === ElementType.SequenceLifeLine) {
            const targetActivation = createActivation(diagramPos, draft.lifelines[target.id])
            targetActivationId = targetActivation.id
            draft.activations[targetActivationId] = targetActivation
        } else if (target.type === ElementType.SequenceActivation) {
            targetActivationId = target.id
        } else {
            throw new Error(`Unknown target type ${target.type}`)
        }

        draft.messages[messageId] = {
            placement: {},
            type: ElementType.SequenceMessage,
            id: messageId,
            isReturn: false,
            isAsync: false,
            activation1: sourceActivationId,
            activation2: targetActivationId,
            sourceActivationOffset: diagramPos.y - sourceActivationBounds!.y,
            lineStyle: defaultLineStyle
        }
    })

    set(elementsAtom(diagramId), update)
}

export function createLifelineAndConnectTo(get: Get, set: Set, name: string) {
    const linking = get(linkingAtom)!;
    const diagramPos = linking.diagramPos!;

    const diagramId = get(activeDiagramIdAtom);
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    let targetActivationId : Id = '';

    const update = produce(diagram, (draft: Draft<SequenceDiagramState>) => {
        const targetLifeline: LifelineState = {
            activations: [],
            type: ElementType.SequenceLifeLine,
            id: generateId(),
            title: name,
            placement: {
                headBounds: {
                    x: diagramPos.x - lifelineDefaultWidth / 2,
                    y: lifelineHeadY,
                    width: lifelineDefaultWidth,
                    height: lifelineDefaultHeight
                },
                lifelineStart: 0,
                lifelineEnd: Math.max(lifelineDefaultHeight, diagramPos.y - lifelineHeadY - 2),
            },
            shapeStyle: defaultShapeStyle
        }

        produce(targetLifeline,lifelineDraft => {
            const targetActivation = createActivation(diagramPos, lifelineDraft);
            targetActivationId = targetActivation.id;
            draft.lifelines[targetLifeline.id] = targetLifeline;
            draft.activations[targetActivation.id] = targetActivation;
        });
    })

    set(elementsAtom(diagramId), update)

    autoConnectActivations(get, set, linking.sourceElement, { id: targetActivationId, type: ElementType.SequenceActivation}, diagramPos)
}

export const drawingMessageRenderSelector = selector<MessageRender | undefined>({
    key: 'drawMessageRender',
    get: ({get}) => {
        const maybeLinking = get(linkingAtom)
        if (!maybeLinking)
            return undefined;
        const linking = maybeLinking!
        const diagramId = get(activeDiagramIdAtom)
        const y = linking.diagramPos.y;
        const lifeline1 = get(lifelineSelector({lifelineId: linking.sourceElement, diagramId}))
        const lifeline1Placement = get(lifelinePlacementSelector({lifelineId: linking.sourceElement, diagramId}))
        const lifelineY = Math.max(y - lifeline1Placement.headBounds.height, 0)

        let activation1 = lifeline1.activations
            .map(a => get(activationSelector({activationId: a, diagramId})))
            .find(a => a.start <= lifelineY && a.start + a.length >= lifelineY);
        if (!activation1) {
            activation1 = {
                lifelineId: "",
                placement: {},
                type: ElementType.SequenceActivation,
                start: lifelineY,
                length: 50,
                id: "dummy"
            };
        }

        const activationRender1: ActivationRender = renderActivation(activation1, lifeline1Placement);

        const activation2: ActivationState = {
            lifelineId: "",
            type: ElementType.SequenceActivation,
            id: "linking_target",
            start: y,
            length: 20,
            placement: zeroBounds
        };
        const lifelinePlacement2: LifelinePlacement = {
            headBounds: {
                x: linking.diagramPos.x - lifeline1Placement.headBounds.width / 2,
                y: lifeline1Placement.headBounds.y,
                width: lifeline1Placement.headBounds.width,
                height: lifeline1Placement.headBounds.height
            },
            lifelineStart: 0,
            lifelineEnd: lifeline1Placement.lifelineEnd
        }
        const activationRender2: ActivationRender = renderActivation(activation2, lifelinePlacement2);
        let messageActivationOffset = y - activationRender1.bounds.y;

        return renderMessage(activationRender1, activationRender2, messageActivationOffset, activation1.id === linking.targetElement?.id);
    }
})


export const sequenceDiagramSelector = selectorFamily<SequenceDiagramState, DiagramId>({
    key: 'sequenceDiagram',
    get: (id) => ({get}) => {
        return get(elementsAtom(id)) as SequenceDiagramState;
    },

    set: (id) => ({get, set}, newValue) => {
        set(elementsAtom(id), newValue)
    }
})

export const lifelineSelector = selectorFamily<LifelineState, {lifelineId: Id, diagramId: DiagramId}>({
    key: 'lifeline',
    get: ({lifelineId, diagramId}) => ({get}) => {
        const diagram = get(sequenceDiagramSelector(diagramId));
        return diagram.lifelines[lifelineId];
    }
})

export const lifelinePlacementSelector = selectorFamily<LifelinePlacement, {lifelineId: Id, diagramId: DiagramId}>({
    key: 'lifelinePlacement',
    get: ({lifelineId, diagramId}) => ({get}) => {
        const lifeline = get(lifelineSelector({lifelineId, diagramId}));
        return lifeline.placement;
    },
    set: ({lifelineId, diagramId}) => ({get, set}, newValue) => {
        const diagram = get(sequenceDiagramSelector(diagramId))
        if (!(newValue instanceof DefaultValue)) {
            set(sequenceDiagramSelector(diagramId), { ...diagram, lifelines: {...diagram.lifelines, [lifelineId] : {...diagram.lifelines[lifelineId], placement: newValue}}});
        }
    }
})

export const activationSelector = selectorFamily<ActivationState, {activationId: Id, diagramId: DiagramId}>({
    key: 'activation',
    get: ({activationId, diagramId}) => ({get}) => {
        const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
        return diagram.activations[activationId];
    }
})

export const activationRenderSelector = selectorFamily<ActivationRender, {activationId: Id, diagramId: DiagramId}>({
    key: 'activationRender',
    get: ({activationId, diagramId}) => ({get}) => {
        const activation = get(activationSelector({activationId, diagramId}));
        const lifelineBounds = get(lifelinePlacementSelector({lifelineId: activation.lifelineId, diagramId}));
        return renderActivation(activation!, lifelineBounds)
    }
})

export const messageSelector = selectorFamily<MessageState, {messageId: MessageId, diagramId: DiagramId}>({
    key: 'message',
    get: ({messageId, diagramId}) => ({get}) => {
        const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;
        return diagram.messages[messageId];
    }
})

export const messageRenderSelector = selectorFamily<MessageRender, {messageId: MessageId, diagramId: DiagramId}>({
    key: 'messageRender',
    get: ({messageId, diagramId}) => ({get}) => {
        const message = get(messageSelector({messageId, diagramId}));
        const activation1 = get(activationRenderSelector({activationId: message.activation1, diagramId: diagramId}));
        const activation2 = get(activationRenderSelector({activationId: message.activation2, diagramId: diagramId}));
        return renderMessage(activation1, activation2, message.sourceActivationOffset, message.activation1 === message.activation2);
    }
})

export function handleSequenceElementPropertyChanged(get: Get, set: Set, elements: ElementRef[], propertyName: string, value: any) {
    const diagramId = get(activeDiagramIdAtom)
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    const update = produce(diagram, (draft: Draft<SequenceDiagramState>) => {

        elements.forEach(element => {
            switch (element.type) {
                case ElementType.SequenceLifeLine:
                    const object: any = draft.lifelines[element.id];
                    object[propertyName] = value;
                    break;
                case ElementType.SequenceMessage:
                    const message: any = draft.messages[element.id];
                    message[propertyName] = value;
                    break;
                case ElementType.Note:
                    const note: any = draft.notes[element.id];
                    note[propertyName] = value;
                    break;
            }
        });
    })

    set(elementsAtom(diagramId), update);
}

function reverseMessage(draft: Draft<SequenceDiagramState>, messageId: MessageId) {
    const message = draft.messages[messageId];
    const swap = message.activation1
    message.activation1 = message.activation2;
    message.activation2 = swap;
}

function deleteSequenceElement(diagram: Draft<SequenceDiagramState>, element: ElementRef) {
    function deleteActivation(activationId: ActivationId) {
        const activation = diagram.activations[activationId];
        const lifeline = diagram.lifelines[activation.lifelineId];
        diagram.messages = Object.fromEntries(Object.entries(diagram.messages)
            .filter(([, value]) => value.activation1 !== activationId && value.activation2 !== activationId));
        lifeline.activations = lifeline.activations.filter(a => a !== activationId);
        delete diagram.activations[activationId];
    }

    switch(element.type) {
        case ElementType.SequenceMessage:
            delete diagram.messages[element.id];
            break;
        case ElementType.SequenceActivation:
            deleteActivation(element.id);
            break;

        case ElementType.SequenceLifeLine:
            const lifeline = diagram.lifelines[element.id];
            lifeline.activations.forEach(activationId => deleteActivation(activationId));
            delete diagram.lifelines[element.id];
            break;
    }
    diagram.selectedElements = diagram.selectedElements.filter(e => e.id !== element.id);
}

function addReturnMessage(diagram: Draft<SequenceDiagramState>, id: Id) {
    const origin = diagram.messages[id]
    if(origin.isReturn)
        return;
    const result: MessageState = {
        isAsync: false,
        lineStyle: origin.lineStyle,
        id: generateId(),
        activation1: origin.activation2,
        activation2: origin.activation1,
        sourceActivationOffset: origin.sourceActivationOffset + messageDefaultSpacing,
        isReturn: true,
        text: ":",
        type: ElementType.SequenceMessage,
        placement: {...origin.placement}
    }
    diagram.messages[result.id] = result;
    diagram.selectedElements = [{id: result.id, type: ElementType.SequenceMessage}];
}

export function handleSequenceCommand(get: Get, set: Set, elements: ElementRef[], command: Command) {
    const diagramId = get(activeDiagramIdAtom)
    const diagram = get(elementsAtom(diagramId)) as SequenceDiagramState;

    const update = produce(diagram, (draft: Draft<SequenceDiagramState>) => {
        switch (command) {
            case Command.ReverseMessage:
                elements.forEach(element => {
                    reverseMessage(draft, element.id);
                });
                break;

            case Command.AddReturnMessage:
                addReturnMessage(draft, elements[0].id);
                break;

            case Command.Delete:
                elements.forEach(element => {
                    deleteSequenceElement(draft, element);
                });
                break;
        }
    })

    set(elementsAtom(diagramId), update);
}
