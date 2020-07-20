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
        private static rectangleRoundingFactor_= 0.15;
        // Defines the color to be used to draw shadows in shapes and windows. Default is gray.
        static shadowColor = "gray"; 

        static get shadowOpacity(): number { return 1; }

        static get shadowOffsetX(): number { return 2; }

        static get shadowOffsetY(): number { return 3; }

        static get nsSvg(): string { return "http://www.w3.org/2000/svg"; }

        static get nsXlink(): string { return "http://www.w3.org/1999/xlink"; }

        static get nsXhtml(): string { return "http://www.w3.org/1999/xhtml" }


        static get none(): string { return "none"; }


        // Defines the rounding factor for rounded rectangles in percent between 0 and 1. Values should be smaller than 0.5. Default is 0.15.
        static get rectangleRoundingFactor(): number { return this.rectangleRoundingFactor_ }

        static set rectangleRoundingFactor(value: number) { this.rectangleRoundingFactor_ = value}

        // Specifies if absolute line heights should be used(px) in CSS.Default is false.Set this to true for backwards compatibility.
        static get absoluteLineHeight(): boolean { return false }

        // Defines the default line height for text labels.Default is 1.2.
        static get lineHeight(): number { return 1.2 }


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

        // Defines the rectangle for the A4 portrait page format.The dimensions of this page format are 826x1169 pixels.
        static pageFormatA4Portrait = new Rectangle(0, 0, 826, 1169);

        //  Defines the key for the loop style. Possible values are the functions defined in EdgeStyle. Value is <code>loopStyle</code>.
        static styleLoop = "loopStyle";

        // Defines the key for the edge style.Possible values are the functions defined in <mxEdgeStyle>. Value is < code > edgeStyle </code >.
        static styleEdge = "edgeStyle";

        // Defines the key for the shape. Possible values are all constants with a SHAPE-prefix or any newly defined shape names. Value is <code>shape</code>.
        static styleShape = "shape";




        // Defines the length of the horizontal segment of an Entity Relation. This can be overridden using<mxConstants.STYLE_SEGMENT> style. Default is 30.
        static entitySegment = 30;

        static directionMaskNone = 0;
        static directionMaskWest = 1;
        static directionMaskNorth = 2;
        static directionMaskSouth = 4;
        static directionMaskEast = 8;
        static directionMaskAll = 15;



        // Defines the default style for all fonts. Default is 0. This can be set to any combination of font styles as follows.
        // Constants.DEFAULT_FONTSTYLE = FontStyle._BOLD | FontStyle._ITALIC;
        static defaultFontstyle = 0;

        // Defines the default family for all fonts in points. Default is Arial,Helvetica.
        static defaultFontFamily = "\"Helvetica Neue\", Helvetica, Arial, sans-serif";




        // Defines the key for the verticalAlign style.Possible values are <ALIGN_TOP>, <ALIGN_MIDDLE> and<ALIGN_BOTTOM>.This value defines how
        // the lines of the label are vertically aligned.< ALIGN_TOP > means the topmost label text line is aligned against the top of the label bounds,
        // <ALIGN_BOTTOM> means the bottom - most label text line is aligned against the bottom of the label bounds and < ALIGN_MIDDLE > means there is equal
        // spacing between the topmost text label line and the top of the label bounds and the bottom - most text label line and the bottom of the label
        // bounds.Note this value doesn't affect the positioning of the overall label bounds relative to the vertex, to move the label bounds
        // vertically, use<STYLE_VERTICAL_LABEL_POSITION>.Value is < code > verticalAlign </code >.
        static styleVerticalAlign = "verticalAlign";


        // Defines the key for the horizontal style. Possible values are true or false. This value only applies to vertices. 
        // If the <STYLE_SHAPE> is <code>SHAPE_SWIMLANE</code> a value of false indicates that the swimlane should be drawn vertically, true indicates to draw it horizontally. 
        // If the shape style does not indicate that this vertex is a swimlane, this value affects only whether the label is drawn horizontally or vertically. Value is <code>horizontal</code>.
        static styleHorizontal = "horizontal";



        // Defines the key for the fill color. Possible values are all HTML color names or HEX codes, as well as special keywords such as 'swimlane,
        // 'inherit' or 'indicated' to use the color code of a related cell or the indicator shape. Value is <code>fillColor</code>.
        static styleFillcolor = "fillColor";


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
         * Defines the default width and height for images used in the label shape. Default is 24.
         */
        static defaultImagesize = 24;

        /**
         * Defines the key for the indicator shape used within an <mxLabel>. Possible values are all SHAPE_* constants or the names of any new
         * shapes. The indicatorShape has precedence over the indicatorImage. Value is <code>indicatorShape</code>.
         */
        static styleIndicatorShape = "indicatorShape";
        

        /**
         * Defines the key for the editable style. This specifies if the value of a cell can be edited using the in-place editor. Possible values are 0 or
         * 1. Default is 1. See <mxGraph.isCellEditable>. Value is <code>editable</code>.
         */
        static styleEditable = "editable";
        
        /** Defines the color to be used for the selection border of edges. Use 'none' for no color. Default is #00FF00. */
        static edgeSelectionColor = "#00FF00";

    	/** Defines the strokewidth to be used for edge selections. Default is 1. */
	    static edgeSelectionStrokewidth = 1;

	    /** Defines the dashed state to be used for the edge selection border. Default is true.	 */
	    static edgeSelectionDashed = true;

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
        /** Defines the key for the foldable style. This specifies if a cell is foldable using a folding icon. Possible values are 0 or 1. Default is 1. See <mxGraph.isCellFoldable>. Value is <code>foldable</code>. */
        static styleFoldable = "foldable";
        
        /** Defines the key for the autosize style. This specifies if a cell should be resized automatically if the value has changed. Possible values are 0 or 1.
         * Default is 0. See <mxGraph.isAutoSizeCell>. This is normally combined with  <STYLE_RESIZABLE> to disable manual sizing. Value is <code>autosize</code>. */
        static styleAutosize = "autosize";
        
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
        static defaultFontSize: number = 12;
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
         * Visits all entries in the dictionary using the given function with the following signature: function(key, value) where key is a string and  value is an object.
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