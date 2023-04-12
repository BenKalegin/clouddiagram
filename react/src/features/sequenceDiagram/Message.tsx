import {Arrow, Group, Text} from "react-konva";
import {useRecoilValue} from "recoil";
import {ElementRef, ElementType, Id} from "../../package/packageModel";
import {messageRenderSelector, messageSelector} from "./sequenceDiagramModel";
import {DiagramId, selectedRefsSelector} from "../diagramEditor/diagramEditorModel";
import {Scaffold} from "../scaffold/Scaffold";
import React from "react";
import {elementSelectedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {Bounds} from "../../common/model";
import Konva from "konva";
import {Shape} from "konva/lib/Shape";
import Context = Konva.Context;
import ShapeConfig = Konva.ShapeConfig;

export const Message = ({messageId, diagramId}: {messageId: Id, diagramId: DiagramId  }) => {
    const render = useRecoilValue(messageRenderSelector({messageId, diagramId}))
    const message = useRecoilValue(messageSelector({messageId, diagramId}))
    const textWidth = 40;
    const textHeight = 20;
    const textShiftUp = textHeight + 2;

    const textBounds: Bounds = {
        x: render.bounds.x + render.bounds.width / 2 - textWidth / 2,
        y: render.bounds.y - textShiftUp,
        width: textWidth, height: textHeight}

    const selectedElements = useRecoilValue(selectedRefsSelector(diagramId))
    const isSelected = selectedElements.map(e => e.id).includes(messageId);
    const isFocused = selectedElements.length > 0 && selectedElements.at(-1)?.id === messageId;
    const dispatch = useDispatch()

    const dash = message.isReturn ? [5, 4] : undefined;

    const pointerLength = 11;
    const pointerWidth = 8;
    const pointerAtEnding = true;
    const pointerAtBeginning = false;

    const overrideSceneFunc = (context: Context, shape: Shape<ShapeConfig>) => {
        drawLine(context, shape, render.points, undefined, false, false)
        drawTip(context, shape, message.isAsync);
    };

    return (
        <Group>
            <Arrow
                sceneFunc={overrideSceneFunc}
                fill={message.isAsync ? undefined : message.lineStyle.fillColor}
                stroke={message.lineStyle.strokeColor}
                dash={dash}
                strokeWidth={message.lineStyle.width}
                pointerLength={pointerLength}
                pointerWidth={pointerWidth}
                tension={undefined}
                closed={!message.isAsync}
                pointerAtBeginning={false}
                pointerAtEnding={pointerAtEnding}
                hitStrokeWidth={10}
                x={render.bounds.x}
                y={render.bounds.y}
                points={render.points}
                onClick={(e) => {
                    const element: ElementRef = {id: messageId, type: ElementType.SequenceMessage}
                    dispatch(elementSelectedAction({element, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
                }}

            />
            <Text
                {...textBounds}
                fontSize={14}
                align={"center"}
                verticalAlign={"middle"}
                text={message.text}
                draggable={false}
                listening={false}
                preventDefault={true}
                visible={!!message.text}
            />
            {isSelected && <Scaffold
                element={{id: messageId, type: ElementType.SequenceMessage}}
                bounds={render.bounds}
                excludeDiagonalResize={true}
                excludeVerticalResize={true}
                isFocused={isFocused}
                isLinking={false}
                linkingDrawing={undefined}
            />}
        </Group>

    )

    function drawTip(ctx: Context, shape: Shape<ShapeConfig>, isAsync: boolean) {
        const PI2 = Math.PI * 2;

        const points = render.points;
        const length = isAsync ? pointerLength : pointerLength * 0.8;

        const n = points.length;

        let dx, dy;

        dx = points[n - 2] - points[n - 4];
        dy = points[n - 1] - points[n - 3];

        const radians = (Math.atan2(dy, dx) + PI2) % PI2;

        const width = pointerWidth;

        if (pointerAtEnding) {
            ctx.save();
            ctx.beginPath();
            ctx.translate(points[n - 2], points[n - 1]);
            ctx.rotate(radians);
            // lower tick
            ctx.moveTo(0, 0);
            ctx.lineTo(-length, width / 2);
            // upper tick
            ctx.moveTo(0, 0);
            ctx.lineTo(-length, -width / 2);

            if (!isAsync) {
                ctx.lineTo(-length, width / 2);
                ctx.closePath();
            }

            ctx.restore();
            if (isAsync)
                ctx.strokeShape(shape);
            else
                ctx.fillStrokeShape(shape);
        }

        if (pointerAtBeginning) {
            ctx.save();
            ctx.beginPath();
            ctx.translate(points[0], points[1]);
            dx = points[2] - points[0];
            dy = points[3] - points[1];

            ctx.rotate((Math.atan2(-dy, -dx) + PI2) % PI2);
            ctx.moveTo(0, 0);
            ctx.lineTo(-length, width / 2);
            ctx.lineTo(-length, -width / 2);
            ctx.closePath();
            ctx.restore();
            ctx.fillStrokeShape(shape);
        }
    }

    function getControlPoints(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, t: number) {
        const d01 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2)),
            d12 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)),
            fa = (t * d01) / (d01 + d12),
            fb = (t * d12) / (d01 + d12),
            p1x = x1 - fa * (x2 - x0),
            p1y = y1 - fa * (y2 - y0),
            p2x = x1 + fb * (x2 - x0),
            p2y = y1 + fb * (y2 - y0);

        return [p1x, p1y, p2x, p2y];
    }

    function expandPoints(p: number[], tension: number) {
        const len = p.length, allPoints = [];
        let n,
            cp;

        for (n = 2; n < len - 2; n += 2) {
            cp = getControlPoints(
                p[n - 2],
                p[n - 1],
                p[n],
                p[n + 1],
                p[n + 2],
                p[n + 3],
                tension
            );
            if (isNaN(cp[0])) {
                continue;
            }
            allPoints.push(cp[0]);
            allPoints.push(cp[1]);
            allPoints.push(p[n]);
            allPoints.push(p[n + 1]);
            allPoints.push(cp[2]);
            allPoints.push(cp[3]);
        }

        return allPoints;
    }

    function getTensionPointsClosed(points: number[], tension: number | undefined) {
        const p = points,
            len = p.length,
            firstControlPoints = getControlPoints(
                p[len - 2],
                p[len - 1],
                p[0],
                p[1],
                p[2],
                p[3],
                tension || 0
            ),
            lastControlPoints = getControlPoints(
                p[len - 4],
                p[len - 3],
                p[len - 2],
                p[len - 1],
                p[0],
                p[1],
                tension || 0
            ),
            middle = expandPoints(p, tension || 0);
        return [firstControlPoints[2], firstControlPoints[3]]
            .concat(middle)
            .concat([
                lastControlPoints[0],
                lastControlPoints[1],
                p[len - 2],
                p[len - 1],
                lastControlPoints[2],
                lastControlPoints[3],
                firstControlPoints[0],
                firstControlPoints[1],
                p[0],
                p[1],
            ]);
    }

    function getTensionPoints(points: number[], closed: boolean, tension: number | undefined) {
        if (closed) {
            return getTensionPointsClosed(points, tension);
        } else {
            return expandPoints(points, tension || 0)
        }
    }

    function drawLine(ctx: Konva.Context, shape: Shape<Konva.ShapeConfig>, points: number[], tension: number | undefined, closed: boolean, bezier: boolean) {
        const length = points.length;
        let tp, len, n;

        if (!length) {
            return;
        }

        ctx.beginPath();
        ctx.moveTo(points[0], points[1]);

        // tension
        if (tension !== 0 && length > 4) {
            tp = getTensionPoints(points, closed, tension);
            len = tp.length;
            n = closed ? 0 : 4;

            if (!closed) {
                ctx.quadraticCurveTo(tp[0], tp[1], tp[2], tp[3]);
            }

            while (n < len - 2) {
                ctx.bezierCurveTo(
                    tp[n++],
                    tp[n++],
                    tp[n++],
                    tp[n++],
                    tp[n++],
                    tp[n++]
                );
            }

            if (!closed) {
                ctx.quadraticCurveTo(
                    tp[len - 2],
                    tp[len - 1],
                    points[length - 2],
                    points[length - 1]
                );
            }
        } else if (bezier) {
            // no tension but bezier
            n = 2;

            while (n < length) {
                ctx.bezierCurveTo(
                    points[n++],
                    points[n++],
                    points[n++],
                    points[n++],
                    points[n++],
                    points[n++]
                );
            }
        } else {
            // no tension
            for (n = 2; n < length; n += 2) {
                ctx.lineTo(points[n], points[n + 1]);
            }
        }

        // closed e.g. polygons and blobs
        if (closed) {
            ctx.closePath();
            ctx.fillStrokeShape(shape)
        } else {
            // open e.g. lines and splines
            ctx.strokeShape(shape);
        }
    }
}
