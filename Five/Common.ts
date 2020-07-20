///<reference path="Client.ts" />

module Five {
    "use strict";

    export class Point {
        _x: number;
        _y: number;

        get x(): number { return this._x; }
        get y(): number { return this._y; }
        set x(value: number) {
            this._x = value;
            this.check();
        }

        set y(value: number) {
            this._y = value;
            this.check();
        }

        constructor(x: number = 0, y: number = 0) {
            this._x = x;
            this._y = y;
            this.check();
        }

        check() {
            if (isNaN(this.x) || isNaN(this.y))
                throw new Error("invalid parameters:  " + this.x + " " + this.y);
        }

        equals(p: Point): boolean {
            return p != null && p.x === this.x && p.y === this.y;
        }

        clone(): Point {
            return Utils.clone(this);
        }
    }

    export class Rectangle extends Point {
        _width: number;
        _height: number;

        get width(): number {return this._width}
        set width(value: number) {
            this._width = value;
        }
        get height(): number {return this._height}
        set height(value: number) { this._height = value; }

        constructor(x = 0, y = 0, width = 0, height = 0) {
            // debug
            if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height))
                throw new Error("invalid parameters:  " + x + " "+ y + " " + width + " " + height);
            super(x, y);
            this.width = width;
            this.height = height;
        }

        clone(): Rectangle {
            return Utils.clone(this);
        }

        // Union
        add(rect: Rectangle) {
            if (rect != null) {
                var minX = Math.min(this.x, rect.x);
                var minY = Math.min(this.y, rect.y);
                var maxX = Math.max(this.x + this.width, rect.x + rect.width);
                var maxY = Math.max(this.y + this.height, rect.y + rect.height);

                this.x = minX;
                this.y = minY;
                this.width = maxX - minX;
                this.height = maxY - minY;
            }
        }

        equals(rect: Rectangle): boolean {
            return super.equals(rect) && rect.width === this.width && rect.height === this.height;
        }

        getCenterX() {
            return this.x + this.width / 2;
        }

        getCenterY() {
            return this.y + this.height / 2;
        }

        grow(amount: number): void {
            this.x -= amount;
            this.y -= amount;
            this.width += 2 * amount;
            this.height += 2 * amount;
        }

        // Rotates this rectangle by 90 degree around its center point.
        rotate90(): void {
            var t = (this.width - this.height) / 2;
            this.x += t;
            this.y -= t;
            var tmp = this.width;
            this.width = this.height;
            this.height = tmp;
        }
    }

    export enum Direction {
        North,
        South,
        East,
        West
    }

    export enum Dialect {
        Svg,
        Vml,
        MixedHtml,
        PreferHtml,
        StrictHtml
    }

    export enum RenderingHint {
        Exact,
        Faster,
        Fastest
    }

    export enum NodeType {
        Element = 1,
        Attribute = 2,
        Text = 3,
        Cdata = 4,
        EntityReference = 5,
        Entity = 6,
        ProcessingInstruction = 7,
        Comment = 8,
        Document = 9,
        DocumentType = 10,
        DocumentFragment = 11,
        Notation = 12,
    }

    export class Constants {
        // Defines the color to be used to draw shadows in shapes and windows. Default is gray.
        static shadowColor = "gray"; 

        static get shadowOpacity(): number { return 1; }

        static get shadowOffsetX(): number { return 2; }

        static get shadowOffsetY(): number { return 3; }

        static get nsSvg(): string { return "http://www.w3.org/2000/svg"; }

        static get nsXlink(): string { return "http://www.w3.org/1999/xlink"; }

        static get nsXhtml(): string { return "http://www.w3.org/1999/xhtml" }


        static get none(): string { return "none"; }

        // Defines the key for the direction style.The direction style is used
        // to specify the direction of certain shapes(eg.< mxTriangle>).
        // Possible values are<DIRECTION_EAST> (default), <DIRECTION_WEST>,
        // <DIRECTION_NORTH> and<DIRECTION_SOUTH>.Value is < code > direction </code >.
        static get styleDirection(): string { return "direction" }

        // Defines the key for the strokeWidth style.The type of the value is
        // numeric and the possible range is any non - negative value larger or equal to 1. The value defines the stroke width in pixels. 
        // Note: To hide a * stroke use strokeColor none. Value is < code > strokeWidth </code >.
        static get styleStrokeWidth(): string { return "strokeWidth" }

        // Defines the rounding factor for rounded rectangles in percent between 0 and 1. Values should be smaller than 0.5. Default is 0.15.
        static get rectangleRoundingFactor(): number { return 0.15 }

        // Defines the key for the horizontal image flip.This style is only used in <ImageShape>. Possible values are 0 and 1. Default is 0. Value is <code>flipH </code >.
        static get styleFlipH(): string { return "flipH" }

        // Defines the key for the vertical flip. Possible values are 0 and 1. Default is 0. Value is <code>flipV</code>.
        static get styleFlipV(): string { return "flipV" }

        // Constant for center horizontal alignment.Default is center.
        static get alignCenter(): string { return "center" }

        // Constant for right horizontal alignment. Default is right.
        static get alignRight(): string { return "right" }

        // Constant for left horizontal alignment. 
        static get alignLeft(): string { return "left" }

        // Constant for top vertical alignment. Default is top.
        static get alignTop(): string { return "top" }

        // Constant for middle vertical alignment. Default is middle.
        static get alignMiddle(): string { return "middle" }

        // Constant for bottom vertical alignment. Default is bottom.
        static get alignBottom(): string { return "bottom" }

        // Specifies if absolute line heights should be used(px) in CSS.Default is false.Set this to true for backwards compatibility.
        static get absoluteLineHeight(): boolean { return false }

        // Defines the default line height for text labels.Default is 1.2.
        static get lineHeight(): number { return 1.2 }

        // Defines the key for the rotation style. The type of the value is numeric and the possible range is 0-360. Value is <code>rotation</code>.
        static get styleRotation(): string { return "rotation" }

        // todo convert to enum
        static get fontBold(): number { return 1 }

        static get fontItalic(): number { return 2 }

        static get fontUnderline(): number { return 4 }

        static get fontShadow(): number { return 8 }


        static get shapeRectangle(): string { return "rectangle" }

        static get shapeEllipse(): string { return "ellipse" }

        static get shapeDoubleEllipse(): string { return "doubleEllipse" }

        static get shapeRhombus(): string { return "rhombus" }

        static get shapeLine(): string { return"line" }

        static get shapeImage(): string { return"image" }

        static get shapeArrow(): string { return"arrow" }

        static get shapeLabel(): string { return"label" }

        static get shapeCylinder(): string { return"cylinder" }

        static get shapeSwimlane(): string { return"swimlane" }

        static get shapeConnector(): string { return"connector" }

        static get shapeActor(): string { return"actor" }

        static get shapeCloud(): string { return"cloud" }

        static get shapeTriangle(): string { return"triangle" }

        static get shapeHexagon(): string { return"hexagon" }

        /**
         * Variable: STYLE_IMAGE_ASPECT
         * 
         * Defines the key for the image aspect style. Possible values are 0 (do
         * not preserve aspect) or 1 (keep aspect). This is only used in
         * <mxImageShape>. Default is 1. Value is <code>imageAspect</code>.
         */
        static get styleImageAspect(): string { return "imageAspect" }

        /**
         * Defines the key for the horizontal label position of vertices. Possible values are <ALIGN_LEFT>, <ALIGN_CENTER> and <ALIGN_RIGHT>. 
         * Default is <ALIGN_CENTER>. The label align defines the position of the label relative to the cell. 
         * <ALIGN_LEFT> means the entire label bounds is placed completely just to the left of the vertex, 
         * <ALIGN_RIGHT> means adjust to the right and <ALIGN_CENTER> means the label bounds are vertically aligned with the bounds of the vertex. 
         * Note this value doesn't affect the positioning of label within the label bounds, to move the label horizontally within the label bounds, use <STYLE_ALIGN>.
         * Value is <code>labelPosition</code>.
         */
        static get styleLabelPosition(): string { return "labelPosition" }

        /**
         * Defines the key for the width of the label if the label position is not
         * center. Value is <code>labelWidth</code>.
         */
        static get styleLabelWidth(): string { return "labelWidth" }

        /**
         * Defines the key for the align style. Possible values are <ALIGN_LEFT>, <ALIGN_CENTER> and <ALIGN_RIGHT>. 
         * This value defines how the lines of the label are horizontally aligned. <ALIGN_LEFT> mean label text lines
         * are aligned to left of the label bounds, <ALIGN_RIGHT> to the right of
         * the label bounds and <ALIGN_CENTER> means the center of the text lines
         * are aligned in the center of the label bounds. Note this value doesn't
         * affect the positioning of the overall label bounds relative to the
         * vertex, to move the label bounds horizontally, use
         * <STYLE_LABEL_POSITION>. Value is <code>align</code>.
         */
        static get styleAlign(): string { return "align" }

        /**
         * Defines the key for the vertical label position of vertices. Possible values are <ALIGN_TOP>, <ALIGN_BOTTOM> and <ALIGN_MIDDLE>. Default is <ALIGN_MIDDLE>. 
         * The label align defines the position of the label relative to the cell. <ALIGN_TOP> means the entire label bounds is
         * placed completely just on the top of the vertex, <ALIGN_BOTTOM> means
         * adjust on the bottom and <ALIGN_MIDDLE> means the label bounds are
         * horizontally aligned with the bounds of the vertex. Note this value
         * doesn't affect the positioning of label within the label bounds, to move
         * the label vertically within the label bounds, use
         * <STYLE_VERTICAL_ALIGN>. Value is <code>verticalLabelPosition</code>.
         */
        static get styleVerticalLabelPosition(): string { return "verticalLabelPosition" }

        // Defines the key for the horizontal relative coordinate connection point of an edge with its source terminal. Value is <code>exitX</code>.
        static get styleExitX(): string { return "exitX" }

        // Defines the key for the vertical relative coordinate connection point of an edge with its source terminal. Value is <code>exitY</code>.
        static get styleExitY(): string { return "exitY" }

        // Defines if the perimeter should be used to find the exact entry point along the perimeter of the source. Possible values are 0 (false) and 1 (true). 
        // Default is 1 (true). Value is <code>exitPerimeter</code>.
        static get styleExitPerimeter(): string { return "exitPerimeter" }

        // Defines the key for the horizontal relative coordinate connection point of an edge with its target terminal. Value is <code>entryX</code>.
        static get styleEntryX(): string { return "entryX" }

        // Defines the key for the vertical relative coordinate connection point of an edge with its target terminal. Value is <code>entryY</code>.
        static get styleEntryY(): string { return "entryY" }

        // Defines if the perimeter should be used to find the exact entry point along the perimeter of the target. Possible values are 0 (false) and 1 (true). 
        // Default is 1 (true). Value is <code>entryPerimeter</code>.
        static get styleEntryPerimeter(): string { return "entryPerimeter" }

        // Defines the rectangle for the A4 portrait page format.The dimensions of this page format are 826x1169 pixels.
        static pageFormatA4Portrait = new Rectangle(0, 0, 826, 1169);

        //  Defines the key for the loop style. Possible values are the functions defined in EdgeStyle. Value is <code>loopStyle</code>.
        static styleLoop = "loopStyle";

        // Defines the key for the noEdgeStyle style.If this is true then no edge style is applied for a given edge.Possible values are true or false (1 or 0). 
        // Default is false.Value is < code > noEdgeStyle </code >.
        static styleNoedgestyle = "noEdgeStyle";

        // Defines the key for the edge style.Possible values are the functions defined in <mxEdgeStyle>. Value is < code > edgeStyle </code >.
        static styleEdge = "edgeStyle";

        // Defines the key for the shape. Possible values are all constants with a SHAPE-prefix or any newly defined shape names. Value is <code>shape</code>.
        static styleShape = "shape";

        // Name of the elbow edge style. Can be used as a string value for the STYLE_EDGE style.
        static edgestyleElbow = "elbowEdgeStyle";

        // Name of the entity relation edge style. Can be used as a string value for the STYLE_EDGE style.
        static edgestyleEntityRelation = "entityRelationEdgeStyle";

        // Name of the loop edge style. Can be used as a string value for the STYLE_EDGE style.
        static edgestyleLoop = "loopEdgeStyle";

        // Name of the side to side edge style. Can be used as a string value for the STYLE_EDGE style.
        static edgestyleSidetoside = "sideToSideEdgeStyle";

        // Name of the top to bottom edge style. Can be used as a string value for the STYLE_EDGE style.
        static edgestyleToptobottom = "topToBottomEdgeStyle";       
		
		// Name of the top/bottom to side edge style. Can be used as a string value for the STYLE_EDGE style.
        static edgestyleTopToSide = "topToSideEdgeStyle";

        // Name of the generic orthogonal edge style. Can be used as a string value for the STYLE_EDGE style.
        static edgestyleOrthogonal = "orthogonalEdgeStyle";

        // Name of the generic segment edge style. Can be used as a string value for the STYLE_EDGE style.
        static edgestyleSegment = "segmentEdgeStyle";

        // Name of the ellipse perimeter. Can be used as a string value for the STYLE_PERIMETER style.
        static perimeterEllipse = "ellipsePerimeter";

        // Name of the rectangle perimeter. Can be used as a string value for the STYLE_PERIMETER style.
        static perimeterRectangle = "rectanglePerimeter";

        // Name of the rhombus perimeter. Can be used as a string value for the STYLE_PERIMETER style.
        static perimeterRhombus = "rhombusPerimeter";

        // Name of the hexagon perimeter. Can be used as a string value for the STYLE_PERIMETER style.
        static perimeterHexagon = "hexagonPerimeter";

        // Name of the triangle perimeter. Can be used as a string value for the STYLE_PERIMETER style.
        static perimeterTriangle = "trianglePerimeter";

        // Defines the key for the segment style.The type of this value is float and the value represents the size 
        // of the horizontal segment of the entity relation style.Default is ENTITY_SEGMENT.Value is < code > segment </code >.
        static styleSegment = "segment";

        // Defines the length of the horizontal segment of an Entity Relation. This can be overridden using<mxConstants.STYLE_SEGMENT> style. Default is 30.
        static entitySegment = 30;

        static directionMaskNone = 0;
        static directionMaskWest = 1;
        static directionMaskNorth = 2;
        static directionMaskSouth = 4;
        static directionMaskEast = 8;
        static directionMaskAll = 15;

        // Defines the direction(s) that edges are allowed to connect to cells in.
        // Possible values are < code>DIRECTION_NORTH, DIRECTION_SOUTH, DIRECTION_EAST</code> and <code>DIRECTION_WEST</code >. 
        // Value is <code>portConstraint </code >.
        static stylePortConstraint = "portConstraint";

        // Define whether port constraint directions are rotated with vertex rotation. 
        // 0 (default) causes port constraints to remain absolute, relative to the graph, 1 causes the constraints to rotate with
        // the vertex. Value is <code>portConstraintRotation</code>.
        static stylePortConstraintRotation = "portConstraintRotation";


        // Defines the key for the elbow style.Possible values are <ELBOW_HORIZONTAL> and<ELBOW_VERTICAL>.
        // Default is<ELBOW_HORIZONTAL>. This defines how the three segment orthogonal edge style leaves its
        // terminal vertices.The vertical style leaves the terminal vertices at the top and bottom sides.Value is < code > elbow </code >.
        static styleElbow = "elbow";

        // Constant for elbow vertical. Default is horizontal.
        static elbowVertical = "vertical";

        // Constant for elbow horizontal. Default is horizontal.
        static elbowHorizontal = "horizontal";

        // Defines the default style for all fonts. Default is 0. This can be set to any combination of font styles as follows.
        // Constants.DEFAULT_FONTSTYLE = Constants.FONT_BOLD | Constants.FONT_ITALIC;
        static defaultFontstyle = 0;

        // Defines the default family for all fonts in points. Default is Arial,Helvetica.
        static defaultFontFamily = "\"Helvetica Neue\", Helvetica, Arial, sans-serif";

        // Defines the default size for all fonts in points.Default is 11.
        static defaultFontSize = 12;

        // Defines the key for the fontColor style. Possible values are all HTML color names or HEX codes. Value is <code>fontColor</code>.
        static styleFontcolor = "fontColor";

        // Defines the key for the fontFamily style. Possible values are names such as Arial; Dialog; Verdana; Times New Roman. The value is of type String. Value is fontFamily.
        static styleFontfamily = "fontFamily";

        // Defines the key for the fontSize style (in points). The type of the value is int. Value is <code>fontSize</code>.
        static styleFontsize = "fontSize";

        // Defines the key for the fontStyle style. Values may be any logical AND (sum) of <FONT_BOLD>, <FONT_ITALIC>, <FONT_UNDERLINE> and <FONT_SHADOW>.
        // The type of the value is int. Value is <code>fontStyle</code>.
        static styleFontstyle = "fontStyle";

        // Defines the key for the verticalAlign style.Possible values are <ALIGN_TOP>, <ALIGN_MIDDLE> and<ALIGN_BOTTOM>.This value defines how
        // the lines of the label are vertically aligned.< ALIGN_TOP > means the topmost label text line is aligned against the top of the label bounds,
        // <ALIGN_BOTTOM> means the bottom - most label text line is aligned against the bottom of the label bounds and < ALIGN_MIDDLE > means there is equal
        // spacing between the topmost text label line and the top of the label bounds and the bottom - most text label line and the bottom of the label
        // bounds.Note this value doesn't affect the positioning of the overall label bounds relative to the vertex, to move the label bounds
        // vertically, use<STYLE_VERTICAL_LABEL_POSITION>.Value is < code > verticalAlign </code >.
        static styleVerticalAlign = "verticalAlign";

        // Defines the key for the spacing. The value represents the spacing, in pixels, added to each side of a label in a vertex (style applies to vertices only). Value is <code>spacing</code>.
        static styleSpacing = "spacing";

        // Defines the key for the spacingTop style. The value represents the spacing, in pixels, added to the top side of a label in a vertex (style applies to vertices only). Value is <code>spacingTop</code>.
        static styleSpacingTop = "spacingTop";

        // Defines the key for the spacingLeft style. The value represents the spacing, in pixels, added to the left side of a label in a vertex (style applies to vertices only). Value is <code>spacingLeft</code>.
        static styleSpacingLeft = "spacingLeft";

        // Defines the key for the spacingBottom style The value represents the spacing, in pixels, added to the bottom side of a label in a vertex (style applies to vertices only). Value is <code>spacingBottom</code>.
        static styleSpacingBottom = "spacingBottom";

        // Defines the key for the spacingRight style The value represents the spacing, in pixels, added to the right side of a label in a vertex (style applies to vertices only). Value is <code>spacingRight</code>.
        static styleSpacingRight = "spacingRight";

        // Defines the key for the horizontal style. Possible values are true or false. This value only applies to vertices. 
        // If the <STYLE_SHAPE> is <code>SHAPE_SWIMLANE</code> a value of false indicates that the swimlane should be drawn vertically, true indicates to draw it horizontally. 
        // If the shape style does not indicate that this vertex is a swimlane, this value affects only whether the label is drawn horizontally or vertically. Value is <code>horizontal</code>.
        static styleHorizontal = "horizontal";

        // Defines the key for the label background color. Possible values are all HTML color names or HEX codes. Value is <code>labelBackgroundColor</code>.
        static styleLabelBackgroundcolor = "labelBackgroundColor";

        // Defines the key for the label border color. Possible values are all HTML color names or HEX codes. Value is <code>labelBorderColor</code>.
        static styleLabelBordercolor = "labelBorderColor";

        // Defines the key for the label padding, ie. the space between the label border and the label. Value is <code>labelPadding</code>.
        static styleLabelPadding = "labelPadding";

        // Defines the rounding factor for a rounded rectangle in percent(without the percent sign).Possible values are between 0 and 100. 
        // If this value is not specified then RECTANGLE_ROUNDING_FACTOR * 100 is used. For edges, this defines the absolute size of rounded corners in pixels.
        // If this values is not specified then LINE_ARCSIZE is used.(This style is only exported via<mxImageExport>.) Value is < code > arcSize </code >.
        static styleArcsize = "arcSize";

        // Defines the key for the fill color. Possible values are all HTML color names or HEX codes, as well as special keywords such as 'swimlane,
        // 'inherit' or 'indicated' to use the color code of a related cell or the indicator shape. Value is <code>fillColor</code>.
        static styleFillcolor = "fillColor";

        // Defines the key for the fill color of the swimlane background. Possible values are all HTML color names or HEX codes. Default is no background.
        // Value is <code>swimlaneFillColor</code>.
        static styleSwimlaneFillcolor = "swimlaneFillColor";

        // Defines the key for the margin between the ellipses in the double ellipse shape.
        // Possible values are all positive numbers. Value is <code>margin</code>.
        static styleMargin = "margin";

        // Defines the key for the gradient color. Possible values are all HTML color names or HEX codes, as well as special keywords such as 'swimlane,
        // 'inherit' or 'indicated' to use the color code of a related cell or the indicator shape. This is ignored if no fill color is defined. Value is <code>gradientColor</code>.
        static styleGradientcolor = "gradientColor";

        // Defines the key for the gradient direction. Possible values are <DIRECTION_EAST>, <DIRECTION_WEST>, <DIRECTION_NORTH> and <DIRECTION_SOUTH>. 
        // Default is <DIRECTION_SOUTH>. Generally, and by default in mxGraph, gradient painting is done from the value of <STYLE_FILLCOLOR> to the value of <STYLE_GRADIENTCOLOR>. 
        // Taking the example of <DIRECTION_NORTH>, this means <STYLE_FILLCOLOR> color at the bottom of paint pattern and <STYLE_GRADIENTCOLOR> at top, with a gradient in-between. Value is <code>gradientDirection</code>.
        static styleGradientDirection = "gradientDirection";

        // Defines the key for the strokeColor style. Possible values are all HTML color names or HEX codes, as well as special keywords 
        // such as 'swimlane, 'inherit', 'indicated' to use the color code of a related cell or the indicator shape or 'none' for no color. Value is <code>strokeColor</code>.
        static styleStrokecolor = "strokeColor";

        // Defines the key for the separatorColor style. Possible values are all HTML color names or HEX codes. This style is only used for <SHAPE_SWIMLANE> shapes. Value is <code>separatorColor</code>.
        static styleSeparatorcolor = "separatorColor";

        // Defines the key for the opacity style.The type of the value is numeric and the possible range is 0 - 100. Value is < code > opacity </code >.
        static styleOpacity = "opacity";

        // Defines the key for the endSize style. The type of this value is numeric and the value represents the size of the end marker in pixels. Value is <code>endSize</code>.
        static styleEndsize = "endSize";

        // Defines the key for the startSize style. The type of this value is numeric and the value represents the size of the start marker 
        // or the size of the swimlane title region depending on the shape it is used for. Value is <code>startSize</code>.
        static styleStartsize = "startSize";

        // Defines the key for the end arrow marker. Possible values are all constants with an ARROW-prefix. This is only used in <mxConnector>. Value is <code>endArrow</code>.
        // Example:
        //  (code)
        // style[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_CLASSIC;
        // (end)
        static styleEndarrow = "endArrow";

        // Defines the key for the start arrow marker. Possible values are all constants with an ARROW-prefix. This is only used in <mxConnector>. 
        // See <STYLE_ENDARROW>. Value is <code>startArrow</code>.
        static styleStartarrow = "startArrow";

        static arrowClassic = "classic";
        static arrowBlock = "block";
        static arrowOpen = "open";
        static arrowOval = "oval";
        static arrowDiamond = "diamond";
        static arrowDiamondThin = "diamondThin";

        // Defines the key for the shadow style.The type of the value is Boolean.  Value is < code > shadow </code >.
        static styleShadow = "shadow";

        // Defines the key for the dashed style.Use 0 (default) for non - dashed or 1 for dashed.Value is < code > dashed </code >.
        static styleDashed = "dashed";

        // Defines the key for the rounded style.The type of this value is Boolean.
        // For edges this determines whether or not joins between edges segments are smoothed to a rounded finish.
        // For vertices that have the rectangle shape, this determines whether or not the rectangle is rounded.
        // Use 0 (default) for non - rounded or 1 for rounded.Value is  <code>rounded </code >.
        static styleRounded = "rounded";

        // Defines the key for the glass style.Possible values are 0(disabled) and 1(enabled). The default value is 0. 
        // This is used in <mxLabel>. Value is <code>glass </code >.
        static styleGlass = "glass";

        // Defines the key for the image background color. This style is only used in <mxImageShape>. Possible values are all HTML color names or HEX codes. Value is <code>imageBackground</code>.
        static styleImageBackground = "imageBackground";

        // Defines the key for the image border color. This style is only used in <mxImageShape>. Possible values are all HTML color names or HEX codes. Value is <code>imageBorder</code>.
        static styleImageBorder = "imageBorder";

        // Defines the key for the overflow style. Possible values are 'visible', 'hidden', 'fill' and 'width'. The default value is 'visible'. 
        // This value specifies how overlapping vertex labels are handled. A value of 'visible' will show the complete label. A value of 'hidden' will clip the label so that it does not overlap the vertex bounds. 
        // A value of 'fill' will use the vertex bounds and a value of 'width' will use the the vertex width for the label. See <mxGraph.isLabelClipped>. 
        // Note that the vertical alignment is ignored for overflow fill. Value is <code>overflow</code>.
        static styleOverflow = "overflow";

        // Defines the key for the white - space style.Possible values are 'nowrap' and 'wrap'. The default value is 'nowrap'.
        // This value specifies how white - space inside a HTML vertex label should be handled. 
        // A value of 'nowrap' means the text will never wrap to the next line until a linefeed is encountered.A value of 'wrap' means text will wrap when necessary.
        // This style is only used for HTML labels. See Graph.isWrapping. Value is < code > whiteSpace </code >.
        static styleWhiteSpace = "whiteSpace";

        // Defines the key for the image style.Possible values are any image URL, the type of the value is String.This is the path to the image to image
        // that is to be displayed within the label of a vertex.Data URLs should use the following format: data: image / png, xyz where xyz is the base64
        // encoded data(without the "base64" - prefix).Note that Data URLs are only supported in modern browsers.Value is < code > image </code >.
        static styleImage = "image";

        /**
         * Defines the key for the perimeter spacing. This is the distance between the connection point and the perimeter in pixels. 
         * When used in a vertex style, this applies to all incoming edges to floating ports (edges that terminate on the perimeter of the vertex). 
         * When used in an edge style, this spacing applies to the source and target separately, if they terminate in floating ports (on the perimeter of the vertex). Value is
         * <code>perimeterSpacing</code>.
         */
        static stylePerimeterSpacing = "perimeterSpacing";

        /**
         * Defines the key for the source perimeter spacing. The type of this value is numeric. This is the distance between the source connection point of
         * an edge and the perimeter of the source vertex in pixels. This style only applies to edges. Value is <code>sourcePerimeterSpacing</code>.
         */
        static styleSourcePerimeterSpacing = "sourcePerimeterSpacing";

        /**
	     * Defines the key for the target perimeter spacing. The type of this value is numeric. This is the distance between the target connection point of
	     * an edge and the perimeter of the target vertex in pixels. This style only applies to edges. Value is <code>targetPerimeterSpacing</code>.
	     */
        static styleTargetPerimeterSpacing = "targetPerimeterSpacing";

        /**
         * Defines the ID of the cell that should be used for computing the perimeter point of the source for an edge. This allows for graphically
         * connecting to a cell while keeping the actual terminal of the edge. Value is <code>sourcePort</code>.
         */
        static styleSourcePort = "sourcePort";

        /**
	     * Defines the ID of the cell that should be used for computing the perimeter point of the target for an edge. This allows for graphically
	     * connecting to a cell while keeping the actual terminal of the edge. Value is <code>targetPort</code>.
	     */
        static styleTargetPort = "targetPort";

        /**
         * Defines the vertical offset for the tooltip. Default is 16.
         */
        static tooltipVerticalOffset = 16;

        /**
         * Defines the key for the horizontal routing center. Possible values are between -0.5 and 0.5. This is the relative offset from the center used
         * for connecting edges. The type of this value is numeric. Value is <code>routingCenterX</code>.
         */
        static styleRoutingCenterX = "routingCenterX";

        /**
	     * Defines the key for the vertical routing center. Possible values are between -0.5 and 0.5. This is the relative offset from the center used
	     * for connecting edges. The type of this value is numeric. Value is  <code>routingCenterY</code>.
	     */
        static styleRoutingCenterY = "routingCenterY";

        /**
         * Defines the key for the perimeter style. This is a function that defines the perimeter around a particular shape. Possible values are the
         * functions defined in <mxPerimeter>. Alternatively, the constants in this class that start with <code>PERIMETER_</code> may be used to access
         * perimeter styles in <mxStyleRegistry>. Value is <code>perimeter</code>.
         */
        static stylePerimeter = "perimeter";

        /**
         * Defines the key for the curved style. The type of this value is Boolean. It is only applicable for connector shapes. Use 0 (default)
         * for non-curved or 1 for curved. Value is <code>curved</code>.
         */
        static styleCurved = "curved";

        /**
         * Defines the size of the arcs for rounded edges. Default is 20.
         */
        static lineArcsize = 20;

        /**
         * Defines the default size for all markers. Default is 6.
         */
        static defaultMarkersize = 6;

        /**
         * Defines the key for the endFill style. Use 0 for no fill or 1 (default) for fill. (This style is only exported via <mxImageExport>.) Value is
         * <code>endFill</code>.
         */
        static styleEndfill = "endFill";

        /**
	     * Defines the key for the startFill style. Use 0 for no fill or 1 (default)
	     * for fill. (This style is only exported via <mxImageExport>.) Value is
	     * <code>startFill</code>.
	     */
        static styleStartfill = "startFill";

        /**
         * Defines the width of the arrow shape. Default is 30.
         */
        static arrowWidth = 30;

        /**
         * Defines the spacing between the arrow shape and its terminals. Default is 10.
         */
        static arrowSpacing = 10;

        /**
         * Defines the size of the arrowhead in the arrow shape. Default is 30.
         */
        static arrowSize = 30;

        /**
         * Defines the default start size for swimlanes. Default is 40.
         */
        static defaultStartsize = 40;

        /**
         * Defines the key for the swimlaneLine style. This style specifies whether
         * the line between the title regio of a swimlane should be visible. Use 0
         * for hidden or 1 (default) for visible. Value is <code>swimlaneLine</code>.
         */
        static styleSwimlaneLine = "swimlaneLine";

        /**
         * Defines the default width and height for images used in the label shape. Default is 24.
         */
        static defaultImagesize = 24;

        /**
	     * Defines the key for the align style. Possible values are <ALIGN_LEFT>, <ALIGN_CENTER> and <ALIGN_RIGHT>. The value defines how any image in the
	     * vertex label is aligned horizontally within the label bounds of a <SHAPE_LABEL> shape. Value is <code>imageAlign</code>.
	     */
        static styleImageAlign = "imageAlign";

        /**
	     * Defines the key for the verticalAlign style. Possible values are
	     * <ALIGN_TOP>, <ALIGN_MIDDLE> and <ALIGN_BOTTOM>. The value defines how
	     * any image in the vertex label is aligned vertically within the label
	     * bounds of a <SHAPE_LABEL> shape. Value is <code>imageVerticalAlign</code>.
	     */
        static styleImageVerticalAlign = "imageVerticalAlign";

        /**
         * Defines the key for the imageWidth style. The type of this value is
         * int, the value is the image width in pixels and must be greater than 0.
         * Value is <code>imageWidth</code>.
         */
        static styleImageWidth = "imageWidth";

        /**
	     * Defines the key for the imageHeight style. The type of this value is
	     * int, the value is the image height in pixels and must be greater than 0.
	     * Value is <code>imageHeight</code>.
	     */
        static styleImageHeight = "imageHeight";
        
        /**
         * Defines the key for the indicator width. Possible values start at 0 (in
         * pixels). Value is <code>indicatorWidth</code>.
         */
        static styleIndicatorWidth = "indicatorWidth";

	    /**
	     * Defines the key for the indicator height. Possible values start at 0 (in
	     * pixels). Value is <code>indicatorHeight</code>.
	     */
	    static styleIndicatorHeight = "indicatorHeight";

        /**
         * Defines the key for the indicator shape used within an <mxLabel>. Possible values are all SHAPE_* constants or the names of any new
         * shapes. The indicatorShape has precedence over the indicatorImage. Value is <code>indicatorShape</code>.
         */
        static styleIndicatorShape = "indicatorShape";
        
        /**
         * Defines the key for the indicatorColor style. Possible values are all HTML color names or HEX codes, as well as the special 'swimlane' keyword
         * to refer to the color of the parent swimlane if one exists. Value is <code>indicatorColor</code>.
         */
        static styleIndicatorColor = "indicatorColor";
    
        /**
         * Defines the key for the indicator stroke color in <mxLabel>. Possible values are all color codes. Value is <code>indicatorStrokeColor</code>.
         */
        static styleIndicatorStrokecolor = "indicatorStrokeColor";

        /**
         * Defines the key for the indicatorGradientColor style. Possible values are all HTML color names or HEX codes. This style is only supported in
         * <SHAPE_LABEL> shapes. Value is <code>indicatorGradientColor</code>.
         */
        static styleIndicatorGradientcolor = "indicatorGradientColor";

        /**
         * Defines the key for the indicatorDirection style. The direction style is used to specify the direction of certain shapes (eg. <mxTriangle>).
         * Possible values are <DIRECTION_EAST> (default), <DIRECTION_WEST>, <DIRECTION_NORTH> and <DIRECTION_SOUTH>. Value is <code>indicatorDirection</code>.
         */
        static styleIndicatorDirection = "indicatorDirection";

        /**
         * Defines the key for the indicator image used within an <mxLabel>. Possible values are all image URLs. The indicatorShape has
         * precedence over the indicatorImage. Value is <code>indicatorImage</code>.
         */
        static styleIndicatorImage = "indicatorImage";

        /**
         * Defines the key for the noLabel style. If this is true then no label is visible for a given cell. Possible values are true or false (1 or 0).
         * Default is false. Value is <code>noLabel</code>.
         */
        static styleNolabel = "noLabel";

        /**
         * Defines the key for the text opacity style. The type of the value is 
         * numeric and the possible range is 0-100. Value is <code>textOpacity</code>.
         */
        static styleTextOpacity = "textOpacity";

        /**
         * Defines if the connection points on either end of the edge should be computed so that the edge is vertical or horizontal if possible and
         * if the point is not at a fixed location. Default is false. This is used in Graph.isOrthogonal, which also returns true if the edgeStyle
         * of the edge is an elbow or entity. Value is <code>orthogonal</code>.
         */
        static styleOrthogonal = "orthogonal";

        /**
         * Defines the key for the editable style. This specifies if the value of a cell can be edited using the in-place editor. Possible values are 0 or
         * 1. Default is 1. See <mxGraph.isCellEditable>. Value is <code>editable</code>.
         */
        static styleEditable = "editable";
        
        /** Defines the color to be used for the selection border of edges. Use 'none' for no color. Default is #00FF00. */
        static edgeSelectionColor = "#00FF00";

	    /** Defines the color to be used for the selection border of vertices. Use 'none' for no color. Default is #00FF00. */
	    static vertexSelectionColor = "#00FF00";
        
        /** Defines the strokewidth to be used for vertex selections. Default is 1. */
        static vertexSelectionStrokewidth = 1;

    	/** Defines the strokewidth to be used for edge selections. Default is 1. */
	    static edgeSelectionStrokewidth = 1;

        /** Defines the dashed state to be used for the vertex selection border. Default is true. */
        static vertexSelectionDashed = true;

	    /** Defines the dashed state to be used for the edge selection border. Default is true.	 */
	    static edgeSelectionDashed = true;

        /** Defines the color to be used for the handle fill color. Use 'none' for no color. Default is #00FF00 (green). */
        static handleFillcolor = "#00FF00";

    	/** Defines the color to be used for the handle stroke color. Use 'none' for no color. Default is black. */
	    static handleStrokecolor = "black";

        /** Defines the default size for handles. Default is 7.*/
        static handleSize = 7;

	    /** Defines the default size for label handles. Default is 4.*/
	    static labelHandleSize = 4;

        /** Defines the color to be used for the label handle fill color. Use 'none' for no color. Default is yellow. */
        static labelHandleFillcolor = "yellow";

    	/** Defines the color to be used for the connect handle fill color. Use 'none' for no color. Default is #0000FF (blue). */
	    static connectHandleFillcolor = "#0000FF";
        
        static cursorMovableVertex = "move";
	    static cursorMovableEdge = "move";
	    static cursorLabelHandle = "default";
	    static cursorBendHandle = "pointer";
	    static cursorConnect = "pointer";
        
        static defaultValidColor = "#00FF00";
        static defaultInvalidColor = "#FF0000";
        
        static guideColor = "#FF0000";
    	static guideStrokewidth = 1;
        static defaultHotspot = 0.3;

        /** Defines the minimum size in pixels of the portion of the cell which is to be used as a connectable region. Default is 8.*/
        static minHotspotSize = 8;

	    /** Defines the maximum size in pixels of the portion of the cell which is to be used as a connectable region. Use 0 for no maximum. Default is 0. */
	    static maxHotspotSize = 0;

        /** Defines the strokewidth to be used for the highlights.Default is 3.*/
        static highlightStrokewidth = 3;
        
        /** Specifies the default highlight color for shape outlines. Default is #0000FF. This is used in EdgeHandler.*/
        static outlineHighlightColor = "#00FF00";

	    /** Defines the strokewidth to be used for shape outlines. Default is 5. This is used in <mxEdgeHandler>. */
	    static outlineHighlightStrokewidth = 5;
        
        /** Defines the color to be used for the locked handle fill color. Use 'none' for no color. Default is #FF0000 (red). */
        static lockedHandleFillcolor = "#FF0000";

        /** Defines the color to be used for the coloring valid connection previews. Use 'none' for no color. Default is #FF0000. */
        static validColor = "#00FF00";

	    /** Defines the color to be used for the coloring invalid connection previews. Use 'none' for no color. Default is #FF0000. */
        static invalidColor = "#FF0000";

        /** Defines the color to be used for the highlighting target parent cells(for drag and drop). Use 'none' for no color. Default is #0000FF.*/
        static dropTargetColor = "#0000FF";
        
        /** Defines the color to be used for highlighting a target cell for a newor changed connection. Note that this may be either a source or
         * target terminal in the graph. Use 'none' for no color. Default is #0000FF.*/
        static connectTargetColor = "#0000FF";

	    /** Defines the color to be used for highlighting a invalid target cells for a new or changed connections. Note that this may be either a source
	    * or target terminal in the graph. Use 'none' for no color. Default is #FF0000. */
	    static invalidConnectTargetColor = "#FF0000";
    
        /** Defines the key for the bendable style. This specifies if the control points of an edge can be moved. Possible values are 0 or 1 */
        static styleBendable = "bendable";

        /** Defines the key for the aspect style. Possible values are empty or fixed.If fixes is used then the aspect ratio of the cell will be maintained
         * when resizing. Default is empty. Value is <code>aspect</code>.*/
        static styleAspect = "aspect";
        /** Defines the key for the movable style. This specifies if a cell can be moved. Possible values are 0 or 1. Default is 1. See <mxGraph.isCellMovable>. Value is <code>movable</code>. */
        static styleMovable = "movable";
        /** Defines the key for the foldable style. This specifies if a cell is foldable using a folding icon. Possible values are 0 or 1. Default is 1. See <mxGraph.isCellFoldable>. Value is <code>foldable</code>. */
        static styleFoldable = "foldable";
        
        /** Defines the key for the autosize style. This specifies if a cell should be resized automatically if the value has changed. Possible values are 0 or 1.
         * Default is 0. See <mxGraph.isAutoSizeCell>. This is normally combined with  <STYLE_RESIZABLE> to disable manual sizing. Value is <code>autosize</code>. */
        static styleAutosize = "autosize";
        /** Defines the key for the resizable style. This specifies if a cell can be resized. Possible values are 0 or 1. Default is 1. See <mxGraph.isCellResizable>. Value is <code>resizable</code>. */
        static styleResizable = "resizable";
        
        /** Defines the key for the rotatable style. This specifies if a cell can be rotated. Possible values are 0 or 1. Default is 1. See <mxGraph.isCellRotatable>. Value is <code>rotatable</code>. */
        static styleRotatable = "rotatable";

        /** Defines the key for the cloneable style. This specifies if a cell can be cloned. Possible values are 0 or 1. Default is 1. See <mxGraph.isCellCloneable>. Value is <code>cloneable</code>.*/
        static styleCloneable = "cloneable";

	    /** Defines the key for the deletable style. This specifies if a cell can be deleted. Possible values are 0 or 1. Default is 1. See xGraph.isCellDeletable. Value is <code>deletable</code>. */
        static styleDeletable = "deletable";

	    /** Defines the color to be used for the outline rectangle border.  Use 'none' for no color. Default is #0099FF. */
	    static outlineColor = '#0099FF';

	    /** Defines the strokewidth to be used for the outline rectangle stroke width. Default is 3. */
        static outlineStrokewidth = (Client.isIe) ? 2 : 3;

	    /** Defines the color to be used for the outline sizer fill color. Use 'none' for no color. Default is #00FFFF. */
	    static outlineHandleFillcolor = '#00FFFF';

	    /** Defines the color to be used for the outline sizer stroke color. Use 'none' for no color. Default is #0033FF. */
	    static outlineHandleStrokecolor = '#0033FF';


    }


    //	Implements internationalization. You can provide any number of 
    //	resource files on the server using the following format for the 
    //	filename: name[-en].properties. The en stands for any lowercase 
    //	2-character language shortcut (eg. de for german, fr for french).
    //	
    //	If the optional language extension is omitted, then the file is used as a 
    //	default resource which is loaded in all cases. If a properties file for a 
    //	specific language exists, then it is used to override the settings in the 
    //	default resource. All entries in the file are of the form key=value. The
    //	values may then be accessed in code via <get>. Lines without 
    //	equal signs in the properties files are ignored.
    //	
    //	Resource files may either be added programmatically using
    //	<add> or via a resource tag in the UI section of the 
    //	editor configuration file, eg:
    //	
    //	(code)
    //	<mxEditor>
    //	  <ui>
    //	    <resource basename="examples/resources/mxWorkflow"/>
    //	(end)
    //	
    //	The above element will load examples/resources/mxWorkflow.properties as well
    //	as the language specific file for the current language, if it exists.
    //	
    //	Values may contain placeholders of the form {1}...{n} where each placeholder
    //	is replaced with the value of the corresponding array element in the params
    //	argument passed to <mxResources.get>. The placeholder {1} maps to the first
    //	element in the array (at index 0).
    //	
    //	See <mxClient.language> for more information on specifying the default
    //	language or disabling all loading of resources.
    //	
    //	Lines that start with a # sign will be ignored.
    //	
    //	Special characters
    //	
    //	To use unicode characters, use the standard notation (eg. \u8fd1) or %u as a
    //	prefix (eg. %u20AC will display a Euro sign). For normal hex encoded strings,
    //	use % as a prefix, eg. %F6 will display a "o umlaut" (&ouml;).
    //	
    //	See <resourcesEncoded> to disable this. If you disable this, make sure that
    //	your files are UTF-8 encoded.
    export class Resources {
        // Associative array that maps from keys to values.
        static resources = [];

        // Returns the value for the specified resource key.
        //
        // Example:
        // To read the value for 'welomeMessage', use the following:
        // (code)
        // var result = mxResources.get('welcomeMessage') || '';
        // (end)
        //
        // This would require an entry of the following form in
        // one of the English language resource files:
        // (code)
        // welcomeMessage=Welcome to mxGraph!
        // (end)
        // 
        // The part behind the || is the string value to be used if the given
        // resource is not available.
        // 
        // Parameters:
        // 
        // key - String that represents the key of the resource to be returned.
        // params - Array of the values for the placeholders of the form {1}...{n}
        // to be replaced with in the resulting string.
        // defaultValue - Optional string that specifies the default return value.
        static get(key: string, params?: any[], defaultValue?: string): string {
            var value: string = Resources.resources[key];

            // Applies the default value if no resource was found
            if (value == null) {
                value = key;
            }

            // Replaces the placeholders with the values in the array
            if (value != null &&
                params != null) {
                var result = [];
                var index = null;

                for (var i = 0; i < value.length; i++) {
                    var c = value.charAt(i);

                    if (c == "{") {
                        index = "";
                    } else if (index != null && c == "}") {
                        index = parseInt(index) - 1;

                        if (index >= 0 && index < params.length) {
                            result.push(params[index]);
                        }

                        index = null;
                    } else if (index != null) {
                        index += c;
                    } else {
                        result.push(c);
                    }
                }

                value = result.join("");
            }

            return value;
        }
    }

    /**
     * A wrapper class for an associative array with object keys. Note: This
     * implementation uses <mxObjectIdentitiy> to turn object keys into strings.
     * 
     * Constructor: mxEventSource
     *
     * Constructs a new dictionary which allows object to be used as keys.
     */
    export class Dictionary<TKey, TValue> {
        constructor() {
            this.clear();
        }

        /**
         * Stores the (key, value) pairs in this dictionary.
         */
        map : { [id: string] : TValue} = {};

        /**
         * Clears the dictionary.
         */
        clear() {
            this.map = {};
        } 
        
        /**
         * Returns the value for the given key.
         */
        get(key: TKey) {
            return this.map[this.getId(key)];
        }

        private getId(key: TKey): string {
            return ObjectIdentity.get(key);
        }

        /**
         * Stores the value under the given key and returns the previous value for that key.
         */
        put(key: TKey, value: TValue) : TValue {
            var id = this.getId(key);
            var previous = this.map[id];
            this.map[id] = value;

            return previous;
        }

        /**
         * Removes the value for the given key and returns the value that
         * has been removed.
         */
        remove(key: TKey) : TValue {
            var id = ObjectIdentity.get(key);
            var previous = this.map[id];
            delete this.map[id];

            return previous;
        }

        /**
         * Returns all keys as an array.
         */
        getKeys(): TKey[] {
            var result = [];
            var map = this.map;
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    result.push(key);
                }
            }

            return result;
        }

        /**
         * Returns all values as an array.
         */
        getValues() : TValue[] {
            var result: TValue[] = [];
            var map = this.map;
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    result.push(map[key]);
                }
            }

            return result;
        }

        /**
         * Visits all entries in the dictionary using the given function with the
         * following signature: function(key, value) where key is a string and
         * value is an object.
         * 
         * Parameters:
         * 
         * visitor - A function that takes the key and value as arguments.
         */
        visit( visitor: (value: TValue) => void) {
            var map = this.map;
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    visitor(map[key]);
                }
            }
        }

    }

    export class StringDictionary<TValue> {
        constructor() {
            this.clear();
        }

        private map : { [id: string] : TValue};

        clear() {
            this.map = {};
        } 
        
        get(key: string) : TValue {
            return this.map[key];
        }

        put(key: string, value: TValue) : TValue {
            var previous = this.map[key];
            this.map[key] = value;

            return previous;
        }

        remove(key: string) : TValue {
            var previous = this.map[key];
            delete this.map[key];

            return previous;
        }

        removeValue(value: TValue) : string {
            var map = this.map;
            // ReSharper disable once MissingHasOwnPropertyInForeach
            for (var key in map) {
                if (map[key] === value) {
                    delete this.map[key];
                    return key;
                }
            }
            return null;
        }

        
        getKeys(): string[] {
            var result = [];
            var map = this.map;
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    result.push(key);
                }
            }
            return result;
        }

        getValues(): TValue[] {
            var result: TValue[] = [];
            var map = this.map;
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    result.push(map[key]);
                }
            }

            return result;
        }

        visit( visitor: (key: string, value: TValue) => void) {
            var map = this.map;
            for (var key in map) {
                if (map.hasOwnProperty(key)) {
                    visitor(key, map[key]);
                }
            }
        }

    }

    /**
     * Encapsulates the URL, width and height of an image.
     */
    export class Image {
        constructor(src, width, height) {
            this.src = src;
            this.width = width;
            this.height = height;
        }

        src: string = null;
        width: number = null;
        height: number = null;
    }
}