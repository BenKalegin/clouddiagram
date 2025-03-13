import React from "react";
import {Group, Path, Text} from "react-konva";
import {useRecoilValue} from "recoil";
import {DiagramId, elementsAtom, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {linkRenderSelector} from "./structureDiagramEditor";
import {LinkId} from "./structureDiagramState";
import {elementSelectedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ElementRef, ElementType, LinkState} from "../../package/packageModel";

export const Link = ({linkId, diagramId}: {linkId: LinkId, diagramId: DiagramId}) => {
    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(linkId);
    const dispatch = useDispatch()
    const render = useRecoilValue(linkRenderSelector({linkId, diagramId}))
    const link = useRecoilValue(elementsAtom(linkId)) as LinkState
    return (
        <Group>
            {render.svgPath.map((pathData, index) =>
                <Path
                    key={index}
                    hitStrokeWidth={10}
                    data={pathData}
                    fill={link.colorSchema.fillColor}
                    strokeWidth={isSelected ? 3 : 1.4}
                    stroke={link.colorSchema.strokeColor}
                    onClick={(e) => {
                        const element: ElementRef = {id: linkId, type: ElementType.ClassLink}
                        dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
                    }}
                />
            )}
        </Group>
    );
}
