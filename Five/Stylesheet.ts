module Five {

    export interface IStyle {
        [key: string] : string; 
    }

    export class Stylesheet {
        constructor() {
            this.putDefaultVertexStyle(this.createDefaultVertexStyle());
            this.putDefaultEdgeStyle(this.createDefaultEdgeStyle());            
        }

        styles: { [key: string] : IStyle} = {};


        getDefaultEdgeStyle(): { [key: string]: string } {
            /// <summary>Returns the default style for vertices</summary>
            return this.styles["defaultEdge"];
        }

        getDefaultVertexStyle(): { [key: string]: string } {
            /// <summary> Returns the default style for vertices.</summary>
            return this.styles["defaultVertex"];
        }

        private createDefaultVertexStyle() {
            var style: IStyle = {};

            style[Constants.styleShape] = Constants.shapeRectangle;
            style[Constants.stylePerimeter] = Constants.perimeterRectangle;
            style[Constants.styleVerticalAlign] = Constants.alignMiddle;
            style[Constants.styleAlign] = Constants.alignCenter;
            style[Constants.styleFillcolor] = "#C3D9FF";
            style[Constants.styleStrokecolor] = "#6482B9";
            style[Constants.styleFontcolor] = "#774400";

            return style;
        }

        private createDefaultEdgeStyle() {
            var style = new Object();

            style[Constants.styleShape] = Constants.shapeConnector;
            style[Constants.styleEndarrow] = Constants.arrowClassic;
            style[Constants.styleVerticalAlign] = Constants.alignMiddle;
            style[Constants.styleAlign] = Constants.alignCenter;
            style[Constants.styleStrokecolor] = "#6482B9";
            style[Constants.styleFontcolor] = "#446299";

            return style;
        }

        putDefaultVertexStyle(style) {
            this.putCellStyle("defaultVertex", style);
        }

        putDefaultEdgeStyle(style) {
            this.putCellStyle("defaultEdge", style);
        }

        putCellStyle(name, style) {
            this.styles[name] = style;
        }

        getCellStyle(name: string, defaultStyle: { [key: string]: string }) {
            /// <summary>Returns the cell style for the specified stylename or the given defaultStyle if no style can be found for the given stylename.</summary>
            /// <param name="name">String of the form [(stylename|key=value);] that represents the style.</param>
            /// <param name="defaultStyle">Default style to be returned if no style can be found.</param>
            var style = defaultStyle;

            if (name != null && name.length > 0) {
                var pairs = name.split(";");

                if (style != null && name.charAt(0) != ";") {
                    style = Utils.clone(style);
                } else {
                    style = {};
                }

                // Parses each key, value pair into the existing style
                for (var i = 0; i < pairs.length; i++) {
                    var tmp = pairs[i];
                    var pos = tmp.indexOf("=");

                    if (pos >= 0) {
                        var key = tmp.substring(0, pos);
                        var value = tmp.substring(pos + 1);

                        if (value == Constants.none) {
                            delete style[key];
                        } else if (Utils.isNumeric(value)) {
                            style[key] = parseFloat(value).toString();
                        } else {
                            style[key] = value;
                        }
                    } else {
                        // Merges the entries from a named style
                        var tmpStyle = this.styles[tmp];

                        if (tmpStyle != null) {
                            for (var key1 in tmpStyle) {
                                if (tmpStyle.hasOwnProperty(key1)) {
                                    style[key1] = tmpStyle[key1];
                                }
                            }
                        }
                    }
                }
            }

            return style;
        }
    }        
}