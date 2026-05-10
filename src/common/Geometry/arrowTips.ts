import {Coordinate} from "../model";
import {TipStyle} from "../../package/packageModel";

export function drawTip(pointTo: Coordinate, size: Coordinate, sourceAngle: number, tipStyle: TipStyle): string {
    switch (tipStyle) {
        case TipStyle.Arrow:
            return drawArrowTip(pointTo, size, sourceAngle);

        case TipStyle.Triangle:
            return drawTriangleTip(pointTo, size, sourceAngle);

        case TipStyle.Diamond:
            return drawDiamondTip(pointTo, size, sourceAngle);
        default:
            return "";
    }
}

const PI2 = Math.PI * 2;

function drawArrowTip(pointTo: Coordinate, size: Coordinate, sourceAngle: number): string {
    // Angle offset for tip sides (determines tip width)
    const TIP_ANGLE_OFFSET = Math.PI * 0.85; // ~153 degrees

    // Normalize angle to 0-2π range
    const radians = (sourceAngle + PI2) % PI2;

    // Calculate the two points that form the arrow
    const leftPoint = {
        x: pointTo.x + size.x * Math.cos(radians + TIP_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians + TIP_ANGLE_OFFSET)
    };

    const rightPoint = {
        x: pointTo.x + size.x * Math.cos(radians - TIP_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians - TIP_ANGLE_OFFSET)
    };

    return `M ${pointTo.x} ${pointTo.y} 
            L ${leftPoint.x} ${leftPoint.y}
            M ${pointTo.x} ${pointTo.y}
            L ${rightPoint.x} ${rightPoint.y}`;
}


function drawDiamondTip(pointTo: Coordinate, size: Coordinate, sourceAngle: number): string {
    // Angle offset for the side points of the diamond
    const SIDE_ANGLE_OFFSET = Math.PI * 0.75; // ~153 degrees
    // Distance for the center point of the diamond
    const CENTER_DISTANCE = Math.sqrt(size.x * size.x + size.y * size.y);

    // Normalize angle to 0-2π range
    const radians = (sourceAngle + PI2) % PI2;

    // Calculate the center point of the diamond
    const centerPoint = {
        x: pointTo.x - CENTER_DISTANCE * Math.cos(radians),
        y: pointTo.y - CENTER_DISTANCE * Math.sin(radians)
    };

    // Calculate the side points of the diamond
    const leftPoint = {
        x: pointTo.x + size.x * Math.cos(radians + SIDE_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians + SIDE_ANGLE_OFFSET)
    };

    const rightPoint = {
        x: pointTo.x + size.x * Math.cos(radians - SIDE_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians - SIDE_ANGLE_OFFSET)
    };

    return `M ${pointTo.x} ${pointTo.y}
            L ${leftPoint.x} ${leftPoint.y}
            L ${centerPoint.x} ${centerPoint.y}
            L ${rightPoint.x} ${rightPoint.y}
            L ${pointTo.x} ${pointTo.y} Z`;
}

function drawTriangleTip(pointTo: Coordinate, size: Coordinate, sourceAngle: number): string {
    // Angle offset for tip sides (determines tip width)
    const TRIANGLE_ANGLE_OFFSET = Math.PI * 0.85; // ~153 degrees

    // Normalize angle to 0-2π range
    const radians = (sourceAngle + PI2) % PI2;

    // Calculate the points that form the triangle
    const leftPoint = {
        x: pointTo.x + size.x * Math.cos(radians + TRIANGLE_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians + TRIANGLE_ANGLE_OFFSET)
    };

    const rightPoint = {
        x: pointTo.x + size.x * Math.cos(radians - TRIANGLE_ANGLE_OFFSET),
        y: pointTo.y + size.y * Math.sin(radians - TRIANGLE_ANGLE_OFFSET)
    };

    return `M ${pointTo.x} ${pointTo.y}
            L ${leftPoint.x} ${leftPoint.y}
            L ${rightPoint.x} ${rightPoint.y}
            L ${pointTo.x} ${pointTo.y} Z`;
}


