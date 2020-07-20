module Five {
    //  Defines an object that contains the constraints about how to connect one side of an edge to its terminal.
    export class ConnectionConstraint {
        constructor(point?: Point, perimeter: boolean = true) {
            /// <summary>Constructs a new connection constraint for the given point and boolean</summary>
            /// <param name="point">Optional Point that specifies the fixed location of the point in relative coordinates.</param>
            /// <param name="perimeter">Optional boolean that specifies if the fixed point should be projected onto the perimeter of the terminal.</param>
            this.point = point;
            this.perimeter = perimeter;
        }

        point: Point = null;

        // Boolean that specifies if the point should be projected onto the perimeter of the terminal.
        perimeter: boolean = null;
    }
}