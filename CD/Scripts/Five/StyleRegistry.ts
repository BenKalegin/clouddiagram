///<reference path="Perimeter.ts"/>
///<reference path="EdgeStyle.ts"/>

module Five {
    // Singleton class that acts as a global converter from string to object values in a style. 
    // This is currently only used to perimeters and edge styles.
    export class StyleRegistry {

        // Maps from strings to objects.
        private static edges: { [kind: number]: IEdgeStyle} = {};
        private static perimeters: { [kind: number]: IPerimeterStyle } = {};

        static addEdge(kind: EdgeKind, style: IEdgeStyle) {
            StyleRegistry.edges[kind] = style;
        }

        static addPerimeter(kind: PerimeterStyle, style: IPerimeterStyle) {
            StyleRegistry.perimeters[kind] = style;
        }

        static getEdge(kind: EdgeKind) : IEdgeStyle {
            return StyleRegistry.edges[kind];
        }

        static getPerimeter(kind: string) : IPerimeterStyle {
            return StyleRegistry.perimeters[kind];
        }
    }

    StyleRegistry.addEdge(EdgeKind.Elbow, EdgeStyle.elbowConnector);
    StyleRegistry.addEdge(EdgeKind.EntityRelation, EdgeStyle.entityRelation);
    StyleRegistry.addEdge(EdgeKind.Loop, EdgeStyle.loop);
    StyleRegistry.addEdge(EdgeKind.Sidetoside, EdgeStyle.sideToSide);
    StyleRegistry.addEdge(EdgeKind.Toptobottom, EdgeStyle.topToBottom);
    StyleRegistry.addEdge(EdgeKind.TopToSide, EdgeStyle.topToSide);
    StyleRegistry.addEdge(EdgeKind.Orthogonal, EdgeStyle.orthConnector);
    StyleRegistry.addEdge(EdgeKind.Segment, EdgeStyle.segmentConnector);

    StyleRegistry.addPerimeter(PerimeterStyle.Ellipse, Perimeter.ellipsePerimeter);
    StyleRegistry.addPerimeter(PerimeterStyle.Rectangle, Perimeter.rectanglePerimeter);
    StyleRegistry.addPerimeter(PerimeterStyle.Rhombus, Perimeter.rhombusPerimeter);
    StyleRegistry.addPerimeter(PerimeterStyle.Triangle, Perimeter.trianglePerimeter);
    StyleRegistry.addPerimeter(PerimeterStyle.Hexagon, Perimeter.hexagonPerimeter);
}