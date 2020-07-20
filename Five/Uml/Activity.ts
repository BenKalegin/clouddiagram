module Five.Uml {

    export class Node {
        name: string;
	    cell: Cell;
    }

    export class InitialNode {
        
    }

    export class Edge {
        name: string;
        source: Node;
        target: Node;
    }

    export class Package {
        packages: Package[] = [];
        elements: Node[] = [];
        edges: Edge[];
    }

    class Activity extends Node {
    }

    export class Model extends Package{
    }

    export class Adaptor {
        constructor(private graph: Graph, private mindmap: Model) {
            graph.setAutoSizeCells(true);
            graph.autoSizeCellsOnAdd = true;
            graph.htmlLabels = true; // required for text to be wrapped.
        }

        private static rootStyleName = "mmRoot";
        private static childLinkStyleName = "mmChildLink";
        private cellNodeMap: { [cellId: number]: Node } = {};

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
            //styleSheet.putCellStyle(Adaptor.rootStyleName, vStyle);
        }

        private renderNode(node: Node, parent: Cell): Cell {
            var cell = this.graph.insertVertex(parent, null, node.name, 300, 300, 160, 40, null, false, this.nodeSizeRestriction);
            node.cell = cell;
            cell.semanticObject = node;
//            node.children.forEach(c => {
//                var child = this.renderNode(c.child, parent);
//                this.graph.insertEdge(null, null, null, cell, child, Adaptor.childLinkStyleName);
//            });
            return cell;
        }

        render() {
            this.createStyles(this.graph.getStylesheet());
            var parent = this.graph.getDefaultParent();
//            this.renderNode(this.mindmap.root, parent);
            //new MindmapLayout(this.graph).execute(parent);
        }

        nodeSizeRestriction: ICellSizeRestrictions = {
            minHeight: () => 40,
            maxWidth: () => 160
        };
    }

} 