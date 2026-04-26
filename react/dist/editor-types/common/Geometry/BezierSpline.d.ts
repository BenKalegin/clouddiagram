import { Coordinate } from "../model";
export declare class BezierSpline {
    /**
     * Gets open-ended Bezier Spline Control Points.
     * Calculates the control points needed to create a smooth Bezier spline through given knot points.
     * These control points ensure continuous first and second derivatives at junction points,
     * resulting in a visually smooth curve that passes through all knot points.
     *
     * @param {Coordinate[]} knots - Input Bezier spline knot points
     * @returns Object containing arrays of firstControlPoints and secondControlPoints, each of length (knots.length - 1)
     * @throws {Error} If knots parameter is null or contains fewer than 2 points
     */
    static GetCurveControlPoints(knots: Coordinate[]): {
        firstControlPoints: {
            x: number;
            y: number;
        }[];
        secondControlPoints: {
            x: number;
            y: number;
        }[];
    };
    static GetFirstControlPoints: (rhs: Array<number>) => number[];
}
//# sourceMappingURL=BezierSpline.d.ts.map