import React, {useContext} from "react";
import {Group, Path, Text} from "react-konva";
import {useRecoilValue} from "recoil";
import {DiagramId, elementsAtom, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {linkRenderSelector} from "./structureDiagramHandler";
import {LinkId} from "./structureDiagramState";
import {elementSelectedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ElementRef, ElementType, LinkState} from "../../package/packageModel";
import {AppLayoutContext} from "../../app/appModel";
import {adjustColorSchemaForTheme} from "../../common/colors/colorTransform";
import {VirtualizedItem} from "../../common/components/VirtualizedLayer";

export const Link = ({linkId, diagramId}: {linkId: LinkId, diagramId: DiagramId}) => {
    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(linkId);
    const dispatch = useDispatch()
    const render = useRecoilValue(linkRenderSelector({linkId, diagramId}))
    const link = useRecoilValue(elementsAtom(linkId)) as LinkState
    const { appLayout } = useContext(AppLayoutContext);
    const colorSchema = adjustColorSchemaForTheme(link.colorSchema, appLayout.darkMode);

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
                            fill={colorSchema.fillColor}
                            strokeWidth={isSelected ? 3 : 1.4}
                            stroke={colorSchema.strokeColor}
                            onClick={(e) => {
                                const element: ElementRef = {id: linkId, type: ElementType.ClassLink}
                                dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
                            }}
                        />;
                    }
                )}
                {link.text && (
                    <Text
                        x={render.bounds.x + render.bounds.width / 2 - 50}
                        y={render.bounds.y + render.bounds.height / 2 - 10}
                        width={100}
                        text={link.text}
                        align="center"
                        verticalAlign="middle"
                        fontSize={12}
                        fill={colorSchema.strokeColor}
                        listening={false}
                    />
                )}
            </Group>
        </VirtualizedItem>
    );
}
