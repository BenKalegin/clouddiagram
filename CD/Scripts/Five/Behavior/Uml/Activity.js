var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Five;
(function (Five) {
    var Uml;
    (function (Uml) {
        var Node = (function () {
            function Node() {
            }
            return Node;
        })();
        Uml.Node = Node;
        var InitialNode = (function () {
            function InitialNode() {
            }
            return InitialNode;
        })();
        Uml.InitialNode = InitialNode;
        var Edge = (function () {
            function Edge() {
            }
            return Edge;
        })();
        Uml.Edge = Edge;
        var Package = (function () {
            function Package() {
                this.packages = [];
                this.elements = [];
            }
            return Package;
        })();
        Uml.Package = Package;
        var Activity = (function (_super) {
            __extends(Activity, _super);
            function Activity() {
                _super.apply(this, arguments);
            }
            return Activity;
        })(Node);
        var Model = (function (_super) {
            __extends(Model, _super);
            function Model() {
                _super.apply(this, arguments);
            }
            return Model;
        })(Package);
        Uml.Model = Model;
        var Adaptor = (function () {
            function Adaptor(graph, mindmap) {
                this.graph = graph;
                this.mindmap = mindmap;
                this.cellNodeMap = {};
                this.nodeSizeRestriction = {
                    minHeight: function () { return 40; },
                    maxWidth: function () { return 160; }
                };
                graph.setAutoSizeCells(true);
                graph.autoSizeCellsOnAdd = true;
                graph.htmlLabels = true;
            }
            Adaptor.prototype.createStyles = function (styleSheet) {
                Five.Constants.rectangleRoundingFactor = 0.35;
                Five.Constants.shadowColor = "rgba(204, 204, 204, 0.8)";
                var vStyle = styleSheet.getDefaultVertexStyle();
                vStyle[Five.Constants.styleShape] = Five.Constants.shapeRectangle;
                vStyle[Five.Constants.styleFontsize] = "14";
                vStyle[Five.Constants.styleFontcolor] = "black";
                vStyle[Five.Constants.styleStrokecolor] = "BurlyWood";
                vStyle[Five.Constants.styleFillcolor] = "cornsilk";
                vStyle[Five.Constants.styleShadow] = "1";
                vStyle[Five.Constants.styleRounded] = "1";
                vStyle[Five.Constants.styleOverflow] = "width";
                vStyle[Five.Constants.styleAutosize] = "1";
                vStyle[Five.Constants.styleWhiteSpace] = "wrap";
                var eStyle = styleSheet.getDefaultEdgeStyle();
                eStyle[Five.Constants.styleStrokecolor] = "brown";
            };
            Adaptor.prototype.renderNode = function (node, parent) {
                return null;
            };
            Adaptor.prototype.render = function () {
                this.createStyles(this.graph.getStylesheet());
                var parent = this.graph.getDefaultParent();
            };
            Adaptor.rootStyleName = "mmRoot";
            Adaptor.childLinkStyleName = "mmChildLink";
            return Adaptor;
        })();
        Uml.Adaptor = Adaptor;
    })(Uml = Five.Uml || (Five.Uml = {}));
})(Five || (Five = {}));
//# sourceMappingURL=Activity.js.map