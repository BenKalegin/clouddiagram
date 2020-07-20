namespace CloudDiagram.Uml {
    import Cell = Five.Cell;
    import Graph = Five.Graph;
    import Constants = Five.Constants;
    import Stylesheet = Five.Stylesheet;
    import CellSizeRestrictions = Five.ICellSizeRestrictions;
    import IBehavior = Five.IBehavior;
    import IPresenter = Five.IPresenter;
    import BehaviorAction = Five.IBehaviorAction;
    import MindMapDto = Web.Models.MindMapDto;
    import Rectangle = Five.Rectangle;
    import IPresentationElement = Five.IPresentationElement;
    import IPresentationFactory = Five.IPresentationFactory;
    import IPresentationNodeElement = Five.IPresentationNodeElement;
    import ShapeStyle = Five.ShapeStyle;
    import Overflow = Five.Overflow;
    import Whitespace = Five.Whitespace;
    import AppliedStyle = Five.AppliedStyle;
    import IPresentationLinkElement = Five.IPresentationLinkElement;
    import behaviorAction = Five.behaviorAction;
    import KeyCode = Five.KeyCode;
    import KeyModifier = Five.KeyModifier;
    import IPresentationSelection = Five.IPresentationSelection;
    import Utils = Five.Utils;
    import StringDictionary = Five.StringDictionary;
    import INodeStyle = Five.INodeStyle;

    class Node {
        view: Five.IPresentationNodeElement;

        private _text: string;
        get text(): string { return this._text; }

        constructor(text: string) {
            this._text = text;
        }
    }

    class InitialNode extends Node {
        
    }

    class Edge {
        name: string;
        source: Node;
        target: Node;
        view: IPresentationElement;
    }

    class Package {
        packages: Package[] = [];
        elements: Node[] = [];
        edges: Edge[] = [];

        createInitial(text: string) : InitialNode {
            return new InitialNode(text);
        }
    }

    class Activity extends Node {
    }

    class Model extends Package{
    }

    class Adaptor {
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
            vStyle.shape = ShapeStyle.Rectangle;
            vStyle.fontSize = 14;
            vStyle.fontColor = "black";
            vStyle.strokeColor = "BurlyWood";
            vStyle.fillColor = "cornsilk";
            vStyle.shadow = true;
            vStyle.rounded = true;
            vStyle.overflow = Overflow.width;
            vStyle.autoSize = true;
            vStyle.whitespace = Whitespace.wrap;
            //styleSheet.putCellStyle(Adaptor.rootStyleName, vStyle);

            var eStyle = styleSheet.getDefaultEdgeStyle();
            eStyle.strokeColor = "brown";
            //styleSheet.putCellStyle(Adaptor.rootStyleName, vStyle);
        }

        private renderNode(node: Node, parent: Cell): Cell {
//            var cell = this.graph.insertVertex(parent, null, node.name, 300, 300, 160, 40, null, false, this.nodeSizeRestriction);
//            node.cell = cell;
//            cell.semanticObject = node;
//            node.children.forEach(c => {
//                var child = this.renderNode(c.child, parent);
//                this.graph.insertEdge(null, null, null, cell, child, Adaptor.childLinkStyleName);
//            });
//            return cell;
            return null;
        }

        render() {
            this.createStyles(this.graph.getStylesheet());
            var parent = this.graph.getDefaultParent();
//            this.renderNode(this.mindmap.root, parent);
            //new MindmapLayout(this.graph).execute(parent);
        }

        nodeSizeRestriction: CellSizeRestrictions = {
            minHeight: () => 40,
            maxWidth: () => 160
        };
    }


    export function createActivity(): IBehavior {
        return new ActivityBehavior();
    }

    class ActivityBehavior implements IBehavior {
        private presenter: IPresenter;
        private model: Model;
        dockPanelFactory: IOverlayFactory;

        constructor() {
            this.setupActions();
        }

        nodeSizeRestriction: CellSizeRestrictions = {
            minHeight: () => 10
        };

        actions: BehaviorAction[];

        setupActions() {
            this.actions = [
                behaviorAction("Add Start", 1, KeyCode.tab, KeyModifier.none,() => true, (s) => this.insertStart(s))
            ];
        }

        setPresentation(presenter: IPresenter): void {
            this.presenter = presenter;
            ActivityStyler.setupStyles(presenter.getStylesheet());
            ActivityStyler.configurePresenter(presenter);
        }


        bootstrap(): void {
            var model = new Model();
            model.createInitial("Start");
            this.importModel(model);
        }

        private resolveDefaultStyle(node: Node) : string {
            if (node instanceof InitialNode)
                return ActivityStyler.initialStyle;
            return ActivityStyler.defaultStyle;
        }

        private createDefaultNodeView(node: Node, cachedFactory?: IPresentationFactory): IPresentationNodeElement {
            var factory = cachedFactory ? cachedFactory : this.presenter.getFactory();
            var view = factory.insertNode(this.presenter.getRootParent(), node.text, ActivityStyler.defaultNodeSize,
                new AppliedStyle(this.resolveDefaultStyle(node)), false, this.nodeSizeRestriction);
            node.view = view;
            view.semanticObject = node;
            return view;
        }

        private presentElement(model: Node, parent: IPresentationElement, factory: IPresentationFactory): IPresentationNodeElement {
            var view = this.createDefaultNodeView(model, factory);
            return view;
        }

        private PresentPackage(pack: Package, parent: IPresentationElement, factory: IPresentationFactory): void  {

            pack.elements.forEach(e => {
                this.presentElement(e, parent, factory);
            });
            pack.edges.forEach(e => {
                this.createDefaultLinkView(e, e.source, e.target);
            });
        }

        private importModel(model: Model) {

            var presentationModel = this.presenter.getModel();
            var factory = this.presenter.getFactory();
            presentationModel.beginUpdate();
            try {
                var parent = this.presenter.getRootParent();
                this.model = model;
                this.PresentPackage(model, parent, factory);
            } finally {
                // Updates the display
                presentationModel.endUpdate();
            }
        }

        private createDefaultLinkView(edge: Edge, source: Node, target: Node, cachedFactory?: IPresentationFactory): IPresentationLinkElement {
            var factory = cachedFactory ? cachedFactory : this.presenter.getFactory();
            var view = factory.insertLink(this.presenter.getRootParent(), null, source.view, target.view, new AppliedStyle(ActivityStyler.defaultLinkStyle));
            edge.view = view;
            view.semanticObject = edge;
            return view;
        }

        getDiagram(): MindMapDto {
            return null;
        }

        load(mindMapDto: MindMapDto): void {
        }

        allowResize: boolean = false;

        setDockPanelFactory(dockPanelFactory: IOverlayFactory) {
            this.dockPanelFactory = dockPanelFactory;
        }

        insertStart(presentationSelection: IPresentationSelection): void {
            var presentationModel = this.presenter.getModel();
            presentationModel.beginUpdate();
            try {
                var model = new InitialNode("start");
                var view = this.createDefaultNodeView(model);
                this.presenter.setSelection([view]);
            } finally {
                presentationModel.endUpdate();
            }
        }

        menuCaption(): string {
            return "Activity";
        }
    }
    class ActivityStyler {

        static configurePresenter(presenter: IPresenter) {
            var config = presenter.configuration();
            config.setAutoSizeCells(true);
            config.setAutoSizeCellsOnAdd(true);
            config.setResizeContainer(false);
            config.setHtmlLabels(true); // required for text to be wrapped.
        }

        static defaultNodeSize = new Rectangle(0, 0, 160, 40);
        static defaultStyle: string = null;
        static defaultLinkStyle: string = null;
        static initialStyle: string = "initial";


        static setupStyles(styleSheet: Stylesheet) {
            var defNodeStyle = styleSheet.getDefaultVertexStyle();
            defNodeStyle.fillColor = "cornsilk";
            defNodeStyle.strokeColor = "BurlyWood";
            defNodeStyle.shape = ShapeStyle.Rectangle;
            defNodeStyle.fontSize = 14;
            defNodeStyle.fontColor = "black";
            defNodeStyle.shadow = true;
            defNodeStyle.rounded = true;
            defNodeStyle.overflow = Overflow.width;
            defNodeStyle.autoSize = true;
            defNodeStyle.whitespace = Whitespace.wrap;

            var initialStyle = Utils.clone(defNodeStyle);
            initialStyle.shape = ShapeStyle.Ellipse;
            initialStyle.entryX = 100;
            styleSheet.putCellStyle(this.initialStyle, initialStyle);

        }

    }



} 