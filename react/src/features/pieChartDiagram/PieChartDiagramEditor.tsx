import React, {useContext} from "react";
import {Group, Rect, Text, Wedge} from "react-konva";
import {useAtomValue} from "jotai";
import {AppLayoutContext} from "../../editor/editorLayout";
import {colorSchemaList} from "../../common/colors/colorSchemas";
import {adjustColorSchemaForTheme} from "../../common/colors/colorTransform";
import {ElementRef, ElementType, PieSliceState} from "../../package/packageModel";
import {elementSelectedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {DiagramId, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {pieChartDiagramSelector} from "./pieChartDiagramModel";
import {formatPieValue, normalizedPieSlices} from "./pieChartDiagramUtils";

export const PieChartDiagramEditor = ({diagramId}: {diagramId: DiagramId}) => {
    const diagram = useAtomValue(pieChartDiagramSelector(diagramId));
    const selectedRefs = useAtomValue(selectedRefsSelector(diagramId));
    const dispatch = useDispatch();
    const {appLayout} = useContext(AppLayoutContext);
    const bounds = diagram.pie.bounds;
    const slices = normalizedPieSlices(diagram.pie.slices);
    const hasSlices = slices.length > 0;
    const isSelected = selectedRefs.some(ref => ref.id === diagramId && ref.type === ElementType.PieChartDiagram);
    const element: ElementRef = {id: diagramId, type: ElementType.PieChartDiagram};
    const textColor = appLayout.darkMode ? "#F6F8FA" : "#1F2937";
    const mutedTextColor = appLayout.darkMode ? "#C9D1D9" : "#4B5563";

    const titleHeight = diagram.title ? 48 : 10;
    const legendWidth = 210;
    const chartWidth = Math.max(220, bounds.width - legendWidth - 40);
    const chartHeight = Math.max(220, bounds.height - titleHeight - 20);
    const radius = Math.max(90, Math.min(chartWidth, chartHeight) / 2 - 14);
    const centerX = bounds.x + 28 + chartWidth / 2;
    const centerY = bounds.y + titleHeight + chartHeight / 2;
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    let rotation = -90;

    const handleSelect = (e: any) => {
        dispatch(elementSelectedAction({
            element,
            shiftKey: e.evt.shiftKey,
            ctrlKey: e.evt.ctrlKey
        }));
    };

    return (
        <Group onClick={handleSelect} onTap={handleSelect}>
            <Rect
                {...bounds}
                fill={appLayout.darkMode ? "#161B22" : "#FFFFFF"}
                stroke={isSelected ? "#2563EB" : "transparent"}
                strokeWidth={isSelected ? 2 : 0}
                cornerRadius={6}
                listening
            />
            {diagram.title && (
                <Text
                    x={bounds.x}
                    y={bounds.y + 4}
                    width={bounds.width}
                    height={36}
                    text={diagram.title}
                    fontSize={22}
                    fontStyle="bold"
                    align="center"
                    verticalAlign="middle"
                    fill={textColor}
                    listening={false}
                />
            )}
            {hasSlices && slices.map((slice, index) => {
                const angle = slice.value / total * 360;
                const colorSchema = adjustColorSchemaForTheme(colorSchemaList[index % colorSchemaList.length], appLayout.darkMode);
                const wedge = (
                    <Wedge
                        key={`slice-${index}`}
                        x={centerX}
                        y={centerY}
                        radius={radius}
                        angle={angle}
                        rotation={rotation}
                        fill={colorSchema.strokeColor}
                        stroke={appLayout.darkMode ? "#0D1117" : "#FFFFFF"}
                        strokeWidth={2}
                    />
                );
                rotation += angle;
                return wedge;
            })}
            {hasSlices && renderSliceLabels(slices, total, centerX, centerY, radius, diagram.pie.textPosition, diagram.pie.showData, textColor)}
            {hasSlices && renderLegend(slices, total, bounds.x + bounds.width - legendWidth + 10, bounds.y + titleHeight + 20, legendWidth - 20, diagram.pie.showData, mutedTextColor, appLayout.darkMode)}
            {!hasSlices && (
                <Text
                    x={bounds.x}
                    y={bounds.y + bounds.height / 2 - 18}
                    width={bounds.width}
                    height={36}
                    text="No pie slices"
                    fontSize={16}
                    align="center"
                    verticalAlign="middle"
                    fill={mutedTextColor}
                    listening={false}
                />
            )}
        </Group>
    );
};

function renderSliceLabels(
    slices: PieSliceState[],
    total: number,
    centerX: number,
    centerY: number,
    radius: number,
    textPosition: number,
    showData: boolean,
    fill: string
) {
    let rotation = -90;
    return slices.map((slice, index) => {
        const angle = slice.value / total * 360;
        const midAngle = rotation + angle / 2;
        const radians = midAngle * Math.PI / 180;
        const labelRadius = radius * textPosition;
        const x = centerX + Math.cos(radians) * labelRadius;
        const y = centerY + Math.sin(radians) * labelRadius;
        rotation += angle;

        return (
            <Text
                key={`label-${index}`}
                x={x - 55}
                y={y - 12}
                width={110}
                height={24}
                text={showData ? `${slice.label}\n${formatPieValue(slice.value)}` : slice.label}
                fontSize={11}
                align="center"
                verticalAlign="middle"
                fill={fill}
                listening={false}
            />
        );
    });
}

function renderLegend(
    slices: PieSliceState[],
    total: number,
    x: number,
    y: number,
    width: number,
    showData: boolean,
    fill: string,
    darkMode: boolean
) {
    return slices.map((slice, index) => {
        const colorSchema = adjustColorSchemaForTheme(colorSchemaList[index % colorSchemaList.length], darkMode);
        const rowY = y + index * 28;
        const percent = total > 0 ? slice.value / total * 100 : 0;
        const text = showData
            ? `${slice.label}: ${formatPieValue(slice.value)} (${formatPieValue(percent)}%)`
            : slice.label;

        return (
            <Group key={`legend-${index}`}>
                <Rect
                    x={x}
                    y={rowY + 5}
                    width={14}
                    height={14}
                    fill={colorSchema.strokeColor}
                    cornerRadius={2}
                    listening={false}
                />
                <Text
                    x={x + 22}
                    y={rowY}
                    width={width - 22}
                    height={24}
                    text={text}
                    fontSize={12}
                    fill={fill}
                    verticalAlign="middle"
                    listening={false}
                />
            </Group>
        );
    });
}
