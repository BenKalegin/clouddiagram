import React from "react";
import {Rect} from "react-konva";
import {Bounds} from "./Models";
import {enumKeys} from "../Common/EnumUtils";

export interface ScaffoldProps {
    bounds: Bounds;
    resizeEnabled?: boolean;
    borderEnabled?: boolean;
    borderStroke?: string;
    borderStrokeWidth?: number;
    borderDash?: Array<number>;
    anchorFill?: string;
    anchorStroke?: string;
    anchorStrokeWidth?: number;
    anchorSize?: number;
    anchorCornerRadius?: number;
    keepRatio?: boolean;
    centeredScaling?: boolean;
    enabledAnchors?: Array<string>;
    flipEnabled?: boolean;
    ignoreStroke?: boolean;
    useSingleNodeRotation?: boolean;
    shouldOverdrawWholeArea?: boolean;
    isFocused?: boolean;
}

enum ResizeHandleDirection {
    North = 'n',
    NorthEast = 'ne',
    NorthWest = 'nw',
    South = 's',
    SouthEast = 'se',
    SouthWest = 'sw',
    East = 'e',
    West = 'w'
}

//const TOUCH_DEVICE = 'ontouchstart' in Konva._global;


export interface FocusFrameProps {
    bounds: Bounds;
}

const FocusFrame = (props: FocusFrameProps) => {
    return (
        <Rect
            x={props.bounds.x}
            y={props.bounds.y}
            width={props.bounds.width}
            height={props.bounds.height}
            fill={"transparent"}
            stroke={"blue"}
            strokeWidth={1.4}
            cornerRadius={10}>
        </Rect>
    );
};

export interface BackgroundProps {
    bounds: Bounds;
}

const Background = (props: BackgroundProps) => {
    return (
        <Rect
            x={props.bounds.x}
            y={props.bounds.y}
            width={props.bounds.width}
            height={props.bounds.height}
            fill={"transparent"}
            stroke={""}
            strokeWidth={0}
        />
    );
};

export interface ResizeHandleProps {
    cursor: string;
    bounds: Bounds;
    direction: ResizeHandleDirection;
}

const ResizeHandle = (props: ResizeHandleProps) => {
    return (
        <Rect
            x={props.bounds.x}
            y={props.bounds.y}
            width={props.bounds.width}
            height={props.bounds.height}
            stroke={"gray"}
            fill={"white"}
            strokeWidth={1}
            name={"rh" + props.direction}
            dragDistance={0}
            cursor={props.cursor}
            // make it draggable,
            // so activating the anchor will not start drag&drop of any parent
            draggable={true}
            // hitStrokeWidth = {TOUCH_DEVICE ? 10 : 'auto'},
        />
    );
}

const resizeHandleBounds = (direction: ResizeHandleDirection, bounds: Bounds): Bounds => {
    const width = 10;
    const height = 10;

    switch (direction) {
        case ResizeHandleDirection.North:
            return {x: bounds.x + (bounds.width- width/2), y: bounds.y, width: width, height: height};
        case ResizeHandleDirection.NorthEast:
            return {x: bounds.x + bounds.width - width/2, y: bounds.y, width: width, height: height};
        case ResizeHandleDirection.NorthWest:
            return {x: bounds.x, y: bounds.y, width: width, height: height};
        case ResizeHandleDirection.South:
            return {x: bounds.x + (bounds.width- width/2), y: bounds.y + bounds.height - height/2, width: width, height: height};
        case ResizeHandleDirection.SouthEast:
            return {x: bounds.x + bounds.width - width/2, y: bounds.y + bounds.height - height/2, width: width, height: height};
        case ResizeHandleDirection.SouthWest:
            return {x: bounds.x, y: bounds.y + bounds.height - height/2, width: width, height: height};
        case ResizeHandleDirection.East:
            return {x: bounds.x + bounds.width - width/2, y: bounds.y + (bounds.height - height/2), width: width, height: height};
        case ResizeHandleDirection.West:
            return {x: bounds.x, y: bounds.y + (bounds.height - height/2), width: width, height: height};
    }
}

const resizeHandleCursor = (direction: ResizeHandleDirection): string => {
    switch (direction) {
        case ResizeHandleDirection.North:
            return "ns-resize";
        case ResizeHandleDirection.NorthEast:
            // noinspection SpellCheckingInspection
            return "nesw-resize";
        case ResizeHandleDirection.NorthWest:
            // noinspection SpellCheckingInspection
            return "nwse-resize";
        case ResizeHandleDirection.South:
            return "ns-resize";
        case ResizeHandleDirection.SouthEast:
            // noinspection SpellCheckingInspection
            return "nwse-resize";
        case ResizeHandleDirection.SouthWest:
            // noinspection SpellCheckingInspection
            return "nesw-resize";
        case ResizeHandleDirection.East:
            return "ew-resize";
        case ResizeHandleDirection.West:
            return "ew-resize";
    }
}

export const Scaffold = (props: ScaffoldProps) => {
    return (
        <React.Fragment>
            <Background
                bounds={props.bounds}
            />
            {enumKeys(ResizeHandleDirection).map((direction, index) =>
                <ResizeHandle
                    key={index}
                    bounds={resizeHandleBounds(ResizeHandleDirection[direction], props.bounds)}
                    cursor={resizeHandleCursor(ResizeHandleDirection[direction])}
                    direction={ResizeHandleDirection[direction]}
                />
            )}
            {props.isFocused && <FocusFrame
                bounds={props.bounds}
            />}
        </React.Fragment>
    )
}

/*
    private createHandles() {
        if (this.config.isFocused)
            this.createFocusFrame();

        HANDLE_NAMES.forEach(name => this.createAnchor(name));

    }
*/



/*

*/

        // const self = this;
        // anchor.on('mousedown touchstart', function (e) {
        //     self._handleMouseDown(e);
        // });
        // anchor.on('dragstart', (e) => {
        //     anchor.stopDrag();
        //     e.cancelBubble = true;
        // });
        // anchor.on('dragend', (e) => {
        //     e.cancelBubble = true;
        // });

        // add hover styling
        // anchor.on('mouseenter', () => {
        //     const rad = Konva.getAngle(this.rotation());
        //     const cursor = this.getCursor(name, rad);
        //     anchor?.getStage()?.content.style.cursor = cursor;
        //     this._cursorChange = true;
        // });
        // anchor.on('mouseout', () => {
        //     anchor.getStage().content &&
        //     (anchor.getStage().content.style.cursor = '');
        //     this._cursorChange = false;
        // });
        // this.add(anchor);
    // }
    // private getCursor(anchorName: string, rad: number) {
    //     var angle = ((Util.radToDeg(rad) % 360) + 360) % 360;
    //
    //     if (Util._inRange(angle, 315 + 22.5, 360) || Util._inRange(angle, 0, 22.5)) {
    //         // TOP
    //         return 'ns-resize';
    //     } else if (Util._inRange(angle, 45 - 22.5, 45 + 22.5)) {
    //         // TOP - RIGHT
    //         return 'nesw-resize';
    //     } else if (Util._inRange(angle, 90 - 22.5, 90 + 22.5)) {
    //         // RIGHT
    //         return 'ew-resize';
    //     } else if (Util._inRange(angle, 135 - 22.5, 135 + 22.5)) {
    //         // BOTTOM - RIGHT
    //         return 'nwse-resize';
    //     } else if (Util._inRange(angle, 180 - 22.5, 180 + 22.5)) {
    //         // BOTTOM
    //         return 'ns-resize';
    //     } else if (Util._inRange(angle, 225 - 22.5, 225 + 22.5)) {
    //         // BOTTOM - LEFT
    //         return 'nesw-resize';
    //     } else if (Util._inRange(angle, 270 - 22.5, 270 + 22.5)) {
    //         // RIGHT
    //         return 'ew-resize';
    //     } else if (Util._inRange(angle, 315 - 22.5, 315 + 22.5)) {
    //         // BOTTOM - RIGHT
    //         return 'nwse-resize';
    //     } else {
    //         // how can we can there?
    //         Util.error('Transformer has unknown angle for cursor detection: ' + angle);
    //         return 'pointer';
    //     }
    // }
    //
    // _handleMouseDown(e) {
    //     this._movingAnchorName = e.target.name().split(' ')[0];
    //
    //     var attrs = this._getNodeRect();
    //     var width = attrs.width;
    //     var height = attrs.height;
    //
    //     var hypotenuse = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
    //     this.sin = Math.abs(height / hypotenuse);
    //     this.cos = Math.abs(width / hypotenuse);
    //
    //     if (typeof window !== 'undefined') {
    //         window.addEventListener('mousemove', this._handleMouseMove);
    //         window.addEventListener('touchmove', this._handleMouseMove);
    //         window.addEventListener('mouseup', this._handleMouseUp, true);
    //         window.addEventListener('touchend', this._handleMouseUp, true);
    //     }
    //
    //     this._transforming = true;
    //     var ap = e.target.getAbsolutePosition();
    //     var pos = e.target.getStage().getPointerPosition();
    //     this._anchorDragOffset = {
    //         x: pos.x - ap.x,
    //         y: pos.y - ap.y,
    //     };
    //     this._fire('transformstart', { evt: e.evt, target: this.getNode() });
    //     this._nodes.forEach((target) => {
    //         target._fire('transformstart', { evt: e.evt, target });
    //     });
    // }
    // _handleMouseMove(e) {
    //     var x, y, newHypotenuse;
    //     var anchorNode = this.findOne('.' + this._movingAnchorName);
    //     var stage = anchorNode.getStage();
    //
    //     stage.setPointersPositions(e);
    //
    //     const pp = stage.getPointerPosition();
    //     let newNodePos = {
    //         x: pp.x - this._anchorDragOffset.x,
    //         y: pp.y - this._anchorDragOffset.y,
    //     };
    //     const oldAbs = anchorNode.getAbsolutePosition();
    //
    //     if (this.anchorDragBoundFunc()) {
    //         newNodePos = this.anchorDragBoundFunc()(oldAbs, newNodePos, e);
    //     }
    //     anchorNode.setAbsolutePosition(newNodePos);
    //     const newAbs = anchorNode.getAbsolutePosition();
    //
    //     // console.log(oldAbs, newNodePos, newAbs);
    //
    //     if (oldAbs.x === newAbs.x && oldAbs.y === newAbs.y) {
    //         return;
    //     }
    //
    //     // rotater is working very differently, so do it first
    //     if (this._movingAnchorName === 'rotater') {
    //         var attrs = this._getNodeRect();
    //         x = anchorNode.x() - attrs.width / 2;
    //         y = -anchorNode.y() + attrs.height / 2;
    //
    //         // hor angle is changed?
    //         let delta = Math.atan2(-y, x) + Math.PI / 2;
    //
    //         if (attrs.height < 0) {
    //             delta -= Math.PI;
    //         }
    //
    //         var oldRotation = Konva.getAngle(this.rotation());
    //         const newRotation = oldRotation + delta;
    //
    //         const tol = Konva.getAngle(this.rotationSnapTolerance());
    //         const snappedRot = getSnap(this.rotationSnaps(), newRotation, tol);
    //
    //         const diff = snappedRot - attrs.rotation;
    //
    //         const shape = rotateAroundCenter(attrs, diff);
    //         this._fitNodesInto(shape, e);
    //         return;
    //     }
    //
    //     var keepProportion = this.keepRatio() || e.shiftKey;
    //     var centeredScaling = this.centeredScaling() || e.altKey;
    //
    //     if (this._movingAnchorName === 'top-left') {
    //         if (keepProportion) {
    //             var comparePoint = centeredScaling
    //                 ? {
    //                     x: this.width() / 2,
    //                     y: this.height() / 2,
    //                 }
    //                 : {
    //                     x: this.findOne('.bottom-right').x(),
    //                     y: this.findOne('.bottom-right').y(),
    //                 };
    //             newHypotenuse = Math.sqrt(
    //                 Math.pow(comparePoint.x - anchorNode.x(), 2) +
    //                 Math.pow(comparePoint.y - anchorNode.y(), 2)
    //             );
    //
    //             var reverseX = this.findOne('.top-left').x() > comparePoint.x ? -1 : 1;
    //
    //             var reverseY = this.findOne('.top-left').y() > comparePoint.y ? -1 : 1;
    //
    //             x = newHypotenuse * this.cos * reverseX;
    //             y = newHypotenuse * this.sin * reverseY;
    //
    //             this.findOne('.top-left').x(comparePoint.x - x);
    //             this.findOne('.top-left').y(comparePoint.y - y);
    //         }
    //     } else if (this._movingAnchorName === 'top-center') {
    //         this.findOne('.top-left').y(anchorNode.y());
    //     } else if (this._movingAnchorName === 'top-right') {
    //         if (keepProportion) {
    //             var comparePoint = centeredScaling
    //                 ? {
    //                     x: this.width() / 2,
    //                     y: this.height() / 2,
    //                 }
    //                 : {
    //                     x: this.findOne('.bottom-left').x(),
    //                     y: this.findOne('.bottom-left').y(),
    //                 };
    //
    //             newHypotenuse = Math.sqrt(
    //                 Math.pow(anchorNode.x() - comparePoint.x, 2) +
    //                 Math.pow(comparePoint.y - anchorNode.y(), 2)
    //             );
    //
    //             var reverseX = this.findOne('.top-right').x() < comparePoint.x ? -1 : 1;
    //
    //             var reverseY = this.findOne('.top-right').y() > comparePoint.y ? -1 : 1;
    //
    //             x = newHypotenuse * this.cos * reverseX;
    //             y = newHypotenuse * this.sin * reverseY;
    //
    //             this.findOne('.top-right').x(comparePoint.x + x);
    //             this.findOne('.top-right').y(comparePoint.y - y);
    //         }
    //         var pos = anchorNode.position();
    //         this.findOne('.top-left').y(pos.y);
    //         this.findOne('.bottom-right').x(pos.x);
    //     } else if (this._movingAnchorName === 'middle-left') {
    //         this.findOne('.top-left').x(anchorNode.x());
    //     } else if (this._movingAnchorName === 'middle-right') {
    //         this.findOne('.bottom-right').x(anchorNode.x());
    //     } else if (this._movingAnchorName === 'bottom-left') {
    //         if (keepProportion) {
    //             var comparePoint = centeredScaling
    //                 ? {
    //                     x: this.width() / 2,
    //                     y: this.height() / 2,
    //                 }
    //                 : {
    //                     x: this.findOne('.top-right').x(),
    //                     y: this.findOne('.top-right').y(),
    //                 };
    //
    //             newHypotenuse = Math.sqrt(
    //                 Math.pow(comparePoint.x - anchorNode.x(), 2) +
    //                 Math.pow(anchorNode.y() - comparePoint.y, 2)
    //             );
    //
    //             var reverseX = comparePoint.x < anchorNode.x() ? -1 : 1;
    //
    //             var reverseY = anchorNode.y() < comparePoint.y ? -1 : 1;
    //
    //             x = newHypotenuse * this.cos * reverseX;
    //             y = newHypotenuse * this.sin * reverseY;
    //
    //             anchorNode.x(comparePoint.x - x);
    //             anchorNode.y(comparePoint.y + y);
    //         }
    //
    //         pos = anchorNode.position();
    //
    //         this.findOne('.top-left').x(pos.x);
    //         this.findOne('.bottom-right').y(pos.y);
    //     } else if (this._movingAnchorName === 'bottom-center') {
    //         this.findOne('.bottom-right').y(anchorNode.y());
    //     } else if (this._movingAnchorName === 'bottom-right') {
    //         if (keepProportion) {
    //             var comparePoint = centeredScaling
    //                 ? {
    //                     x: this.width() / 2,
    //                     y: this.height() / 2,
    //                 }
    //                 : {
    //                     x: this.findOne('.top-left').x(),
    //                     y: this.findOne('.top-left').y(),
    //                 };
    //
    //             newHypotenuse = Math.sqrt(
    //                 Math.pow(anchorNode.x() - comparePoint.x, 2) +
    //                 Math.pow(anchorNode.y() - comparePoint.y, 2)
    //             );
    //
    //             var reverseX =
    //                 this.findOne('.bottom-right').x() < comparePoint.x ? -1 : 1;
    //
    //             var reverseY =
    //                 this.findOne('.bottom-right').y() < comparePoint.y ? -1 : 1;
    //
    //             x = newHypotenuse * this.cos * reverseX;
    //             y = newHypotenuse * this.sin * reverseY;
    //
    //             this.findOne('.bottom-right').x(comparePoint.x + x);
    //             this.findOne('.bottom-right').y(comparePoint.y + y);
    //         }
    //     } else {
    //         console.error(
    //             new Error(
    //                 'Wrong position argument of selection resizer: ' +
    //                 this._movingAnchorName
    //             )
    //         );
    //     }
    //
    //     var centeredScaling = this.centeredScaling() || e.altKey;
    //     if (centeredScaling) {
    //         var topLeft = this.findOne('.top-left');
    //         var bottomRight = this.findOne('.bottom-right');
    //         var topOffsetX = topLeft.x();
    //         var topOffsetY = topLeft.y();
    //
    //         var bottomOffsetX = this.getWidth() - bottomRight.x();
    //         var bottomOffsetY = this.getHeight() - bottomRight.y();
    //
    //         bottomRight.move({
    //             x: -topOffsetX,
    //             y: -topOffsetY,
    //         });
    //
    //         topLeft.move({
    //             x: bottomOffsetX,
    //             y: bottomOffsetY,
    //         });
    //     }
    //
    //     var absPos = this.findOne('.top-left').getAbsolutePosition();
    //
    //     x = absPos.x;
    //     y = absPos.y;
    //
    //     var width =
    //         this.findOne('.bottom-right').x() - this.findOne('.top-left').x();
    //
    //     var height =
    //         this.findOne('.bottom-right').y() - this.findOne('.top-left').y();
    //
    //     this._fitNodesInto(
    //         {
    //             x: x,
    //             y: y,
    //             width: width,
    //             height: height,
    //             rotation: Konva.getAngle(this.rotation()),
    //         },
    //         e
    //     );
    // }
    // _handleMouseUp(e) {
    //     this._removeEvents(e);
    // }

