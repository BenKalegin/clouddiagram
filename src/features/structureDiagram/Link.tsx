import React, {useContext} from "react";
import {Group, Path, Text} from "react-konva";
import {useAtomValue} from "jotai";
import {DiagramId, elementsAtom, isElementSelectedAtom} from "../diagramEditor/diagramEditorModel";
import {linkRenderSelector} from "./structureDiagramHandler";
import {LinkId} from "./structureDiagramState";
import {elementSelectedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ElementRef, ElementType, LinkState} from "../../package/packageModel";
import {AppLayoutContext} from "../../editor/editorLayout";
import {adjustColorSchemaForTheme} from "../../common/colors/colorTransform";
import {VirtualizedItem} from "../../common/components/VirtualizedLayer";
import {RichText} from "../../common/canvas/RichText";

export const Link = React.memo(({linkId, diagramId}: {linkId: LinkId, diagramId: DiagramId}) => {
    const isSelected = useAtomValue(isElementSelectedAtom({elementId: linkId, diagramId}))
    const dispatch = useDispatch()
    const render = useAtomValue(linkRenderSelector({linkId, diagramId}))
    const link = useAtomValue(elementsAtom(linkId)) as LinkState
    const { appLayout } = useContext(AppLayoutContext);
    const colorSchema = adjustColorSchemaForTheme(link?.colorSchema, appLayout.darkMode);
    if (!render) return null;
    const erRelationship = link.erRelationship;

    return (
        <VirtualizedItem
            getBounds={() => render.bounds}
        >
            <Group>
                {render.svgPath.map((pathData, index) => {
                    return <Path
                            key={index}
                            hitStrokeWidth={10}
                            data={pathData}
                            fill={pathData.trim().endsWith('Z') ? colorSchema.fillColor : "transparent"}
                            strokeWidth={isSelected ? 3 : 1.4}
                            stroke={colorSchema.strokeColor}
                            dash={erRelationship && !erRelationship.identifying ? [6, 4] : undefined}
                            onClick={(e) => {
                                const element: ElementRef = {id: linkId, type: ElementType.ClassLink}
                                dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
                            }}
                        />;
                    }
                )}
                {link.text && (
                    <RichText
                        x={(render.sourcePoint.x + render.targetPoint.x) / 2 - 50}
                        y={(render.sourcePoint.y + render.targetPoint.y) / 2 - 10}
                        width={100}
                        height={20}
                        text={link.text}
                        align="center"
                        verticalAlign="middle"
                        fontSize={12}
                        fill={colorSchema.strokeColor}
                        listening={false}
                    />
                )}
                {erRelationship && (
                    <>
                        <Text
                            x={render.sourcePoint.x - 18}
                            y={render.sourcePoint.y - 22}
                            width={36}
                            height={18}
                            text={erRelationship.sourceCardinality}
                            align="center"
                            verticalAlign="middle"
                            fontSize={12}
                            fill={colorSchema.strokeColor}
                            listening={false}
                        />
                        <Text
                            x={render.targetPoint.x - 18}
                            y={render.targetPoint.y - 22}
                            width={36}
                            height={18}
                            text={erRelationship.targetCardinality}
                            align="center"
                            verticalAlign="middle"
                            fontSize={12}
                            fill={colorSchema.strokeColor}
                            listening={false}
                        />
                    </>
                )}
            </Group>
        </VirtualizedItem>
    );
});
