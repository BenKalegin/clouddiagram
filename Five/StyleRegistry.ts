///<reference path="Perimeter.ts"/>
///<reference path="EdgeStyle.ts"/>

module Five {
    // Singleton class that acts as a global converter from string to object values in a style. 
    // This is currently only used to perimeters and edge styles.
    export class StyleRegistry {

        // Maps from strings to objects.
        private static edges: StringDictionary<IEdgeStyle> = new StringDictionary<IEdgeStyle>();
        private static perimeters: StringDictionary<IPerimeterStyle> = new StringDictionary<IPerimeterStyle>();

        static addEdge(name: string, style: IEdgeStyle) {
            StyleRegistry.edges.put(name, style);
        }

        static addPerimeter(name: string, style: IPerimeterStyle) {
            StyleRegistry.perimeters.put(name, style);
        }

        static getEdge(name: string) : IEdgeStyle {
            return StyleRegistry.edges.get(name);
        }

        static getPerimeter(name: string) : IPerimeterStyle {
            return StyleRegistry.perimeters.get(name);
        }
    }

    StyleRegistry.addEdge(Constants.edgestyleElbow, EdgeStyle.elbowConnector);
    StyleRegistry.addEdge(Constants.edgestyleEntityRelation, EdgeStyle.entityRelation);
    StyleRegistry.addEdge(Constants.edgestyleLoop, EdgeStyle.loop);
    StyleRegistry.addEdge(Constants.edgestyleSidetoside, EdgeStyle.sideToSide);
    StyleRegistry.addEdge(Constants.edgestyleToptobottom, EdgeStyle.topToBottom);
    StyleRegistry.addEdge(Constants.edgestyleTopToSide, EdgeStyle.topToSide);
    StyleRegistry.addEdge(Constants.edgestyleOrthogonal, EdgeStyle.orthConnector);
    StyleRegistry.addEdge(Constants.edgestyleSegment, EdgeStyle.segmentConnector);

    StyleRegistry.addPerimeter(Constants.perimeterEllipse, Perimeter.ellipsePerimeter);
    StyleRegistry.addPerimeter(Constants.perimeterRectangle, Perimeter.rectanglePerimeter);
    StyleRegistry.addPerimeter(Constants.perimeterRhombus, Perimeter.rhombusPerimeter);
    StyleRegistry.addPerimeter(Constants.perimeterTriangle, Perimeter.trianglePerimeter);
    StyleRegistry.addPerimeter(Constants.perimeterHexagon, Perimeter.hexagonPerimeter);
}