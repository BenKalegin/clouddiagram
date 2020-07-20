module Five {

    export type Color = string;

    export type Opacity = number; // 0-100

    export enum ElbowStyle {
        Horizontal,
        Vertical
    }

    export interface INodeStyle {
        strokeColor: Color;
        fillColor: Color;
    }

    export interface IStyle extends INodeStyle{
        shape: ShapeStyle;
        perimeter: PerimeterStyle;
        vAlign: VerticalAlign;
        hAlign: HorizontalAlign;
        
        fontColor: Color;
        fontSize: number;
        fontFamily: string;
        fontStyle: FontStyle;
        endArrow: ArrowStyle;
        startArrow: ArrowStyle;
        shadow: boolean;

        /**
         * For edges this determines whether or not joins between edges segments are smoothed to a rounded finish.
         * For vertices that have the rectangle shape, this determines whether or not the rectangle is rounded.
         */
        rounded: boolean;
        autoSize: boolean;
        curved: boolean;
        overflow: Overflow;
        whitespace: Whitespace;
        edge: EdgeKind;
        vLabelPosition: VerticalAlign;
        noLabel: boolean;
        direction: Direction;
        flipH: boolean;
        flipV: boolean;
        stencilFlipH: boolean;
        stencilFlipV: boolean;
        /**
         * swimlane start size
         */
        startSize: number;

        /**
         * Size of the end marker in pixels. 
         */
        endSize: number;

        /**
	     * This style is only exported via ImageExport 
	     */
        startFill: boolean;
        /**
	     * This style is only exported via ImageExport 
	     */
        endFill: boolean;

        portrait: boolean;
        indicatorStrokeColor: Color;
        indicatorDirection: Direction;

        /**
         * Spacing, in pixels, added to each side of a label in a vertex (style applies to vertices only). Default is 0
         */
        spacing: number;

        /**
         * Spacing, in pixels, added to the top side of a label in a vertex (style applies to vertices only). 
         */

        spacingTop: number; /**
         * Spacing, in pixels, added to the right side of a label in a vertex (style applies to vertices only). 
         */

        spacingRight: number; /**
         * Spacing, in pixels, added to the bottom side of a label in a vertex (style applies to vertices only). 
         */

        spacingBottom: number; 
        
        /**
         * Spacing, in pixels, added to the left side of a label in a vertex (style applies to vertices only). Default is 0
         */
        spacingLeft: number; 
        
        /**
         * Label background color. Possible values are all HTML color names or HEX codes. 
         */

        labelBackgroundColor: Color; /**
         * Label border color. Possible values are all HTML color names or HEX codes. 
         */
        LabelBorderColor: string; /**
         * Horizontal label position of vertices. The label align defines the position of the label relative to the cell. 
         * Note this value doesn't affect the positioning of label within the label bounds, to move the label horizontally within the label bounds, use hAlign.
         */
        labelPosition: HorizontalAlign; /**
         * Vertical label position of vertices. The label align defines the position of the label relative to the cell. Note this value
         * doesn't affect the positioning of label within the label bounds, to move the label vertically within the label bounds, use vAlign. 
         */
        verticalLabelPosition: VerticalAlign;

        /**
         * Label padding, ie. the space between the label border and the label. 
         */
        labelPadding: number;

        /**
         * Text opacity range is 0-100. 
         */
        textOpacity: number;

        /**
         * Width of the label if the label position is not center. 
         */
        labelWidth: number;

        /**
         *  Rotation degree. Range is 0-360. 
         */                
        rotation: number;

        /**
         * Image aspect. only for ImageShape. Default is true. 
         */
        preserveImageAspect: boolean;

        /**
         * Image background color. This style is only used in ImageShape. Possible values are all HTML color names or HEX codes. 
         */
        imageBackground: Color;

        /**
         * Image border color. This style is only used in ImageShape. 
         */
        imageBorder: Color;

        /**
         * Possible values are any image URL. This is the path to the image to image that is to be displayed within the label of a vertex.
         * Data URLs should use the following format: data: image / png, xyz where xyz is the base64encoded data(without the "base64" - prefix).
         * Note that Data URLs are only supported in modern browsers.
         */
        image: string;

        /**
         * Specifies if a cell can be moved. Default is true.
         */
        movable: boolean;

        /**
         *  Rounding factor for a rounded rectangle in percent(without the percent sign).Possible values are between 0 and 100. 
         *  If this value is not specified then RECTANGLE_ROUNDING_FACTOR * 100 is used. For edges, this defines the absolute size of rounded corners in pixels.
         * If this values is not specified then LINE_ARCSIZE is used.(This style is only exported via ImageExport.)
         */
        arcSize: number;

        /**
         *  margin between the ellipses in the double ellipse shape. Possible values are all positive numbers. 
         */
        margin: number;

        /**
         * float value for the size of the horizontal segment of the entity relation style.
         */
        segment: number;

        /**
         * direction(s) that edges are allowed to connect to cells in. 
         */
        portConstraint: Direction;

        /**
         *  Define whether port constraint directions are rotated with vertex rotation. 
         * false (default) causes port constraints to remain absolute, relative to the graph, 1 causes the constraints to rotate with the vertex. 
         */
        portConstraintRotation: boolean;
        loop: EdgeKind;

        /**
         *  If this is true then no edge style is applied for a given edge.
         */
        noEdge: boolean;

        /**
         * Gradient color. Possible values are all HTML color names or HEX codes, as well as special keywords such as 'swimlane,
         * 'inherit' or 'indicated' to use the color code of a related cell or the indicator shape. This is ignored if no fill color is defined. 
         */
        gradientColor: Color;

        /**
         * Defines the key for the gradient direction. Default is South. 
         * Generally, gradient painting is done from the value of fillColor to the value of gradientColor. 
         * Taking the example of North, this means fillColor at the bottom of paint pattern and gradientColor at top, with a gradient in-between. 
         */
        gradientDirection: Direction;

        /**
         * Defines the key for the opacity style.The type of the value is numeric and the possible range is 0 - 100. 
         */
        opacity: Opacity;

        /**
         * Possible range is 1+. The value defines the stroke width in pixels. 
         * Note: To hide a * stroke use strokeColor none. 
         */
        strokeWidth: number;

        dashed: boolean;

        /**
         * Glass effect. This is used in Labels.
         */
        glass: boolean;

        /**
         * Default is Horizontal. This defines how the three segment orthogonal edge style leaves its terminal vertices.
         * The vertical style leaves the terminal vertices at the top and bottom sides.
         */
        elbow: ElbowStyle;

        /**
         * Fill color of the swimlane background. Possible values are all HTML color names or HEX codes. Default is no background.
         */
        swimlaneFillColor: Color;

        /**
         * This style specifies whether the line between the title region of a swimlane should be visible. Default is true.
         */
        swimlaneLine: boolean;

        /**
         * This style is only used for swimlane shapes. Default is 'none'
         */
        separatorColor: Color;

        /**
         * The value defines how any image in the vertex label is aligned horizontally within the label bounds of of a LabelShape. 
	     */
        imageAlign: HorizontalAlign;

        /**
	     * The value defines how any image in the vertex label is aligned vertically within the label bounds of a LabelShape. 
	     */
        imageVerticalAlign: VerticalAlign;

        /**
         * The type of this value is int, the value is the image width in pixels and must be greater than 0.
         */
        imageWidth: number;

        /**
         * The type of this value is int, the value is the image height in pixels and must be greater than 0.
         */
        imageHeight: number;

        /**
         * Possible values start at 0 (in pixels). 
         */
        indicatorWidth: number;
        indicatorHeight: number;

        /**
         * This specifies if a cell can be resized. Default is true
         */
        resizable: boolean;
       
        /**
         * Defines the key for the indicatorColor style. Possible values are all HTML color names or HEX codes, as well as the special 'swimlane' keyword
         * to refer to the color of the parent swimlane if one exists. 
         */
        indicatorColor: Color;

        /**
         * Defines the key for the indicatorGradientColor style. Possible values are all HTML color names or HEX codes. This style is only supported in label shapes. 
         */
        indicatorGradientcolor: Color;

        /**
         * Indicator image used within a label. Possible values are all image URLs. The indicatorShape has precedence over the indicatorImage. 
         */
        indicatorImage: string;

        /**
         * Horizontal relative coordinate connection point of an edge with its source terminal. 
         */
        exitX: number;

        /**
         * Horizontal relative coordinate connection point of an edge with its target terminal. 
         */
        entryX: number;

        /**
         * Vertical relative coordinate connection point of an edge with its source terminal. 
         */
        exitY: number;

        /**
         * Vertical relative coordinate connection point of an edge with its target terminal. Value is <code>entryY</code>.
         */
        entryY: number;

        /**
         *  Defines if the perimeter should be used to find the exact entry point along the perimeter of the source. Default is true
         */
        exitPerimeter: boolean;

        /**
         * Defines if the perimeter should be used to find the exact entry point along the perimeter of the target. Default is true
         */
        entryPerimeter: boolean;

        /**
         * Defines if the connection points on either end of the edge should be computed so that the edge is vertical or horizontal if possible and
         * if the point is not at a fixed location. Default is false. This is used in Graph.isOrthogonal, which also returns true if the edgeStyle
         * of the edge is an elbow or entity. 
         */
        orthogonal: boolean;
    }

    export enum ShapeStyle {
        Rectangle = 1,
        Ellipse,
        DoubleEllipse,
        Rhombus,
        Line,
        Image,
        Arrow,
        Label,
        Cylinder,
        Swimlane,
        Connector,
        Actor,
        Cloud,
        Triangle,
        Hexagon
    }

    export enum ArrowStyle {
        Classic = 1,
        Block,
        Open,
        Oval,
        Diamond,
        DiamondThin,
        None
    }

    export enum PerimeterStyle {
        Ellipse = 1,
        Rectangle,
        Rhombus,
        Hexagon,
        Triangle
    }

    export enum FontStyle {
        Bold = 1,
        Italic = 2,
        Underline = 4,
        Shadow = 8 
    }

    export enum EdgeKind {
        Elbow = 1,
        EntityRelation,
        Loop,
        Sidetoside,
        Toptobottom,
        TopToSide,
        Orthogonal,
        Segment
}
    export enum VerticalAlign {
        Top = 1,
        Middle,
        Bottom
    }

    export enum HorizontalAlign {
        Center = 1,
        Right,
        Left,
    }

    export enum Overflow {
        /* Content is not clipped */
        visible,
        
        /* Content is clipped, with no scrollbars */
        hidden,

        /* Content is clipped, with scrollbars */
        scroll,

        /* Let the browser decide */
        auto,

        inherit,

        /* custom */
        width,
        fill
    }

    export enum Whitespace {

        /* 
         * Sequences of whitespace are collapsed. Newline characters in the source are handled as other whitespace.Breaks lines as necessary to fill line boxes. 
        */
        normal,
    
        /**
         * Collapses whitespace as for normal, but suppresses line breaks (text wrapping) within text. 
         */
        nowrap,
    
        /**
         * Sequences of whitespace are preserved, lines are only broken at newline characters in the source and at <br> elements.
         */
        pre,
    
        /**
         * Sequences of whitespace are preserved. Lines are broken at newline characters, at <br>, and as necessary to fill line boxes.
         */
        preWrap,
    
        /**
         * Sequences of whitespace are collapsed. Lines are broken at newline characters, at <br>, and as necessary to fill line boxes. 
         */
        preLine,

        inherit,

        /**
         * Custom
         */
        wrap
    }

    class Style implements IStyle {
        shape: ShapeStyle;
        perimeter: PerimeterStyle;
        vAlign: VerticalAlign;
        hAlign: HorizontalAlign;
        fillColor: Color;
        strokeColor: Color;
        fontColor: Color;
        fontSize: number = 12;
        fontStyle: FontStyle;
        fontFamily: string;
        endArrow: ArrowStyle;
        startArrow: ArrowStyle;
        shadow: boolean;
        rounded: boolean;
        autoSize: boolean;
        curved: boolean;
        overflow: Overflow;
        whitespace: Whitespace;
        edge: EdgeKind;
        vLabelPosition: VerticalAlign;
        noLabel: boolean;
        direction: Direction;
        flipH: boolean;
        flipV: boolean;
        stencilFlipH: boolean;
        stencilFlipV: boolean;
        startSize: number = Constants.defaultMarkersize;
        endSize: number = Constants.defaultMarkersize;
        portrait: boolean;
        indicatorStrokeColor: Color;
        indicatorDirection: Direction;
        spacingTop: number = 0;
        spacingRight: number = 0;
        spacingBottom: number = 0;
        spacingLeft: number = 0;
        labelBackgroundColor: Color;
        LabelBorderColor: string;
        labelPosition: HorizontalAlign;
        verticalLabelPosition: VerticalAlign;
        spacing: number = 0;
        labelPadding: number;
        textOpacity: number;
        labelWidth: number;
        rotation: number = 0;
        preserveImageAspect: boolean = true;
        imageBackground: Color;
        imageBorder: Color;
        image: string;
        movable: boolean = true;
        arcSize: number = 20;
        startFill: boolean = true;
        endFill: boolean = true;
        margin: number = null;
        segment: number = Constants.entitySegment;
        portConstraint: Direction;
        portConstraintRotation: boolean = false;
        loop: EdgeKind = EdgeKind.Loop;
        noEdge: boolean = false;
        gradientColor: Color;
        gradientDirection: Direction = Direction.South;
        opacity: Opacity;
        strokeWidth: number;
        dashed: boolean;
        glass: boolean;
        elbow: ElbowStyle = ElbowStyle.Horizontal;
        swimlaneFillColor: Color = "none";
        swimlaneLine: boolean = true;
        separatorColor: Color = "none";
        imageVerticalAlign: VerticalAlign;
        imageAlign: HorizontalAlign;
        imageWidth: number;
        imageHeight: number;
        indicatorWidth: number;
        indicatorHeight: number;
        resizable: boolean;
        indicatorColor: Color;
        indicatorGradientcolor: Color;
        indicatorImage: string;
        exitX: number;
        entryX: number;
        exitY: number;
        entryY: number;
        exitPerimeter: boolean = true;
        entryPerimeter: boolean = true;
        orthogonal: boolean;
    }

    export class AppliedStyle
    {
        constructor(name: string) { this.name = name; }

        name: string;
        /**
         *  Defines if the perimeter should be used to find the exact entry point along the perimeter of the source. Default is true
         */
        exitPerimeter: boolean;

        /**
         * Defines if the perimeter should be used to find the exact entry point along the perimeter of the target. Default is true
         */
        entryPerimeter: boolean;

        startSize: number;
        /**
         * Horizontal relative coordinate connection point of an edge with its source terminal. 
         */
        exitX: number;

        /**
         * Horizontal relative coordinate connection point of an edge with its target terminal. 
         */
        entryX: number;

        /**
         * Vertical relative coordinate connection point of an edge with its source terminal. 
         */
        exitY: number;

        /**
         * Vertical relative coordinate connection point of an edge with its target terminal. Value is <code>entryY</code>.
         */
        entryY: number;
        noEdgeStyle: boolean;
        orthogonal: boolean;
        rotation: number;
    }

    export type StyleSetter = (style: AppliedStyle) => void;

    export function defaultStyle(): IStyle {
        return new Style();
    } 

    export class Stylesheet {
        constructor() {
            this.putDefaultVertexStyle(this.createDefaultVertexStyle());
            this.putDefaultEdgeStyle(this.createDefaultEdgeStyle());            
        }

        styles: { [key: string] : IStyle} = {};


        getDefaultEdgeStyle(): IStyle {
            /// <summary>Returns the default style for vertices</summary>
            return this.styles["defaultEdge"];
        }

        getDefaultVertexStyle(): IStyle {
            /// <summary> Returns the default style for vertices.</summary>
            return this.styles["defaultVertex"];
        }

        private createDefaultVertexStyle() {
            var style: IStyle = defaultStyle();

            style.shape = ShapeStyle.Rectangle;
            style.perimeter = PerimeterStyle.Rectangle;
            style.vAlign = VerticalAlign.Middle;
            style.hAlign = HorizontalAlign.Center;
            style.fillColor = "#C3D9FF";
            style.strokeColor = "#6482B9";
            style.fontColor = "#774400";

            return style;
        }

        private createDefaultEdgeStyle() {
            var style = defaultStyle();

            style.shape = ShapeStyle.Connector;
            style.endArrow = ArrowStyle.Classic;
            style.vAlign = VerticalAlign.Middle;
            style.hAlign = HorizontalAlign.Center;
            style.strokeColor = "#6482B9";
            style.fontColor = "#446299";

            return style;
        }

        putDefaultVertexStyle(style) {
            this.putCellStyle("defaultVertex", style);
        }

        putDefaultEdgeStyle(style) {
            this.putCellStyle("defaultEdge", style);
        }

        putCellStyle(name: string, style: IStyle) {
            this.styles[name] = style;
        }

        getCellStyle(styleApp: AppliedStyle, isEdge: boolean) : IStyle {
            var style = this.styles[styleApp.name] || (isEdge ? this.getDefaultEdgeStyle() : this.getDefaultVertexStyle());

            if (styleApp.exitPerimeter != null)
                style.exitPerimeter = styleApp.exitPerimeter;

            if (styleApp.entryPerimeter != null)
                style.entryPerimeter = styleApp.entryPerimeter;

            if (styleApp.startSize != null)
                style.startSize = styleApp.startSize;

            if (styleApp.exitX != null)
                style.exitX = styleApp.exitX;

            if (styleApp.entryX != null)
                style.entryX = styleApp.entryX;

            if (styleApp.exitY != null)
                style.exitY = styleApp.exitY;

            if (styleApp.entryY != null)
                style.entryY = styleApp.entryY;

            if (styleApp.noEdgeStyle != null)
                style.noEdge = styleApp.noEdgeStyle;

            if (styleApp.noEdgeStyle != null)
                style.noEdge = styleApp.noEdgeStyle;

            if (styleApp.orthogonal != null)
                style.orthogonal = styleApp.orthogonal;

            if (styleApp.rotation != null)
                style.rotation = styleApp.rotation;

            return style;
        }

    }        
}