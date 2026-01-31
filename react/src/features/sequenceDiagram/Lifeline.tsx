import {Group, Line, Rect, Shape, Text} from "react-konva";
import {LifelineId, lifelinePoints, lifelineSelector} from "./sequenceDiagramModel";
import React, {FC, useContext} from "react";
import {Scaffold} from "../scaffold/Scaffold";
import {Activation} from "./Activation";
import {DrawingMessage} from "./DrawingMessage";
import {useRecoilValue} from "recoil";
import {DiagramId, linkingAtom, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {ElementType} from "../../package/packageModel";
import {useCustomDispatch} from "../diagramEditor/commonHandlers";
import {getLifelineCustomDrawById} from "../graphics/graphicsReader";
import {AppLayoutContext} from "../../app/appModel";
import {adjustColorSchemaForTheme} from "../../common/colors/colorTransform";

export interface LifelineProps {
    lifelineId: LifelineId
    diagramId: DiagramId
}


export const Lifeline: FC<LifelineProps> = ({lifelineId, diagramId}) => {
    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(lifelineId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === lifelineId;
    const lifeline = useRecoilValue(lifelineSelector({lifelineId, diagramId}))
    const placement = lifeline.placement
    const linking = useRecoilValue(linkingAtom)
    const element = { id: lifelineId, type: ElementType.SequenceLifeLine };

    const eventHandlers = useCustomDispatch({
        onClick: true,
        onDrag: true,
        element: element,
        diagramId: diagramId,
        bounds: placement.headBounds,
        disableVerticalDrag: true
    });

    const { appLayout } = useContext(AppLayoutContext);
    const colorSchema = adjustColorSchemaForTheme(lifeline.colorSchema, appLayout.darkMode);

    function DefaultHead() {
        return <Group
            {...eventHandlers}
            x={placement.headBounds.x}
            y={placement.headBounds.y}
            draggable={true}
        >
            <Rect
                x={2}
                y={2}
                width={placement.headBounds.width}
                height={placement.headBounds.height}
                fill="darkgray"
            />
            <Rect
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                strokeWidth={1}
                x={0}
                y={0}
                width={placement.headBounds.width}
                height={placement.headBounds.height}
            />
            <Text
                x={0}
                y={0}
                width={placement.headBounds.width}
                height={placement.headBounds.height}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={lifeline.title}
                fill={colorSchema.textColor}
                listening={false}
                preventDefault={true}
            />
        </Group>;
    }

    function CustomHead() {
        return <Group
            {...eventHandlers}
            x={placement.headBounds.x}
            y={placement.headBounds.y}
            draggable={true}
        >
            <Rect
                x={0}
                y={0}
                width={placement.headBounds.width}
                height={placement.headBounds.height}
                fill={"transparent"}
                stroke={""}
                listening={true}
            />
            <Shape
                sceneFunc={getLifelineCustomDrawById(lifeline.customShape?.pictureId!)}
                fill="darkgray"
                stroke="darkgray"
                strokeWidth={1}
                x={2}
                y={2}
                width={placement.headBounds.width}
                height={placement.headBounds.height - 16}
            />
            <Shape
                sceneFunc={getLifelineCustomDrawById(lifeline.customShape?.pictureId!)}
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                strokeWidth={1}
                x={0}
                y={0}
                width={placement.headBounds.width}
                height={placement.headBounds.height - 16}
            />
            <Text
                x={0}
                y={placement.headBounds.height - 14}
                width={placement.headBounds.width}
                height={16}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={lifeline.title}
                fill={colorSchema.textColor}
                listening={false}
                preventDefault={true}
            />
        </Group>;
    }

    return <Group>
        {!lifeline.customShape && DefaultHead()}
        {lifeline.customShape && CustomHead()}
        <Line
            stroke={lifeline.colorSchema.strokeColor}
            strokeWidth={2}
            dash={[5, 3]}

            x={placement.headBounds.x}
            y={placement.headBounds.y}
            points={lifelinePoints(placement.headBounds, placement.lifelineEnd, placement.lifelineStart)}
        />
        {lifeline.activations.map((activation, i) =>
            <Activation
                key={i}
                activationId={activation}
                diagramId={diagramId}
                colorSchema={lifeline.colorSchema}
            />
        )
        }
        {isSelected && <Scaffold
            element={element}
            bounds={{
                ...placement.headBounds,
                height: placement.headBounds.y + placement.headBounds.height + placement.lifelineEnd
            }}
            excludeDiagonalResize={true}
            excludeVerticalResize={true}
            isFocused={isFocused}
            isLinking={linking?.drawing === true}
            linkingDrawing={<DrawingMessage/>}
        />}

    </Group>
}
