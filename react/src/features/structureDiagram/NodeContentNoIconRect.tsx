import React, {FC, useContext} from "react";
import {Line, Rect, Text} from "react-konva";
import {NodeContentProps} from "./NodeContentProps";
import {AppLayoutContext} from "../../editor/editorLayout";
import {
    adjustColorSchemaForTheme,
} from "../../common/colors/colorTransform";
import {ClassMemberKind, ColorSchema, FlowchartNodeKind, NodeState} from "../../package/packageModel";
import {Bounds} from "../../common/model";
import {formatErAttribute, getErEntityDisplayName} from "../erDiagram/erDiagramUtils";

export const NodeContentNoIconRect: FC<NodeContentProps> = ({
      node,
      placement,
      shadowEnabled
  }) => {

    const { appLayout } = useContext(AppLayoutContext);
    const colorSchema = adjustColorSchemaForTheme(node.colorSchema, appLayout.darkMode);
    const kind = node.flowchartKind ?? FlowchartNodeKind.Process;

    const isDecision = kind === FlowchartNodeKind.Decision;
    const isInputOutput = kind === FlowchartNodeKind.InputOutput;
    const isTerminator = kind === FlowchartNodeKind.Terminator;
    const isC4 = kind === FlowchartNodeKind.C4Person
        || kind === FlowchartNodeKind.C4System
        || kind === FlowchartNodeKind.C4Container
        || kind === FlowchartNodeKind.C4Component;
    const shouldRenderClassCompartments = !isDecision
        && !isInputOutput
        && !isTerminator
        && !isC4
        && ((node.classMembers?.length ?? 0) > 0 || !!node.classAnnotation);

    if (node.erEntity) {
        return renderErEntityNode(node, placement.bounds, colorSchema, shadowEnabled);
    }

    if (shouldRenderClassCompartments) {
        return renderClassNode(node, placement.bounds, colorSchema, shadowEnabled);
    }

    const shape = (() => {
        if (isDecision) {
            const {x, y, width, height} = placement.bounds;
            const cx = x + width / 2;
            const cy = y + height / 2;
            return (
                <Line
                    points={[cx, y, x + width, cy, cx, y + height, x, cy]}
                    closed
                    fill={colorSchema.fillColor}
                    stroke={colorSchema.strokeColor}
                    shadowEnabled={shadowEnabled}
                    shadowColor={"black"}
                    shadowBlur={3}
                    shadowOffset={{x: 2, y: 2}}
                    shadowOpacity={0.4}
                    listening={false}
                />
            );
        }

        if (isInputOutput) {
            const {x, y, width, height} = placement.bounds;
            const skew = Math.min(width * 0.18, 22);
            return (
                <Line
                    points={[x + skew, y, x + width, y, x + width - skew, y + height, x, y + height]}
                    closed
                    fill={colorSchema.fillColor}
                    stroke={colorSchema.strokeColor}
                    shadowEnabled={shadowEnabled}
                    shadowColor={"black"}
                    shadowBlur={3}
                    shadowOffset={{x: 2, y: 2}}
                    shadowOpacity={0.4}
                    listening={false}
                />
            );
        }

        return (
            <Rect
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                {...placement.bounds}
                cornerRadius={isTerminator ? 26 : (isC4 ? 10 : 4)}
                dash={isC4 ? [6, 3] : undefined}
                shadowEnabled={shadowEnabled}
                shadowColor={"black"}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                draggable={false}
                listening={false}
            />
        );
    })();

    return (
        <>
            {shape}

            <Text
                {...placement.bounds}
                fill={colorSchema.textColor}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={node.text}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
        </>
    );
};

function renderClassNode(node: NodeState, bounds: Bounds, colorSchema: ColorSchema, shadowEnabled: boolean) {
    const fields = (node.classMembers ?? []).filter(member => member.kind === "field");
    const methods = (node.classMembers ?? []).filter(member => member.kind === "method");
    const {x, y, width, height} = bounds;
    const headerHeight = node.classAnnotation ? 46 : 32;
    const rowHeight = 18;
    const sectionPadding = 6;
    const fieldsHeight = fields.length > 0 ? fields.length * rowHeight + sectionPadding * 2 : 0;
    const methodsHeight = methods.length > 0 ? methods.length * rowHeight + sectionPadding * 2 : 0;
    const methodsY = y + headerHeight + fieldsHeight;

    return (
        <>
            <Rect
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                {...bounds}
                cornerRadius={4}
                shadowEnabled={shadowEnabled}
                shadowColor={"black"}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                draggable={false}
                listening={false}
            />
            {(fields.length > 0 || methods.length > 0) && (
                <Line
                    points={[x, y + headerHeight, x + width, y + headerHeight]}
                    stroke={colorSchema.strokeColor}
                    listening={false}
                />
            )}
            {fields.length > 0 && methods.length > 0 && (
                <Line
                    points={[x, methodsY, x + width, methodsY]}
                    stroke={colorSchema.strokeColor}
                    listening={false}
                />
            )}
            <Text
                x={x + 8}
                y={y + 5}
                width={width - 16}
                height={headerHeight - 10}
                fill={colorSchema.textColor}
                fontSize={node.classAnnotation ? 13 : 14}
                fontStyle={"bold"}
                align={"center"}
                verticalAlign={"middle"}
                text={node.classAnnotation ? `<<${node.classAnnotation}>>\n${node.text}` : node.text}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
            {renderMembers(fields.map(member => member.text), "field", x, y + headerHeight, width, fieldsHeight, colorSchema.textColor)}
            {renderMembers(methods.map(member => member.text), "method", x, methodsY, width, Math.max(height - (methodsY - y), methodsHeight), colorSchema.textColor)}
        </>
    );
}

function renderMembers(
    members: string[],
    kind: ClassMemberKind,
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string | undefined
) {
    if (members.length === 0) return undefined;

    return (
        <Text
            x={x + 10}
            y={y + 6}
            width={width - 20}
            height={Math.max(0, height - 12)}
            fill={fill}
            fontSize={13}
            align={"left"}
            verticalAlign={"top"}
            text={members.join("\n")}
            draggable={false}
            listening={false}
            preventDefault={true}
            name={kind}
        />
    );
}

function renderErEntityNode(node: NodeState, bounds: Bounds, colorSchema: ColorSchema, shadowEnabled: boolean) {
    const entity = node.erEntity!;
    const attributes = entity.attributes.filter(attribute => attribute.type || attribute.name);
    const {x, y, width, height} = bounds;
    const headerHeight = 38;
    const attributesText = attributes.map(attribute => formatErAttribute(attribute)).join("\n");

    return (
        <>
            <Rect
                fill={colorSchema.fillColor}
                stroke={colorSchema.strokeColor}
                {...bounds}
                cornerRadius={4}
                shadowEnabled={shadowEnabled}
                shadowColor={"black"}
                shadowBlur={3}
                shadowOffset={{x: 2, y: 2}}
                shadowOpacity={0.4}
                draggable={false}
                listening={false}
            />
            <Line
                points={[x, y + headerHeight, x + width, y + headerHeight]}
                stroke={colorSchema.strokeColor}
                listening={false}
            />
            <Text
                x={x + 8}
                y={y + 5}
                width={width - 16}
                height={headerHeight - 10}
                fill={colorSchema.textColor}
                fontSize={14}
                fontStyle={"bold"}
                align={"center"}
                verticalAlign={"middle"}
                text={getErEntityDisplayName(entity)}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
            <Text
                x={x + 10}
                y={y + headerHeight + 6}
                width={width - 20}
                height={Math.max(0, height - headerHeight - 12)}
                fill={colorSchema.textColor}
                fontSize={12}
                align={"left"}
                verticalAlign={"top"}
                text={attributesText}
                draggable={false}
                listening={false}
                preventDefault={true}
            />
        </>
    );
}
