/// <reference path="GraphLayout.ts"/>

module Five.Mindmap {
    export interface IBehavior {

    }

    export class MindMapBehavior implements IBehavior {
        private model: Model;
    }

    class Parameters {
        private remindUserAt: number;
    }

    class ArrowLink {
        private color: string;
        private destination: string;
        private endArrow: string;
        private endInclination: string;
        private id: string;
        private startArrow: string;
        private startInclination: string;
    }

    class Cloud {
        private color: string;
    }

    export class Edge {
        color: string;
        private style: string;
        private width: string;
    }

    export class Font {
        private bold: boolean;
        private italic: boolean;
        name: string;
        size: number;
    }

    class Hook {
        private parameters: Parameters;
        private text: string;
        private name: string;
    }

    class Icon {
        private builtIn: string;
    }

    enum NodePosition {
        Left,
        Right,
    }

    export interface ChildLink {
        child: Node;
        right?: boolean;
    }

    export class Node {
        private itemsField: Object[];
        private backgroundColor: string;
        private color: string;
        private folded: boolean;
        private id: string;
        private link: string;
        private position: NodePosition;
        private style: string;
        private _text: string;
        private created: number;
        private modified: number;
        private hGap: number;
        private vGap: number;
        private vShift: number;
        private encryptedContent: string;
        private arrowLinks: ArrowLink[];
        private cloud: Cloud[];
        private edge: Edge[];
        private font: Font[];
        private hook: Hook[];
        private icon: Icon[];
        cell: Cell;
        private _children: ChildLink[] = [];

        get text(): string { return this._text; }

        constructor(text: string) {
            this._text = text;
        }

        get children(): ChildLink[] { return this._children; }

        addChild(text: string, right?: boolean): Node {
            var child = new Node(text);
            this._children.push({ child: child, right: right });
            return child;
        }

    }

    export class Model {
        private _root: Node;
        private version: string;
        private name: string;
        private date: number;
        private file: string;
        private mapid: number;
        private bgcolor: string;

        get root(): Node { return this._root }

        createRoot(text: string): Node {
            var node = new Node(text);
            this._root = node;
            return node;
        }
    }

    export class MmFileReader {
        static read(content: string): Model {
            var doc = Utils.parseXml(content);
            var mm = new Model();
            var mapElement = doc.documentElement;
            if (mapElement == null)
                throw new Error("invalid MM file format: no root node");
            if (mapElement.nodeName != "map")
                throw new Error("invalid MM file format: map root node expected");
            var rootNode = mapElement.firstElementChild;
            if (rootNode != null) {
                if (rootNode.nodeName != "node")
                    throw new Error("invalid MM file format: first element under the map should be node");
                var root = mm.createRoot(rootNode.getAttribute("TEXT"));

                var appendChildren = (xmlNode: Element, modelNode: Node) => {
                    for (var i = 0; i < xmlNode.childNodes.length; i++) {
                        var xmlChild = xmlNode.childNodes[i];
                        if (xmlChild.nodeName === "node") {
                            var element = (<Element>xmlChild);
                            var positionText = element.getAttribute("POSITION");
                            var right: boolean = null;
                            switch (positionText) {
                            case "right":
                                right = true;
                                break;
                            case "left":
                                right = false;
                                break;

                            default:
                            }
                            var modelChild = modelNode.addChild(element.getAttribute("TEXT"), right);
                            appendChildren(element, modelChild);
                        }
                    }
                }
                appendChildren(rootNode, root);
            }
            return mm;
        }     
    }

    export class Adaptor {
        constructor(private graph: Graph, private mindmap: Model) {
            graph.setAutoSizeCells(true);
            graph.autoSizeCellsOnAdd = true;
	        graph.resizeContainer = true;
            graph.htmlLabels = true; // required for text to be wrapped.
        }

        private static rootStyleName = "mmRoot";
        private static childLinkStyleName = "mmChildLink";
        private cellNodeMap: {[cellId: number] : Node} = {};

        private createStyles(styleSheet: Stylesheet) {
            Constants.rectangleRoundingFactor = 0.35;
            Constants.shadowColor = "rgba(204, 204, 204, 0.8)";
            var vStyle = styleSheet.getDefaultVertexStyle();
            vStyle[Constants.styleShape] = Constants.shapeRectangle;
            vStyle[Constants.styleFontsize] = "14";
            vStyle[Constants.styleFontcolor] = "black";
            vStyle[Constants.styleStrokecolor] = "BurlyWood";
            vStyle[Constants.styleFillcolor] = "cornsilk";
            vStyle[Constants.styleShadow] = "1";
            vStyle[Constants.styleRounded] = "1";
            vStyle[Constants.styleOverflow] = "width";
            vStyle[Constants.styleAutosize] = "1";
            vStyle[Constants.styleWhiteSpace] = "wrap";
            //styleSheet.putCellStyle(Adaptor.rootStyleName, vStyle);

            var eStyle = styleSheet.getDefaultEdgeStyle();
            eStyle[Constants.styleStrokecolor] = "brown";
            eStyle[Constants.styleCurved] = "1";
            eStyle[Constants.styleStartarrow] = Constants.none;
            eStyle[Constants.styleEndarrow] = Constants.none;
            eStyle[Constants.styleEdge] = Constants.edgestyleTopToSide;
            //eStyle[Constants.styleRounded] = "1";
            //styleSheet.putCellStyle(Adaptor.rootStyleName, vStyle);
        }

        private renderNode(node: Node, parent: Cell): Cell {
            var cell = this.graph.insertVertex(parent, null, node.text, 0, 0, 160, 40, null, false, this.nodeSizeRestriction);
            node.cell = cell;
            cell.semanticObject = node;
            node.children.forEach(c => {
                var child = this.renderNode(c.child, parent);
                this.graph.insertEdge(null, null, null, cell, child, null);
            });
            return cell;
        }

        render() {
            this.createStyles(this.graph.getStylesheet());
            var parent = this.graph.getDefaultParent();
            this.renderNode(this.mindmap.root, parent);
            new MindmapLayout(this.graph).execute(parent);
        }

        nodeSizeRestriction: ICellSizeRestrictions = {
            minHeight: () => 40,
            maxWidth: () => 160
        };
    }

    class MindmapLayout extends BasicLayout implements ILayout {
        static xOffset = 40;
        static yOffset = 20;

        public execute(parent: Cell) {
            if (parent != null) {
                var width = this.graph.container.offsetWidth - 1;
                var height = this.graph.container.offsetHeight - 1;
                var model = this.graph.getModel();

                model.beginUpdate();
                try {
                    var root = <Node>parent.getChildAt(0).semanticObject;

					var getChildren = (node: Node, right?: boolean) => node.children.filter(c => c.right == null || c.right === right).map(c => c.child);

					var nodeWeights = new Dictionary<Node, number>();
					var getNodeWeight = (node: Node, right?: boolean): number => {
						var result = nodeWeights.get(node);
						if (result == null) {
							var children = getChildren(node, right);
							if (children.length == 0)
								result = node.cell.geometry.height;
							else {
								result = _.sum(children, c => getNodeWeight(c)) + (children.length - 1) * MindmapLayout.yOffset;
							}
							if (node != root)
								nodeWeights.put(node, result);
						}
						return result;
					}

					var treeHeight = _.max([getNodeWeight(root, false), getNodeWeight(root, true)]);
					height = _.max([height, treeHeight]);

                    var geo = root.cell.getGeometry().clone();
					//                    geo.translate(width / 2 - geo.x - geo.width / 2, height / 2 - geo.y - geo.height / 2);
					var dy = height > geo.height ? height / 2 - geo.y - geo.height / 2 : -geo.y;
					geo.translate(width / 2 - geo.x - geo.width / 2, dy);
                    root.cell.setGeometry(geo);


					var layoutSide = (right ?: boolean) => {

		                var layoutChildren = (parent: Node, right?: boolean) => {
			                var parentGeo = parent.cell.geometry;
			                var x = right ? parentGeo.x + parentGeo.width + MindmapLayout.xOffset : parentGeo.x - MindmapLayout.xOffset;
			                var children = getChildren(parent, right);
			                if (children.length > 0) {
				                var childrenHeight = getNodeWeight(parent, right);
				                var y = parentGeo.y + parentGeo.height / 2 - childrenHeight / 2;
				                for (var i = 0; i < children.length; i++) {
					                var child = children[i];
					                var geo = child.cell.getGeometry().clone();
					                y += nodeWeights.get(child) / 2 - geo.height / 2;
					                geo.translate(right ? x - geo.x : x - geo.x - geo.width, y - geo.y);
					                child.cell.setGeometry(geo);
									y += nodeWeights.get(child) / 2 + geo.height / 2 + MindmapLayout.yOffset;
					                layoutChildren(child, right);
				                }
			                }
						}
						layoutChildren(root, right);
					}
	                layoutSide(false);
                    layoutSide(true);

                } finally {
                    model.endUpdate();
                }
            }
        }


    }
}