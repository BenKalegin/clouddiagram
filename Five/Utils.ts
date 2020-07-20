/// <reference path="FileStructure.ts"/>

module Five {

    export interface IGraphFactory {
        (evt: Event): Graph;
    }

    export class Utils {
        static write(parent: Node, text) {
            var doc = parent.ownerDocument;
            var node = doc.createTextNode(text);

            if (parent != <Node>null) {
                parent.appendChild(node);
            }

            return node;
        }


        static clone<T>(obj: T, transients?: string[], shallow: boolean = null): T {
            /// <summary>Recursively clones the specified object ignoring all fieldnames in the given array of transient fields.
            /// ObjectIdentity.FIELD_NAME is always ignored by this function.</summary>
            /// <param name="obj">Object to be cloned.</param>
            /// <param name="transients">Optional array of strings representing the fieldname to be ignored</param>
            /// <param name="shallow">shallow - Optional boolean argument to specify if a shallow clone should be created, that is, 
            /// one where all object references are not cloned or, in other words, one where only atomic(strings, numbers) values are cloned.Default is false.</param>
            shallow = (shallow != null) ? shallow : false;
            var clone: T = null;

            if (obj != null && typeof (obj.constructor) == "function") {
                clone = <T>Object.create(obj);

                // ReSharper disable once MissingHasOwnPropertyInForeach
                for (var key in obj) {
                    if (key != ObjectIdentity.fieldName && (transients == null || Utils.indexOf(transients, key) < 0)) {
                        if (!shallow && typeof (obj[key]) == "object") {
                            clone[key] = this.clone(obj[key]);
                        } else {
                            clone[key] = obj[key];
                        }
                    }
                }
            }

            return clone;
        }

        //Returns the value for the given key in the given associative array or the given default value if the value is null.
        // array - Associative array that contains the value for the key.
        // key - Key whose value should be returned.
        // defaultValue - Value to be returned if the value for the given key is null.
        static getValue(map: { [key: string]: string }, key: string, defaultValue?: string): string {
            var value = (map != null) ? map[key] : null;

            if (value == null) {
                value = defaultValue;
            }

            return value;
        }

        // Returns the numeric value for the given key in the given associative
        // array or the given default value(or 0) if the value is null.The value
        // is converted to a numeric value using the Number function.
        // array - Associative array that contains the value for the key.
        // key - Key whose value should be returned.
        // defaultValue - Value to be returned if the value for the given key is null.Default is 0.
        static getInt(map: { [key: string]: string }, key: string, defaultValue: number = 0): number {
            var value = (map != null) ? parseInt(map[key]) : null;

            if ((value == null) || isNaN(value)) {
                value = defaultValue;
            }

            return value;
        }

        static getFloat(map: { [key: string]: string }, key: string, defaultValue: number = 0): number {
            var value = (map != null) ? parseFloat(map[key]) : null;

            if ((value == null) || isNaN(value)) {
                value = defaultValue;
            }

            return value;
        }

        static getBoolean(map: { [key: string]: string }, key: string, defaultValue: boolean = false): boolean {
            var asInt = this.getInt(map, key, null);

            if (asInt == null) {
                return defaultValue || false;
            }

            return asInt === 1;
        }

        // Returns the remainder of division of n by m. You should use this instead
        // of the built- in operation as the built- in operation does not properly handle negative numbers.
        static mod = (n, m) => (((n % m) + m) % m);

        // Converts the given arc to a series of curves.
        static arcToCurves(x0: number, y0: number, r1: number, r2: number, angle: number, largeArcFlag: number, sweepFlag: number, x: number, y: number): number[] {
            x -= x0;
            y -= y0;

            if (r1 === 0 || r2 === 0) {
                return [];
            }

            var fS = sweepFlag;
            var psai = angle;
            r1 = Math.abs(r1);
            r2 = Math.abs(r2);
            var ctx = -x / 2;
            var cty = -y / 2;
            var cpsi = Math.cos(psai * Math.PI / 180);
            var spsi = Math.sin(psai * Math.PI / 180);
            var rxd = cpsi * ctx + spsi * cty;
            var ryd = -1 * spsi * ctx + cpsi * cty;
            var rxdd = rxd * rxd;
            var rydd = ryd * ryd;
            var r1X = r1 * r1;
            var r2Y = r2 * r2;
            var lamda = rxdd / r1X + rydd / r2Y;
            var sds: number;

            if (lamda > 1) {
                r1 = Math.sqrt(lamda) * r1;
                r2 = Math.sqrt(lamda) * r2;
                sds = 0;
            } else {
                var seif = 1;

                if (largeArcFlag === fS) {
                    seif = -1;
                }

                sds = seif * Math.sqrt((r1X * r2Y - r1X * rydd - r2Y * rxdd) / (r1X * rydd + r2Y * rxdd));
            }

            var txd = sds * r1 * ryd / r2;
            var tyd = -1 * sds * r2 * rxd / r1;
            var tx = cpsi * txd - spsi * tyd + x / 2;
            var ty = spsi * txd + cpsi * tyd + y / 2;
            var rad = Math.atan2((ryd - tyd) / r2, (rxd - txd) / r1) - Math.atan2(0, 1);
            var s1 = (rad >= 0) ? rad : 2 * Math.PI + rad;
            rad = Math.atan2((-ryd - tyd) / r2, (-rxd - txd) / r1) - Math.atan2((ryd - tyd) / r2, (rxd - txd) / r1);
            var dr = (rad >= 0) ? rad : 2 * Math.PI + rad;

            if (fS == 0 && dr > 0) {
                dr -= 2 * Math.PI;
            } else if (fS != 0 && dr < 0) {
                dr += 2 * Math.PI;
            }

            var sse = dr * 2 / Math.PI;
            var seg = Math.ceil(sse < 0 ? -1 * sse : sse);
            var segr = dr / seg;
            var t = 8 / 3 * Math.sin(segr / 4) * Math.sin(segr / 4) / Math.sin(segr / 2);
            var cpsir1 = cpsi * r1;
            var cpsir2 = cpsi * r2;
            var spsir1 = spsi * r1;
            var spsir2 = spsi * r2;
            var mc = Math.cos(s1);
            var ms = Math.sin(s1);
            var x2 = -t * (cpsir1 * ms + spsir2 * mc);
            var y2 = -t * (spsir1 * ms - cpsir2 * mc);
            var x3 = 0;
            var y3 = 0;

            var result = [];

            for (var n = 0; n < seg; ++n) {
                s1 += segr;
                mc = Math.cos(s1);
                ms = Math.sin(s1);

                x3 = cpsir1 * mc - spsir2 * ms + tx;
                y3 = spsir1 * mc + cpsir2 * ms + ty;
                var dx = -t * (cpsir1 * ms + spsir2 * mc);
                var dy = -t * (spsir1 * ms - cpsir2 * mc);

                // CurveTo updates x0, y0 so need to restore it
                var index = n * 6;
                result[index] = Number(x2 + x0);
                result[index + 1] = Number(y2 + y0);
                result[index + 2] = Number(x3 - dx + x0);
                result[index + 3] = Number(y3 - dy + y0);
                result[index + 4] = Number(x3 + x0);
                result[index + 5] = Number(y3 + y0);

                x2 = x3 + dx;
                y2 = y3 + dy;
            }

            return result;
        }

        // Returns true if the given value is an XML node with the node name and if the optional attribute has the specified value.
        // This implementation assumes that the given value is a DOM node if the nodeType property is numeric, that is, if isNaN returns false for value.nodeType.
        // value - Object that should be examined as a node.
        // nodeName - String that specifies the node name.
        // attributeName - Optional attribute name to check.
        // attributeValue - Optional attribute value to check.
        static isNode(value: any, nodeName?: string, attributeName?: string, attributeValue?: string) {
            if (value instanceof Element && !isNaN(value.nodeType) && (nodeName == null ||
                value.nodeName.toLowerCase() === nodeName.toLowerCase())) {
                return attributeName == null || value.getAttribute(attributeName) == attributeValue;
            }

            return false;
        }

        // Rotates the given point by the given cos and sin.
        static getRotatedPoint(pt, cos, sin, c: Point) {
            c = (c != null) ? c : new Point(0, 0);
            var x = pt.x - c.x;
            var y = pt.y - c.y;

            var x1 = x * cos - y * sin;
            var y1 = y * cos + x * sin;

            return new Point(x1 + c.x, y1 + c.y);
        }

        // Returns the bounding box for the rotated rectangle.
        // rect - <Rectangle> to be rotated.
        // angle - Number that represents the angle (in degrees).
        // cx - Optional < Point > that represents the rotation center.If no
        // rotation center is given then the center of rect is used.

        static getBoundingBox(rect: Rectangle, rotation: number, cx?: Point): Rectangle {
            var result = null;

            if (rect != null && rotation != null && rotation != 0) {
                var rad = Utils.toRadians(rotation);
                var cos = Math.cos(rad);
                var sin = Math.sin(rad);

                cx = (cx != null) ? cx : new Point(rect.x + rect.width / 2, rect.y + rect.height / 2);

                var p1 = new Point(rect.x, rect.y);
                var p2 = new Point(rect.x + rect.width, rect.y);
                var p3 = new Point(p2.x, rect.y + rect.height);
                var p4 = new Point(rect.x, p3.y);

                p1 = Utils.getRotatedPoint(p1, cos, sin, cx);
                p2 = Utils.getRotatedPoint(p2, cos, sin, cx);
                p3 = Utils.getRotatedPoint(p3, cos, sin, cx);
                p4 = Utils.getRotatedPoint(p4, cos, sin, cx);

                result = new Rectangle(p1.x, p1.y, 0, 0);
                result.add(new Rectangle(p2.x, p2.y, 0, 0));
                result.add(new Rectangle(p3.x, p3.y, 0, 0));
                result.add(new Rectangle(p4.x, p4.y, 0, 0));
            }

            return result;
        }

        // Converts the given degree to radians.

        static toRadians(deg: number) {
            return Math.PI * deg / 180;
        }


        // Parses the specified XML string into a new XML document and returns the
        // new document.
        static parseXml(xml: string): Document {
            // ReSharper disable once InconsistentNaming
            var parser = new DOMParser();
            return parser.parseFromString(xml, "text/xml");
        }

        // Strips all whitespaces from both end of the string.
        // Without the second parameter, Javascript function will trim these characters:
        // - " "(ASCII 32(0x20)), an ordinary space
        // - "\t"(ASCII 9(0x09)), a tab
        // - "\n"(ASCII 10(0x0A)), a new line(line feed)
        // - "\r"(ASCII 13(0x0D)), a carriage return
        // - "\0"(ASCII 0(0x00)), the NUL - byte
        // - "\x0B"(ASCII 11(0x0B)), a vertical tab
        static trim(str: string, chars?: string): string {
            return Utils.ltrim(Utils.rtrim(str, chars), chars);
        }

        // Strips all whitespaces from the beginning of the string.
        // Without the second parameter, Javascript function will trim these
        // characters:
        //
        // - " "(ASCII 32(0x20)), an ordinary space
        // - "\t"(ASCII 9(0x09)), a tab
        // - "\n"(ASCII 10(0x0A)), a new line(line feed)
        // - "\r"(ASCII 13(0x0D)), a carriage return
        // - "\0"(ASCII 0(0x00)), the NUL - byte
        // - "\x0B"(ASCII 11(0x0B)), a vertical tab
        static ltrim(str: string, chars?: string): string {
            chars = chars || "\\s";

            return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
        }

        // Strips all whitespaces from the end of the string.
        // Without the second parameter, Javascript function will trim these
        // characters:
        // 
        // - " " (ASCII 32 (0x20)), an ordinary space
        // - "\t" (ASCII 9 (0x09)), a tab
        // - "\n" (ASCII 10 (0x0A)), a new line (line feed)
        // - "\r" (ASCII 13 (0x0D)), a carriage return
        // - "\0" (ASCII 0 (0x00)), the NUL-byte
        // - "\x0B" (ASCII 11 (0x0B)), a vertical tab
        static rtrim(str: string, chars?: string): string {
            chars = chars || "\\s";

            return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
        }

        // Replaces characters(less than, greater than, newlines and quotes) with
        // their HTML entities in the given string and returns the result.
        // 
        // Parameters:
        //
        // s - String that contains the characters to be converted.
        // newline - If newlines should be replaced.Default is true.
        static htmlEntities(s: string, newline: boolean = true): string {
            s = s || "";

            s = s.replace(/&/g, "&amp;"); // 38 26
            s = s.replace(/"/g, "&quot;"); // 34 22
            s = s.replace(/\'/g, "&#39;"); // 39 27
            s = s.replace(/</g, "&lt;"); // 60 3C
            s = s.replace(/>/g, "&gt;"); // 62 3E

            if (newline) {
                s = s.replace(/\n/g, "&#xa;");
            }

            return s;
        }

        // Returns the text content of the specified node.
        static getTextContent(node: Element): string {
            if (node == null)
                return "";
            if ((<HTMLElement>node).innerText !== undefined)
                return (<HTMLElement>node).innerText;
            else
                return node[(node.textContent === undefined) ? "text" : "textContent"];
        }


        // Evaluates the given expression using eval and returns the JavaScript
        // object that represents the expression result. Supports evaluation of
        // expressions that define functions and returns the function object for
        // these expressions.
        // 
        // expr - A string that represents a JavaScript expression.
        static eval(expr: string): any {
            var result = null;

            if (expr.indexOf("function") >= 0) {
                throw new Error("unsupported");
            } else {
                try {
                    result = eval(expr);
                } catch (e) {
                    console.log(e.message + " while evaluating " + expr);
                }
            }

            return result;
        }

        // Returns the index of obj in array or - 1 if the array does not contain
        static indexOf<T>(array: T[], obj: T): number {
            if (array != null && obj != null) {
                for (var i = 0; i < array.length; i++) {
                    if (array[i] === obj) {
                        return i;
                    }
                }
            }
            return -1;
        }

        static bind<TFunc extends Function, TObject>(scope: TObject, funct: TFunc): TFunc {
            /// <summary>Returns a wrapper function that locks the execution scope of the given function to the specified scope. 
            /// Inside funct, the "this" keyword becomes a reference to that scope.</summary>
            return <any>(() => funct.apply(scope, arguments));
        }

        static equalPoints(a: Point[], b: Point[]): boolean {
            if ((a == null && b != null) || (a != null && b == null) || (a != null && b != null && a.length != b.length)) {
                return false;
            } else if (a != null && b != null) {
                for (var i = 0; i < a.length; i++) {
                    if (a[i] == b[i] || (a[i] != null && !a[i].equals(b[i]))) { // todo == seems like error
                        return false;
                    }
                }
            }

            return true;
        }

        static getFunctionName(f: Function): string {
            /// <summary>Returns the name for the given function</summary>
            /// <param name="f">JavaScript object that represents a function</param>
            var str = null;

            if (f != null) {
                if ((<any>f).name != null) {
                    str = (<any>f).name;
                } else {
                    var tmp = f.toString();
                    var idx1 = 9;

                    while (tmp.charAt(idx1) == " ") {
                        idx1++;
                    }

                    var idx2 = tmp.indexOf("(", idx1);
                    str = tmp.substring(idx1, idx2);
                }
            }

            return str;
        }

        /**
         * Function: isAncestorNode
         * 
         * Returns true if the given ancestor is an ancestor of the
         * given DOM node in the DOM. This also returns true if the
         * child is the ancestor.
         * 
         * Parameters:
         * 
         * ancestor - DOM node that represents the ancestor.
         * child - DOM node that represents the child.
         */
        static isAncestorNode(ancestor: Element, child: Element): boolean {
            var parent = child;

            while (parent != null) {
                if (parent === ancestor) {
                    return true;
                }

                parent = <Element>(parent.parentNode);
            }
            return false;
        }

        /**
         * Returns an integer mask of the port constraints of the given map
         * @param dict the style map to determine the port constraints for
         * @param defaultValue Default value to return if the key is undefined.
         * @return the mask of port constraint directions
         * 
         * Parameters:
         * 
         * terminal - <mxCelState> that represents the terminal.
         * edge - <mxCellState> that represents the edge.
         * source - Boolean that specifies if the terminal is the source terminal.
         * defaultValue - Default value to be returned.
         */
        static getPortConstraints(terminal: CellState, edge: CellState, source: boolean, defaultValue: number): number {
            var value = Utils.getValue(terminal.style, Constants.stylePortConstraint, null);

            if (value == null) {
                return defaultValue;
            } else {
                var directions = value.toString();
                var returnValue = Constants.directionMaskNone;
                var constraintRotationEnabled = Utils.getInt(terminal.style, Constants.stylePortConstraintRotation, 0);
                var rotation = 0;

                if (constraintRotationEnabled === 1) {
                    rotation = Utils.getInt(terminal.style, Constants.styleRotation, 0);
                }

                var quad = 0;

                if (rotation > 45) {
                    quad = 1;

                    if (rotation >= 135) {
                        quad = 2;
                    }
                } else if (rotation < -45) {
                    quad = 3;

                    if (rotation <= -135) {
                        quad = 2;
                    }
                }

                if (directions.indexOf(Direction[Direction.North]) >= 0) {
                    switch (quad) {
                    case 0:
                        returnValue |= Constants.directionMaskNorth;
                        break;
                    case 1:
                        returnValue |= Constants.directionMaskEast;
                        break;
                    case 2:
                        returnValue |= Constants.directionMaskSouth;
                        break;
                    case 3:
                        returnValue |= Constants.directionMaskWest;
                        break;
                    }
                }
                if (directions.indexOf(Direction[Direction.West]) >= 0) {
                    switch (quad) {
                    case 0:
                        returnValue |= Constants.directionMaskWest;
                        break;
                    case 1:
                        returnValue |= Constants.directionMaskNorth;
                        break;
                    case 2:
                        returnValue |= Constants.directionMaskEast;
                        break;
                    case 3:
                        returnValue |= Constants.directionMaskSouth;
                        break;
                    }
                }
                if (directions.indexOf(Direction[Direction.South]) >= 0) {
                    switch (quad) {
                    case 0:
                        returnValue |= Constants.directionMaskSouth;
                        break;
                    case 1:
                        returnValue |= Constants.directionMaskWest;
                        break;
                    case 2:
                        returnValue |= Constants.directionMaskNorth;
                        break;
                    case 3:
                        returnValue |= Constants.directionMaskEast;
                        break;
                    }
                }
                if (directions.indexOf(Direction[Direction.East]) >= 0) {
                    switch (quad) {
                    case 0:
                        returnValue |= Constants.directionMaskEast;
                        break;
                    case 1:
                        returnValue |= Constants.directionMaskSouth;
                        break;
                    case 2:
                        returnValue |= Constants.directionMaskWest;
                        break;
                    case 3:
                        returnValue |= Constants.directionMaskNorth;
                        break;
                    }
                }

                return returnValue;
            }
        }

        /**
         * Returns true if the specified point (x, y) is contained in the given rectangle.
         * 
         * Parameters:
         * 
         * bounds - <mxRectangle> that represents the area.
         * x - X-coordinate of the point.
         * y - Y-coordinate of the point.
         */
        static contains(bounds: Rectangle, x: number, y: number) {
            return (bounds.x <= x && bounds.x + bounds.width >= x &&
                bounds.y <= y && bounds.y + bounds.height >= y);
        }

        // Reverse the port constraint bitmask. For example, north | east becomes south | west
        static reversePortConstraints(constraint: number): number {

            var result = 0;

            result |= (constraint & Constants.directionMaskWest) << 3;
            result |= (constraint & Constants.directionMaskNorth) << 1;
            result |= (constraint & Constants.directionMaskSouth) >> 1;
            result |= (constraint & Constants.directionMaskEast) >> 3;

            return result;
        }

        static intersection(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): Point {
            /// <summary>Returns the intersection of two lines as a Point</summary>
            /// <param name="x0">X-coordinate of the first line's startpoint</param>
            /// <param name="y0">Y-coordinate of the first line's startpoint</param>
            /// <param name="x1">X-coordinate of the first line's endpoint</param>
            /// <param name="y1">Y-coordinate of the first line's endpoint</param>
            /// <param name="x2">X-coordinate of the second line's startpoint</param>
            /// <param name="y2">Y-coordinate of the second line's startpoint</param>
            /// <param name="x3">X-coordinate of the second line's endpoint</param>
            /// <param name="y3">Y-coordinate of the second line's endpoint</param>

            var denom = ((y3 - y2) * (x1 - x0)) - ((x3 - x2) * (y1 - y0));
            var a = ((x3 - x2) * (y0 - y2)) - ((y3 - y2) * (x0 - x2));
            var b = ((x1 - x0) * (y0 - y2)) - ((y1 - y0) * (x0 - x2));

            var ua = a / denom;
            var ub = b / denom;

            if (ua >= 0.0 && ua <= 1.0 && ub >= 0.0 && ub <= 1.0) {
                // Get the intersection point
                var intersectionX = x0 + ua * (x1 - x0);
                var intersectionY = y0 + ua * (y1 - y0);

                return new Point(intersectionX, intersectionY);
            }

            // No intersection
            return null;
        }

        addTransparentBackgroundFilter(node: HTMLElement) {
            // deprecated
        }

        private static prefix: string =
        (Client.isOp && Client.isOt) ? "O" :
            (Client.isSf || Client.isGc) ? "Webkit" :
            (Client.isMt) ? "Moz" :
            (Client.isIe && document.documentMode >= 9 && document.documentMode < 10) ? "ms"
            : null;

        // Adds the given style with the standard name and an optional vendor prefix for the current browser.
        static setPrefixedStyle(style: CSSStyleDeclaration, name: string, value: string) {
            style[name] = value;

            if (Utils.prefix != null && name.length > 0) {
                name = Utils.prefix + name.substring(0, 1).toUpperCase() + name.substring(1);
                style[name] = value;
            }
        }

		static MiddlePoint(p0: Point, p1: Point): Point {
			return new Point((p0.x + p1.x) / 2, (p0.y + p1.y) / 2);
		}

        //  Returns a Point that represents the horizontal and vertical alignment for numeric computations. 
        // X is -0.5 for center, -1 for right and 0 for left alignment. Y is -0.5 for middle, -1 for bottom and 0 for top alignment. 
        // Default values for missing arguments is top, left.
        static getAlignmentAsPoint(align: string, valign: string): Point {
            var dx = 0;
            var dy = 0;

            // Horizontal alignment
            if (align == Constants.alignCenter) {
                dx = -0.5;
            } else if (align == Constants.alignRight) {
                dx = -1;
            }

            // Vertical alignment
            if (valign == Constants.alignMiddle) {
                dy = -0.5;
            } else if (valign == Constants.alignBottom) {
                dy = -1;
            }

            return new Point(dx, dy);
        }

        static getOffset(container: HTMLElement, scrollOffset: boolean = false): Point {
            /// <summary>Returns the offset for the specified container as a Point. The offset is the distance from the top left corner of the container to the top left corner of the document.</summary>
            /// <param name="container">DOM node to return the offset for</param>
            /// <param name="scollOffset">Optional boolean to add the scroll offset of the document.</param>
            var offsetLeft = 0;
            var offsetTop = 0;

            if (scrollOffset) {
                var offset = Utils.getDocumentScrollOrigin(container.ownerDocument);
                offsetLeft += offset.x;
                offsetTop += offset.y;
            }

            while (container.offsetParent) {
                offsetLeft += container.offsetLeft;
                offsetTop += container.offsetTop;

                container = <HTMLElement>(container.offsetParent);
            }

            return new Point(offsetLeft, offsetTop);
        }

        static getDocumentScrollOrigin(doc: Document): Point {
            /// <summary>Returns the scroll origin of the given document or the current document if no document is given.</summary>

            if (Client.isQuirks) {
                return new Point(doc.body.scrollLeft, doc.body.scrollTop);
            } else {
                var wnd = doc.defaultView || doc.parentWindow;

                var x = (wnd != null && window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || <Element>document.body.parentNode || document.body).scrollLeft;
                var y = (wnd != null && window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || <Element>document.body.parentNode || document.body).scrollTop;

                return new Point(x, y);
            }

        }

        static isNumeric(n: string): boolean {
            /// <summary>Returns true if the specified value is numeric, that is, if it is not null, not an empty string, not a HEX number and isNaN returns false.</summary>
            return !isNaN(parseFloat(n)) && isFinite(<any>n) && (typeof (n) != "string" || n.toLowerCase().indexOf("0x") < 0);
        }

        /**
         * Converts the specified point (x, y) using the offset of the specified
         * container and returns a new <mxPoint> with the result.
         * 
         * (code)
         * var pt = mxUtils.convertPoint(graph.container,
         *   mxEvent.getClientX(evt), mxEvent.getClientY(evt));
         * (end)
         * 
         * Parameters:
         * 
         * container - DOM node to use for the offset.
         * x - X-coordinate of the point to be converted.
         * y - Y-coordinate of the point to be converted.
         */
        static convertPoint(container: HTMLElement, x: number, y: number): Point {
            var origin = Utils.getScrollOrigin(container);
            var offset = Utils.getOffset(container);

            offset.x -= origin.x;
            offset.y -= origin.y;

            return new Point(x - offset.x, y - offset.y);
        }

        /**
         * Function: getScrollOrigin
         * 
         * Returns the top, left corner of the viewrect as an <mxPoint>.
         */
        static getScrollOrigin(node?: HTMLElement): Point {
            var b = document.body;
            var d = document.documentElement;
            var doc = (node != null) ? node.ownerDocument : document;
            var result = Utils.getDocumentScrollOrigin(doc);

            while (node != null && node != b && node != d) {
                if (!isNaN(node.scrollLeft) && !isNaN(node.scrollTop)) {
                    result.x += node.scrollLeft;
                    result.y += node.scrollTop;
                }

                node = <HTMLElement>(node.parentNode);
            }

            return result;
        }

        /**
         * Function: fit
         * 
         * Makes sure the given node is inside the visible area of the window. This
         * is done by setting the left and top in the style. 
         */
        static fit(node: HTMLElement) {
            var left = node.offsetLeft;
            var width = node.offsetWidth;

            var offset = Utils.getDocumentScrollOrigin(node.ownerDocument);
            var sl = offset.x;
            var st = offset.y;

            var b = document.body;
            var d = document.documentElement;
            var right = (sl) + (b.clientWidth || d.clientWidth);

            if (left + width > right) {
                node.style.left = Math.max(sl, right - width) + "px";
            }

            var top = node.offsetTop;
            var height = node.offsetHeight;

            var bottom = st + Math.max(b.clientHeight || 0, d.clientHeight);

            if (top + height > bottom) {
                node.style.top = Math.max(st, bottom - height) + "px";
            }
        }

        static ptSegDistSq(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number {
            /// <summary>Returns the square distance between a segment and a point.</summary>
            /// <param name="x1">X-coordinate of the startpoint of the segment</param>
            /// <param name="y1">Y-coordinate of the startpoint of the segment</param>
            /// <param name="x2">X-coordinate of the endpoint of the segment</param>
            /// <param name="y2">Y-coordinate of the endpoint of the segment</param>
            /// <param name="px">X-coordinate of the point</param>
            /// <param name="py">Y-coordinate of the point</param>
            x2 -= x1;
            y2 -= y1;

            px -= x1;
            py -= y1;

            var dotprod = px * x2 + py * y2;
            var projlenSq;

            if (dotprod <= 0.0) {
                projlenSq = 0.0;
            } else {
                px = x2 - px;
                py = y2 - py;
                dotprod = px * x2 + py * y2;

                if (dotprod <= 0.0) {
                    projlenSq = 0.0;
                } else {
                    projlenSq = dotprod * dotprod / (x2 * x2 + y2 * y2);
                }
            }

            var lenSq = px * px + py * py - projlenSq;

            if (lenSq < 0) {
                lenSq = 0;
            }

            return lenSq;
        }

        /**
         * Returns 1 if the given point on the right side of the segment, 0 if its
         * on the segment, and -1 if the point is on the left side of the segment.
         * 
         * Parameters:
         * 
         * x1 - X-coordinate of the startpoint of the segment.
         * y1 - Y-coordinate of the startpoint of the segment.
         * x2 - X-coordinate of the endpoint of the segment.
         * y2 - Y-coordinate of the endpoint of the segment.
         * px - X-coordinate of the point.
         * py - Y-coordinate of the point.
         */
        static relativeCcw(x1: number, y1: number, x2: number, y2: number, px: number, py: number): number {
            x2 -= x1;
            y2 -= y1;
            px -= x1;
            py -= y1;
            var ccw = px * y2 - py * x2;

            if (ccw == 0.0) {
                ccw = px * x2 + py * y2;

                if (ccw > 0.0) {
                    px -= x2;
                    py -= y2;
                    ccw = px * x2 + py * y2;

                    if (ccw < 0.0) {
                        ccw = 0.0;
                    }
                }
            }

            return (ccw < 0.0) ? -1 : ((ccw > 0.0) ? 1 : 0);
        }

        /**
         * Returns the current style of the specified element.
         * 
         * Parameters:
         * 
         * element - DOM node whose current style should be returned.
         */
        static getCurrentStyle(element: Element) {
            if (Client.isIe) {
                return (element != null) ? (<any>element).currentStyle : null;
            } else {
                return (element != null) ? window.getComputedStyle(element, "") : null;
            }
        }


        static nodeStyle(node: Node): CSSStyleDeclaration {
            if (node instanceof SVGGElement)
                return (<SVGGElement>node).style;
            else
                return (<HTMLElement>node).style;
        }

        static isNaN(value): boolean {
            return typeof(value) == "number" && isNaN(value);
        }

/**
             * Function: equalEntries
             * 
             * Returns true if all entries of the given objects are equal. Values with
             * with Number.NaN are equal to Number.NaN and unequal to any other value.
             * 
             * Parameters:
             * 
             * a - <mxRectangle> to be compared.
             * b - <mxRectangle> to be compared.
             */
        static equalEntries(a, b): boolean {
            if ((a == null && b != null) || (a != null && b == null) ||
            (a != null && b != null && a.length != b.length)) {
                return false;
            } else if (a != null && b != null) {
                for (var key in a) {
                    if (a.hasOwnProperty(key)) {
                        if ((!Utils.isNaN(a[key]) || !Utils.isNaN(b[key])) && a[key] != b[key]) {
                            return false;
                        }
                    }
                }
            }

            return true;
        }

        static hasScrollbars(node: HTMLElement): boolean {
            /// <returns type="boolean">Returns true if the overflow CSS property of the given node is either scroll or auto.</returns>
            /// <param name="node">DOM node whose style should be checked for scrollbars.</param>
            var style = Utils.getCurrentStyle(node);

            return style != null && (style.overflow == "scroll" || style.overflow == "auto");
        }

        static intersects(a, b: Rectangle): boolean {
            /// <summary>Returns true if the two rectangles intersect.</summary>
            var tw = a.width;
            var th = a.height;
            var rw = b.width;
            var rh = b.height;

            if (rw <= 0 || rh <= 0 || tw <= 0 || th <= 0) {
                return false;
            }

            var tx = a.x;
            var ty = a.y;
            var rx = b.x;
            var ry = b.y;

            rw += rx;
            rh += ry;
            tw += tx;
            th += ty;

            return ((rw < rx || rw > tx) &&
            (rh < ry || rh > ty) &&
            (tw < tx || tw > rx) &&
            (th < ty || th > ry));
        }

        static intersectsHotspot(state: CellState, x: number, y: number, hotspot: number, min: number, max: number): boolean {

            hotspot = (hotspot != null) ? hotspot : 1;
            min = (min != null) ? min : 0;
            max = (max != null) ? max : 0;

            if (hotspot > 0) {
                var cx = state.getCenterX();
                var cy = state.getCenterY();
                var w = state.width;
                var h = state.height;

                var start = Utils.getInt(state.style, Constants.styleStartsize, 0) * state.view.scale;

                if (start > 0) {
                    if (Utils.getBoolean(state.style, Constants.styleHorizontal, true)) {
                        cy = state.y + start / 2;
                        h = start;
                    } else {
                        cx = state.x + start / 2;
                        w = start;
                    }
                }

                w = Math.max(min, w * hotspot);
                h = Math.max(min, h * hotspot);

                if (max > 0) {
                    w = Math.min(w, max);
                    h = Math.min(h, max);
                }

                var rect = new Rectangle(cx - w / 2, cy - h / 2, w, h);
                var alpha = Utils.toRadians(Utils.getFloat(state.style, Constants.styleRotation, 0));

                if (alpha != 0) {
                    var cos = Math.cos(-alpha);
                    var sin = Math.sin(-alpha);
                    var c = new Point(state.getCenterX(), state.getCenterY());
                    var pt = Utils.getRotatedPoint(new Point(x, y), cos, sin, c);
                    x = pt.x;
                    y = pt.y;
                }

                return Utils.contains(rect, x, y);
            }

            return true;
        }

        static findNearestSegment(state: CellState, x: number, y: number) {
            /// <summary>Finds the index of the nearest segment on the given cell state for the specified coordinate pair.</summary>
            var index = -1;

            if (state.absolutePoints.length > 0) {
                var last = state.absolutePoints[0];
                var min = null;

                for (var i = 1; i < state.absolutePoints.length; i++) {
                    var current = state.absolutePoints[i];
                    var dist = Utils.ptSegDistSq(last.x, last.y,
                        current.x, current.y, x, y);

                    if (min == null || dist < min) {
                        min = dist;
                        index = i - 1;
                    }

                    last = current;
                }
            }

            return index;
        }

        static alert(message: string) {
            alert(message);
        }

        static setCellStyles(model: GraphModel, cells: Cell[], key: string, value) {
            /** Assigns the value for the given key in the styles of the given cells, or removes the key from the styles if the value is null. */
            if (cells != null && cells.length > 0) {
                model.beginUpdate();
                try {
                    for (var i = 0; i < cells.length; i++) {
                        if (cells[i] != null) {
                            var style = Utils.setStyle(model.getStyle(cells[i]), key, value);
                            model.setStyle(cells[i], style);
                        }
                    }
                } finally {
                    model.endUpdate();
                }
            }
        }

        static setStyle(style: string, key: string, value) {
            /** Adds or removes the given key, value pair to the style and returns the new style. If value is null or zero length then the key is removed from
             * the style. This is for cell styles, not for CSS styles.

             * style - String of the form [(stylename|key=value);].
             * key - Key of the style to be changed.
             * value - New value for the given key.
             */
            var isValue = value != null && (typeof (value.length) == "undefined" || value.length > 0);

            if (style == null || style.length == 0) {
                if (isValue) {
                    style = key + "=" + value;
                }
            } else {
                var index = style.indexOf(key + "=");

                if (index < 0) {
                    if (isValue) {
                        var sep = (style.charAt(style.length - 1) == ";") ? "" : ";";
                        style = style + sep + key + "=" + value;
                    }
                } else {
                    var tmp = (isValue) ? (key + "=" + value) : "";
                    var cont = style.indexOf(";", index);

                    if (!isValue) {
                        cont++;
                    }

                    style = style.substring(0, index) + tmp +
                    ((cont > index) ? style.substring(cont) : "");
                }
            }

            return style;
        }

        static getSizeForString(text: string, fontSize?: number, fontFamily?: string, maxWidth?: number): Rectangle {
            /**
             * Function: getSizeForString
             * 
             * Returns an <mxRectangle> with the size (width and height in pixels) of
             * the given string. The string may contain HTML markup. Newlines should be
             * converted to <br> before calling this method. The caller is responsible
             * for sanitizing the HTML markup.
             * 
             * Example:
             * 
             * (code)
             * var label = graph.getLabel(cell).replace(/\n/g, "<br>");
             * var size = graph.getSizeForString(label);
             * (end)
             * 
             * Parameters:
             * 
             * text - String whose size should be returned.
             * fontSize - Integer that specifies the font size in pixels. Default is
             * <mxConstants.DEFAULT_FONTSIZE>.
             * fontFamily - String that specifies the name of the font family. Default
             * is <mxConstants.DEFAULT_FONTFAMILY>.
             * textWidth - Optional width for text wrapping.
             */
            fontSize = fontSize || Constants.defaultFontSize;
            fontFamily = fontFamily || Constants.defaultFontFamily;
            var div = document.createElement("div");

            // Sets the font size and family
            div.style.fontFamily = fontFamily;
            div.style.fontSize = Math.round(fontSize) + "px";
            div.style.lineHeight = Math.round(fontSize * Constants.lineHeight) + "px";

            // Disables block layout and outside wrapping and hides the div
            div.style.position = "absolute";
            div.style.visibility = "hidden";
            div.style.display = (Client.isQuirks) ? "inline" : "inline-block";
            div.style.zoom = "1";

            if (maxWidth > 0) {
                div.style.maxWidth = maxWidth + "px";
                div.style.whiteSpace = "normal";
            } else {
                div.style.whiteSpace = "nowrap";
            }

            // Adds the text and inserts into DOM for updating of size
            div.innerHTML = text;
            document.body.appendChild(div);

            // Gets the size and removes from DOM
            var size = new Rectangle(0, 0, div.offsetWidth, div.offsetHeight);
            document.body.removeChild(div);

            return size;
        }

        static clearSelection() {
            /** Clears the current selection in the page. */
            if (document.selection) {
                return () => {
                    document.selection.empty();
                };
            } else if (window.getSelection) {
                return () => {
                    window.getSelection().removeAllRanges();
                };
            } else {
                return () => {};
            }
        }

        static setOpacity(node: Element, value: number) {
            /** Sets the opacity of the specified DOM node to the given value in %. */
            var style = Utils.nodeStyle(node);
            if (Client.isIe && (typeof (document.documentMode) === "undefined" || document.documentMode < 9)) {
                if (value >= 100) {
                    style.filter = null;
                } else {
                    style.filter = "alpha(opacity=" + value + ")";
                }
            } else {
                style.opacity = String(value / 100);
            }
        }

        static button(label: string, onPress: (evt: any) => void, doc?: Document): Node {
            /** Returns a new button with the given level and function as an onclick event handler.
             * label - String that represents the label of the button.
             * funct - Function to be called if the button is pressed.
             * doc - Optional document to be used for creating the button. Default is the current document. */
            doc = (doc != null) ? doc : document;

            var button = doc.createElement("button");
            Utils.write(button, label);

            Events.addListener(button, "click", evt => { onPress(evt); });

            return button;
        }

        static writeln(parent: HTMLElement, text: string) {
            var doc = parent.ownerDocument;
            var node = doc.createTextNode(text);

            parent.appendChild(node);
            parent.appendChild(document.createElement('br'));

            return node;
        }

        static br(parent: Element, count: number = 1): HTMLBRElement {
            var br: HTMLBRElement = null;

            for (var i = 0; i < count; i++) {
                if (parent != null) {
                    br = parent.ownerDocument.createElement('br');
                    parent.appendChild(br);
                }
            }
            return br;
        }

        /** Configures the given DOM element to act as a drag source for the specified graph. Returns a a new <mxDragSource>. 
        * If DragSource.guideEnabled is enabled then the x and y arguments must be used in funct to match the preview location.*/
        /*  element - DOM element to make draggable.
            graphF - <mxGraph> that acts as the drop target or a function that takes a mouse event and returns the current <mxGraph>.
        * funct - Function to execute on a successful drop.
        * dragElement - Optional DOM node to be used for the drag preview.
        * dx - Optional horizontal offset between the cursor and the drag preview.
        * dy - Optional vertical offset between the cursor and the drag preview.
        * autoscroll - Optional boolean that specifies if autoscroll should be used.Default is mxGraph.autoscroll.
        * scalePreview - Optional boolean that specifies if the preview element should be scaled according to the graph scale.If this is true, then
        * the offsets will also be scaled.Default is false.
        * highlightDropTargets - Optional boolean that specifies if dropTargets should be highlighted.Default is true.
        * getDropTarget - Optional function to return the drop target for a given location(x, y).Default is mxGraph.getCellAt. */
        static makeDraggable(element: HTMLElement,
            graphF: IGraphFactory,
            funct: IDropHandler,
            dragElement?: HTMLElement,
            dx: number = 0, dy: number = Constants.tooltipVerticalOffset,
            autoscroll?: boolean, scalePreview?: boolean, highlightDropTargets?: boolean, getDropTarget?: (graph: Graph, x: number, y: number, evt: MouseEvent) => Cell) {
            var dragSource = new DragSource(element, funct);
            dragSource.dragOffset = new Point(dx, dy);
            dragSource.autoscroll = autoscroll;

            // Cannot enable this by default. This needs to be enabled in the caller if the funct argument uses the new x- and y-arguments.
            dragSource.setGuidesEnabled(false);

            if (highlightDropTargets != null) {
                dragSource.highlightDropTargets = highlightDropTargets;
            }

            // Overrides function to find drop target cell
            if (getDropTarget != null) {
                dragSource.getDropTarget = getDropTarget;
            }

            // Overrides function to get current graph
            dragSource.getGraphForEvent = evt => graphF(evt);

            // Translates switches into dragSource customizations
            if (dragElement != null) {
                dragSource.createDragElement = () => <HTMLElement>dragElement.cloneNode(true);

                if (scalePreview) {
                    dragSource.createPreviewElement = graph => {
                        var elt = <HTMLElement>dragElement.cloneNode(true);

                        var w = parseInt(elt.style.width);
                        var h = parseInt(elt.style.height);
                        elt.style.width = Math.round(w * graph.view.scale) + 'px';
                        elt.style.height = Math.round(h * graph.view.scale) + 'px';

                        return elt;
                    };
                }
            }

            return dragSource;
        }

        static post(url: string, params: string, onLoad: IXmlRequestListener, onError: IXmlRequestListener) {
            return new XmlRequest(url, params).send(onLoad, onError);
        }

        static createXmlDocument(): Document {
            var doc = null;

            if (document.implementation && document.implementation.createDocument) {
                doc = document.implementation.createDocument('', '', null);
            }
            return doc;
        }

        /** Returns the first node where the given attribute matches the given value.
	     * @param node - Root node where the search should start.
	     * @param attr - Name of the attribute to be checked.
	     * @param value - Value of the attribute to match.
	     */
        static findNodeByAttribute(node: Node, attr: string, value: string): Node {
            // Workaround for missing XPath support in IE9
            if (document.documentMode >= 9) {
                var result: Node = null;
                if (node != null) {
                    if (node.nodeType == NodeType.Element && (<Element>node).getAttribute(attr) == value) {
                        result = node;
                    } else {
                        var child = node.firstChild;

                        while (child != null && result == null) {
                            result = Utils.findNodeByAttribute(child, attr, value);
                            child = child.nextSibling;
                        }
                    }
                }

                return result;
            } else if (Client.isIe) {
                if (node == null) {
                    return null;
                } else {
                    var expr = '//*[@' + attr + '=\'' + value + '\']';

                    return (<any>node.ownerDocument).selectSingleNode(expr);
                }
            } else {
                if (node == null) {
                    return null;
                } else {
                    var result1 = (<any>node.ownerDocument).evaluate('//*[@' + attr + '=\'' + value + '\']', node.ownerDocument, null, 0, null);

                    return result1.iterateNext();
                }
            }
        }

        /** Cross browser implementation for document.importNode. Uses document.importNodein all browsers but IE, where the node is cloned by creating a new node and
	 * copying all attributes and children into it using importNode, recursively.
	 * doc - Document to import the node into.
	 * node - Node to be imported.
	 * allChildren - If all children should be imported. */
        static importNode(doc: Document, node: Node, allChildren: boolean): Node {
            if (Client.isIe && (document.documentMode == null || document.documentMode < 10)) {
                switch (node.nodeType) {
                case NodeType.Element:
                {
                    var newNode = doc.createElement(node.nodeName);

                    if (node.attributes && node.attributes.length > 0) {
                        var i: number;
                        for (i = 0; i < node.attributes.length; i++) {
                            newNode.setAttribute(node.attributes[i].nodeName, (<Element>node).getAttribute(node.attributes[i].nodeName));
                        }

                        if (allChildren && node.childNodes && node.childNodes.length > 0) {
                            for (i = 0; i < node.childNodes.length; i++) {
                                newNode.appendChild(Utils.importNode(doc, node.childNodes[i], allChildren));
                            }
                        }
                    }
                    return newNode;
                }
                case NodeType.Text:
                case 4: /* cdata-section */
                case 8: /* comment */
                {
                    return doc.createTextNode(node.nodeValue);
                }
                }
            } else {
                return doc.importNode(node, allChildren);
            }
            return null;
        }

        /* Loads the specified URL *synchronously* and returns the XmlRequest. Throws an exception if the file cannot be loaded. See Utils.get for an asynchronous implementation. */
        static load(url: string): XmlRequest {
            var req = new XmlRequest(url, null, 'GET', false);
            req.send();
            return req;
        }

        /** Copies the styles and the markup from the graph's container into the given document and removes all cursor styles. The document is returned.
	     * This function should be called from within the document with the graph. If you experience problems with missing stylesheets in IE then try adding the domain to the trusted sites.
	     * graph - <mxGraph> to be copied.
	     * doc - Document where the new graph is created.
	     * x0 - X-coordinate of the graph view origin. Default is 0.
	     * y0 - Y-coordinate of the graph view origin. Default is 0.
	     * w - Optional width of the graph view.
	     * h - Optional height of the graph view.
	     */
        static show(graph: Graph, doc: Document, x0: number = 0, y0: number = 0, w?: number, h?: number) {

            if (doc == null) {
                var wnd = window.open();
                doc = wnd.document;
            } else {
                doc.open();
            }

            var bounds = graph.getGraphBounds();
            var dx = Math.ceil(x0 - bounds.x);
            var dy = Math.ceil(y0 - bounds.y);

            if (w == null) {
                w = Math.ceil(bounds.width + x0) + Math.ceil(Math.ceil(bounds.x) - bounds.x);
            }

            if (h == null) {
                h = Math.ceil(bounds.height + y0) + Math.ceil(Math.ceil(bounds.y) - bounds.y);
            }

            // Needs a special way of creating the page so that no click is required to refresh the contents after the external CSS styles have been loaded.
            // To avoid a click or programmatic refresh, the styleSheets[].cssText property is copied over from the original document.
            var base: NodeListOf<HTMLBaseElement>;
            var i;
            if (Client.isIe || document.documentMode == 11) {
                var html = '<html><head>';
                base = document.getElementsByTagName('base');
                for (i = 0; i < base.length; i++) {
                    html += base[i].outerHTML;
                }

                html += '<style>';

                // Copies the stylesheets without having to load them again
                for (i = 0; i < document.styleSheets.length; i++) {
                    try {
                        html += (<CSSStyleSheet>document.styleSheets[i]).cssText;
                    } catch (e) {
                        // ignore security exception
                    }
                }

                html += '</style></head><body style="margin:0px;">';

                // Copies the contents of the graph container
                html += '<div style="position:absolute;overflow:hidden;width:' + w + 'px;height:' + h + 'px;"><div style="position:relative;left:' + dx + 'px;top:' + dy + 'px;">';
                html += graph.container.innerHTML;
                html += '</div></div></body><html>';

                doc.writeln(html);
                doc.close();
            } else {
                doc.writeln('<html><head>');
                base = document.getElementsByTagName('base');
                for (i = 0; i < base.length; i++) {
                    doc.writeln(Utils.getOuterHtml(base[i]));
                }

                var links = document.getElementsByTagName('link');

                for (i = 0; i < links.length; i++) {
                    doc.writeln(Utils.getOuterHtml(links[i]));
                }

                var styles = document.getElementsByTagName('style');

                for (i = 0; i < styles.length; i++) {
                    doc.writeln(Utils.getOuterHtml(styles[i]));
                }

                doc.writeln('</head><body style="margin:0px;"></body></html>');
                doc.close();

                var outer = doc.createElement('div');
                outer.style.position = 'absolute';
                outer.style.overflow = 'hidden';
                outer.style.width = w + 'px';
                outer.style.height = h + 'px';

                // Required for HTML labels if foreignObjects are disabled
                var div = doc.createElement('div');
                div.style.position = 'absolute';
                div.style.left = dx + 'px';
                div.style.top = dy + 'px';

                var node = graph.container.firstChild;
                var svg: SVGSVGElement = null;

                while (node != null) {
                    var clone = node.cloneNode(true);

                    if (node == (<SVGElement>graph.view.getDrawPane()).ownerSVGElement) {
                        outer.appendChild(clone);
                        svg = <SVGSVGElement>(clone);
                    } else {
                        div.appendChild(clone);
                    }

                    node = node.nextSibling;
                }

                doc.body.appendChild(outer);

                if (div.firstChild != null) {
                    doc.body.appendChild(div);
                }

                if (svg != null) {
                    svg.style.minWidth = '';
                    svg.style.minHeight = '';
                    (<Element>svg.firstChild).setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
                }
            }

            Utils.removeCursors(doc.body);

            return doc;


        }

        /** Removes the cursors from the style of the given DOM node and its descendants. element - DOM node to remove the cursor style from. */
        private static removeCursors(element: Node) {
            if (Utils.nodeStyle(element) != null) {
                Utils.nodeStyle(element).cursor = '';
            }

            var children = element.childNodes;

            if (children != null) {
                var childCount = children.length;

                for (var i = 0; i < childCount; i += 1) {
                    Utils.removeCursors(children[i]);
                }
            }
        }

        /** Returns the outer HTML for the given node as a string or an empty string if no node was specified. The outer HTML is the text representing
	     * all children of the node including the node itself. node - DOM node to return the outer HTML for. */
        static getOuterHtml(node: HTMLElement): string {
            if (Client.isIe) {
                if (node != null) {
                    if (node.outerHTML != null) {
                        return node.outerHTML;
                    } else {
                        var tmp = [];
                        tmp.push('<' + node.nodeName);

                        var attrs = node.attributes;

                        if (attrs != null) {
                            for (var i = 0; i < attrs.length; i++) {
                                var value = attrs[i].nodeValue;

                                if (value != null && value.length > 0) {
                                    tmp.push(' ');
                                    tmp.push(attrs[i].nodeName);
                                    tmp.push('="');
                                    tmp.push(value);
                                    tmp.push('"');
                                }
                            }
                        }

                        if (node.innerHTML.length == 0) {
                            tmp.push('/>');
                        } else {
                            tmp.push('>');
                            tmp.push(node.innerHTML);
                            tmp.push('</' + node.nodeName + '>');
                        }

                        return tmp.join('');
                    }
                }

                return '';
            } else {
                if (node != null) {
                    // ReSharper disable once InconsistentNaming        
                    var serializer = new XMLSerializer();
                    return serializer.serializeToString(node);
                }

                return '';

            }
        }

        static getViewXml(graph: Graph, scale: number, cells?: Cell[], x0: number = 0, y0: number = 0) {
            x0 = (x0 != null) ? x0 : 0;
            y0 = (y0 != null) ? y0 : 0;
            scale = (scale != null) ? scale : 1;

            if (cells == null) {
                var model = graph.getModel();
                cells = [model.getRoot()];
            }

            var view = graph.getView();
            var result = null;

            // Disables events on the view
            var eventsEnabled = view.isEventsEnabled;
            view.isEventsEnabled = false;

            // Workaround for label bounds not taken into account for image export.
            // Creates a temporary draw pane which is used for rendering the text.
            // Text rendering is required for finding the bounds of the labels.
            var drawPane = view.drawPane;
            var overlayPane = view.overlayPane;

            if (graph.dialect == Dialect.Svg) {
                view.drawPane = document.createElementNS(Constants.nsSvg, 'g');
                view.canvas.appendChild(view.drawPane);

                // Redirects cell overlays into temporary container
                view.overlayPane = document.createElementNS(Constants.nsSvg, 'g');
                view.canvas.appendChild(view.overlayPane);
            } else {
                view.drawPane = <Element>view.drawPane.cloneNode(false);
                view.canvas.appendChild(view.drawPane);

                // Redirects cell overlays into temporary container
                view.overlayPane = <Element>view.overlayPane.cloneNode(false);
                view.canvas.appendChild(view.overlayPane);
            }

            // Resets the translation
            var translate = view.getTranslate();
            view.translate = new Point(x0, y0);

            // Creates the temporary cell states in the view
            var temp = new TemporaryCellStates(graph.getView(), scale, cells);

            try {
                var enc = new Codec();
                result = enc.encode(graph.getView());
            } finally {
                temp.destroy();
                view.translate = translate;
                view.canvas.removeChild(view.drawPane);
                view.canvas.removeChild(view.overlayPane);
                view.drawPane = drawPane;
                view.overlayPane = overlayPane;
                view.isEventsEnabled = eventsEnabled;
            }

            return result;
        }

        /** Returns the XML content of the specified node. For Internet Explorer, all \r\n\t[\t]* are removed from the XML string and the remaining \r\n
	     * are replaced by \n. All \n are then replaced with linefeed, or &#xa; if no linefeed is defined.
	     * node - DOM node to return the XML for.
	     * linefeed - Optional string that linefeeds are converted into. Default is  &#xa;
	     */
        static getXml(node: Element, linefeed: string) {

            var xml = '';

            if ((<any>window).XMLSerializer != null) {
                // ReSharper disable once InconsistentNaming
                var xmlSerializer = new XMLSerializer();
                xml = xmlSerializer.serializeToString(node);
            } else if ((<any>node).xml != null) {
                xml = (<any>node).xml.replace(/\r\n\t[\t]*/g, '').
                    replace(/>\r\n/g, '>').
                    replace(/\r\n/g, '\n');
            }

            // Replaces linefeeds with HTML Entities.
            linefeed = linefeed || '&#xa;';
            xml = xml.replace(/\n/g, linefeed);

            return xml;

        }

        /** Submits the given parameters to the specified URL using <mxXmlRequest.simulate> and returns the <mxXmlRequest>.
	     * Make sure to use encodeURIComponent for the parameter values.
	     * url - URL to get the data from.
	     * params - Parameters for the form.
	     * doc - Document to create the form in.
	     * target - Target to send the form result to. */
        static submit(url: string, params: string, doc: Document, target: string) {
            return new XmlRequest(url, params).simulate(doc, target);
        }

        /** Sorts the given cells according to the order in the cell hierarchy. Ascending is optional and defaults to true. */
        static sortCells(cells: Cell[], ascending: boolean): Cell[] {
            ascending = (ascending != null) ? ascending : true;
            var lookup = new Dictionary<Cell, string>();
            cells.sort((o1, o2) => {
                var p1 = lookup.get(o1);

                if (p1 == null) {
                    p1 = CellPath.create(o1).split(CellPath.pathSeparator)[0];
                    lookup.put(o1, p1);
                }

                var p2 = lookup.get(o2);

                if (p2 == null) {
                    p2 = CellPath.create(o2).split(CellPath.pathSeparator)[0];
                    lookup.put(o2, p2);
                }

                var comp = CellPath.compare(p1, p2);

                return (comp == 0) ? 0 : (((comp > 0) == ascending) ? 1 : -1);
            });

            return cells;

        }

        /** Sets or toggles the flag bit for the given key in the cell's styles. If value is null then the flag is toggled.
	     * model - <mxGraphModel> that contains the cells.
	     * cells - Array of <mxCells> to change the style for.
	     * key - Key of the style to be changed.
	     * flag - Integer for the bit to be changed.
	     * value - Optional boolean value for the flag. */
        static setCellStyleFlags(model: GraphModel, cells: Cell[], key: string, flag: number, value: boolean) {
            if (cells != null && cells.length > 0) {
                model.beginUpdate();
                try {
                    for (var i = 0; i < cells.length; i++) {
                        if (cells[i] != null) {
                            var style = Utils.setStyleFlag(model.getStyle(cells[i]), key, flag, value);
                            model.setStyle(cells[i], style);
                        }
                    }
                } finally {
                    model.endUpdate();
                }
            }
        }

        /** Sets or removes the given key from the specified style and returns the new style. If value is null then the flag is toggled. */
        static setStyleFlag(style: string, key: string, flag: number, value: boolean) {
            if (style == null || style.length == 0) {
                if (value || value == null) {
                    style = key + '=' + flag;
                } else {
                    style = key + '=0';
                }
            } else {
                var index = style.indexOf(key + '=');

                if (index < 0) {
                    var sep = (style.charAt(style.length - 1) == ';') ? '' : ';';

                    if (value || value == null) {
                        style = style + sep + key + '=' + flag;
                    } else {
                        style = style + sep + key + '=0';
                    }
                } else {
                    var cont = style.indexOf(';', index);
                    var tmp: string;

                    if (cont < 0) {
                        tmp = style.substring(index + key.length + 1);
                    } else {
                        tmp = style.substring(index + key.length + 1, cont);
                    }

                    if (value == null) {
                        tmp = "" + (parseInt(tmp) ^ flag);
                    } else if (value) {
                        tmp = "" + (parseInt(tmp) | flag);
                    } else {
                        tmp = "" + (parseInt(tmp) & ~flag);
                    }

                    style = style.substring(0, index) + key + '=' + tmp + ((cont >= 0) ? style.substring(cont) : '');
                }
            }

            return style;
        }

        private static errorImage = FileStructure.imageBasePath + '/error.gif';
        private static errorResource = (Client.language != 'none') ? 'error' : '';
        private static closeResource = (Client.language != 'none') ? 'close' : '';

        static prompt(message: string, defaultValue: string): string {
            return prompt(message, (defaultValue != null) ? defaultValue : '');
        }

        /** Displays the given error message in a new <mxWindow> of the given width. If close is true then an additional close button is added to the window.
	     * The optional icon specifies the icon to be used for the window. Default is <mxUtils.errorImage>.
	     * message - String specifying the message to be displayed.
	     * width - Integer specifying the width of the window.
	     * close - Optional boolean indicating whether to add a close button.
	     * icon - Optional icon for the window decoration. */
        static error(message: string, width: number, close: boolean, icon?: string) {
            var div = document.createElement('div');
            div.style.padding = '20px';

            var img = document.createElement('img');
            img.setAttribute('src', icon || Utils.errorImage);
            img.setAttribute('valign', 'bottom');
            img.style.verticalAlign = 'middle';
            div.appendChild(img);

            div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
            div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
            div.appendChild(document.createTextNode('\u00a0')); // &nbsp;
            Utils.write(div, message);

            var w = document.body.clientWidth;
            var h = (document.body.clientHeight || document.documentElement.clientHeight);
            var warn = new Window(Resources.get(Utils.errorResource), div, (w - width) / 2, h / 4, width, null,
                false, true);

            if (close) {
                Utils.br(div);

                var tmp = document.createElement('p');
                var button = document.createElement('button');

                if (Client.isIe) {
                    button.style.cssText = 'float:right';
                } else {
                    button.setAttribute('style', 'float:right');
                }

                Events.addListener(button, 'click', () => { warn.destroy(); });

                Utils.write(button, Resources.get(Utils.closeResource));

                tmp.appendChild(button);
                div.appendChild(tmp);

                Utils.br(div);

                warn.setClosable(true);
            }

            warn.setVisible(true);

            return warn;
        }

        /** Loads the specified URL *asynchronously* and invokes the given functions depending on the request status. Returns the <mxXmlRequest> in use. Both
	    * functions take the <mxXmlRequest> as the only parameter. See xUtils.load for a synchronous implementation. */
        static get(url: string, onload: (req: XmlRequest) => void, onerror: (req: XmlRequest) => void) {
            return new XmlRequest(url, null, 'GET').send(onload, onerror);
        }
    }

    interface ICellVisible {
        (cell: Cell): boolean;
    }

    interface IValidateCellState {
        (cell: Cell, recurse: boolean): CellState;        
    }

    /** Extends <mxPoint> to implement a 2-dimensional rectangle with double precision coordinates.
     * Constructs a new rectangle for the optional parameters. If no parameters are given then the respective default values are used.  */
    class TemporaryCellStates {
        constructor(view: GraphView, scale: number = 1, cells?: Cell[], isCellVisibleFn?: ICellVisible) {
            this.view = view;

            // Stores the previous state
            this.oldValidateCellState = view.validateCellState;
            this.oldBounds = view.getGraphBounds();
            this.oldStates = view.getStates();
            this.oldScale = view.getScale();

            // Overrides validateCellState to ignore invisible cells
            view.validateCellState = (cell) => {
                if (cell == null || isCellVisibleFn == null || isCellVisibleFn(cell)) {
                    return this.oldValidateCellState.apply(view, arguments);
                }

                return null;
            };

            // Creates space for new states
            view.setStates(new Dictionary<Cell, CellState>());
            view.setScale(scale);

            if (cells != null) {
                view.resetValidationState();
                var bbox: Rectangle = null;

                // Validates the vertices and edges without adding them to
                // the model so that the original cells are not modified
                for (var i = 0; i < cells.length; i++) {
                    var bounds = view.getBoundingBox(view.validateCellState(view.validateCell(cells[i])));

                    if (bbox == null) {
                        bbox = bounds;
                    } else {
                        bbox.add(bounds);
                    }
                }

                view.setGraphBounds(bbox || new Rectangle(0, 0));
            }
        }

        private view: GraphView;
        private oldStates: Dictionary<Cell, CellState>;
        private oldBounds: Rectangle;
        private oldScale: number;
        private oldValidateCellState: IValidateCellState;

        /** Returns the top, left corner as a new <mxPoint>. */
        destroy() {
            this.view.setScale(this.oldScale);
            this.view.setStates(this.oldStates);
            this.view.setGraphBounds(this.oldBounds);
            this.view.validateCellState = this.oldValidateCellState;
        }
    }

}

