/// <reference path="../../Five/GraphLayout.ts"/>
/// <reference path="../../Five/Stylesheet.ts"/>

"use strict";

module CloudDiagram {
    import MindMapNode = Web.Models.MindMapNode;
    import MindMapLink = Web.Models.MindMapLink;
    import MindMapDto = Web.Models.MindMapDto;
    import PresentationLinkElement = Five.IPresentationLinkElement;
    import IPresentationNodeElement = Five.IPresentationNodeElement;
    import Utils = Five.Utils;
    import Presenter = Five.IPresenter;
    import Rectangle = Five.Rectangle;
    import Constants = Five.Constants;
    import BasicLayout = Five.BasicLayout;
    import Layout = Five.ILayout;
    import IPresentationModel = Five.IPresentationModel;
    import Graph = Five.Graph;
    import Cell = Five.Cell;
    import Dictionary = Five.Dictionary;
    import CellSizeRestrictions = Five.ICellSizeRestrictions;
    import IPresentationSelection = Five.IPresentationSelection;
    import IPresentationFactory = Five.IPresentationFactory;
    import IPresentationElement = Five.IPresentationElement;
    import IBehavior = Five.IBehavior;
    import IBehaviorAction = Five.IBehaviorAction;
    import behaviorAction = Five.behaviorAction;
    import KeyCode = Five.KeyCode;
    import KeyModifier = Five.KeyModifier;
    import Stylesheet = Five.Stylesheet;
    import Point = Five.Point;
    import ShapeStyle = Five.ShapeStyle;
    import Overflow = Five.Overflow;
    import Whitespace = Five.Whitespace;
    import ArrowStyle = Five.ArrowStyle;
    import EdgeKind = Five.EdgeKind;
    import AppliedStyle = Five.AppliedStyle;
    import MindMapNodeStyle = Web.Models.MindMapNodeStyle;
    import INodeStyle = Five.INodeStyle;
    import StringDictionary = Five.StringDictionary;

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

    interface IChildLink {
        child: Node;
        left?: boolean;
        view: PresentationLinkElement;
    }

    class NodeDecarator {
        private backgroundColor: string;
        private color: string;
        private folded: boolean;
        private id: string;
        private link: string;
        private position: NodePosition;
        private style: string;
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
    }

    class Node {
        //private itemsField: Object[];

        view: IPresentationNodeElement;

        private children_: IChildLink[] = [];
        get children(): IChildLink[] { return this.children_; }

        private text_: string;
        get text(): string { return this.text_; }

        private parent_: Node;
        get parent(): Node { return this.parent_; }

        set parent(value: Node) { this.parent_ = value; }

        private style_: AppliedStyle;
        get style(): AppliedStyle { return this.style_; }

        set style(value: AppliedStyle) {
            this.style_ = value;
            this.view.setNodeStyle(value);
        }

        constructor(text: string, parent: Node, style: AppliedStyle) {
            this.text_ = text;
            this.parent_ = parent;
            this.style_ = style;
        }

        findChildLink(child: Node): IChildLink {
            for (var i = 0; i < this.children_.length; i++) {
                if (this.children_[i].child === child) {
                    return this.children_[i];
                }
            }
            return null;
        }

        addChild(text: string, left?: boolean): Node {
            var child = new Node(text, this, this.style_);
            this.appendChild(child, left);
            return child;
        }

        appendChild(child: Node, left?: boolean) {
            this.children_.push({ child: child, left: left, view: null });
            child.parent = this;
        }

        addChildAfter(text: string, sibling: Node) {
            var child = new Node(text, this, sibling.parent.style_);
            // find sibling's index in children list
            var siblingLink = this.findChildLink(sibling);
            if (!siblingLink)
                throw new Error("Cannot found child");
            var index = this.children.indexOf(siblingLink);
            this.children_.splice(index +1, 0, { child: child, left: siblingLink.left, view: null});
            return child;
        }

        removeChild(child: Node) {
            var link = this.findChildLink(child);
            this.children.splice(this.children.indexOf(link), 1);
            child.parent = null;
        }

    }

    class Model {
        private root_: Node;
        private version: string;
        private name: string;
        
        get root(): Node { return this.root_ }

        createRoot(text: string): Node {
            var node = new Node(text, null, null);
            this.root_ = node;
            return node;
        }
    }

    class MmFileFormat {
        static read(content: string): Model {
            var doc = Utils.parseXml(content);
            var mm = new Model();
            var mapElement = doc.documentElement;
            if (mapElement == null)
                throw new Error("invalid MM file format: no root node");
            if (mapElement.nodeName !== "map")
                throw new Error("invalid MM file format: map root node expected");
            var rootNode = mapElement.firstElementChild;
            if (rootNode != null) {
                if (rootNode.nodeName !== "node")
                    throw new Error("invalid MM file format: first element under the map should be node");
                var root = mm.createRoot(rootNode.getAttribute("TEXT"));

                var appendChildren = (xmlNode: Element, modelNode: Node) => {
                    for (var i = 0; i < xmlNode.childNodes.length; i++) {
                        var xmlChild = xmlNode.childNodes[i];
                        if (xmlChild.nodeName === "node") {
                            var element = (<Element>xmlChild);
                            var positionText = element.getAttribute("POSITION");
                            var left: boolean = null;
                            switch (positionText) {
                            case "right":
                                left = false;
                                break;
                            case "left":
                                left = true;
                                break;

                            default:
                            }
                            var modelChild = modelNode.addChild(element.getAttribute("TEXT"), left);
                            appendChildren(element, modelChild);
                        }
                    }
                }
                appendChildren(rootNode, root);
            }
            return mm;
        }     
    }

    class InternalMindMapFormat {
        static exportModel(model: Model): MindMapDto {
            var nodes = new Array<MindMapNode>();
            var links = new Array<MindMapLink>();
            var nodeStyles = new Array<MindMapNodeStyle>();
            var nodeId = 0;
            var nodeStyleId = 0;


            function saveNode(node: Node) : number {
                var id = nodeId;
                nodeId++;
                if (node.text)
                nodes.push({ id: id, text: node.text, styleId: null });
                node.children.forEach(c => {
                    var childId = saveNode(c.child);
                    links.push({
                        from: id,
                        to: childId,
                        left: c.left 
                    });
                });
                return id;
            }

            saveNode(model.root);

            var serializeModel: MindMapDto = {
                version: 0.1,
                nodes: nodes,
                links: links,
                nodeStyles: nodeStyles
            }
            return serializeModel;
        }

        static importModel(dto: MindMapDto): Model {
            var model = new Model();
            var nodeMap: { [id: number]: Node } = {};
            var dtoMap: { [id: number]: MindMapNode } = {};

            dto.nodes.forEach(n => dtoMap[n.id] = n);
            var rootDto = dto.nodes[0];
            var rootModel = model.createRoot(rootDto.text);
            nodeMap[rootDto.id] = rootModel;
            dto.links.forEach(l => {
                var toDto = dtoMap[l.to];
                var fromModel = nodeMap[l.from];
                fromModel.addChild(toDto.text, l.left);
            });
            return model;
        }
    }

    class MindMapStyler {

        static configurePresenter(presenter: Presenter) {
            var config = presenter.configuration();
            config.setAutoSizeCells(true);
            config.setAutoSizeCellsOnAdd(true);
            config.setResizeContainer(false);
            config.setHtmlLabels(true); // required for text to be wrapped.
        }

        static defaultNodeSize = new Rectangle(0, 0, 160, 40);
        static defaultNodeStyle: string = null;
        static defaultLinkStyle: string = null;

        static predefinedNodeStyles = new StringDictionary<INodeStyle>();

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
            this.predefinedNodeStyles.put("", defNodeStyle);

            var pinkyStyle = Utils.clone(defNodeStyle);
            pinkyStyle.fillColor = "#FDECDE";
            pinkyStyle.strokeColor = "#F58527";
            var styleName = "Pinky";
            styleSheet.putCellStyle(styleName, pinkyStyle);
            this.predefinedNodeStyles.put(styleName, pinkyStyle);

            var leafStyle = Utils.clone(defNodeStyle);
            leafStyle.fillColor = "#F4F7EC";
            leafStyle.strokeColor = "#9EBD5D";
            styleName = "Leaf";
            this.predefinedNodeStyles.put(styleName, leafStyle);
            styleSheet.putCellStyle(styleName, leafStyle);

            Constants.rectangleRoundingFactor = 0.35;
            Constants.shadowColor = "rgba(204, 204, 204, 0.8)";

            //styleSheet.putCellStyle(Adaptor.rootStyleName, vStyle);

            var eStyle = styleSheet.getDefaultEdgeStyle();
            eStyle.strokeColor = "brown";
            eStyle.curved = true;
            eStyle.startArrow = ArrowStyle.None;
            eStyle.endArrow = ArrowStyle.None;
            eStyle.edge = EdgeKind.TopToSide;
            //eStyle.rounded = "1";
            //styleSheet.putCellStyle(Adaptor.rootStyleName, vStyle);
        }

    }

    class MindmapLayout extends BasicLayout implements Layout {
        private model: IPresentationModel;

        constructor(graph: Graph, model: IPresentationModel) {
            super(graph);
            this.model = model;
        }

        static xOffset = 40;
        static yOffset = 20;

        public execute(parent: Cell) {
            if (parent != null) {
                var offset = this.graph.container.getOffsetSize();
                var width = offset.x - 1;
                var height = offset.y - 1;

                this.model.beginUpdate();
                try {
                    var root = <Node>(parent.getChildAt(0).semanticObject);

                    var getChildren = (node: Node, left: boolean) => node.children.filter(c => node === root ? c.left === left : true).map(c => c.child);

                    var nodeWeights = new Dictionary<Node, number>();
                    var getNodeWeight = (node: Node, left: boolean): number => {
                        var result = nodeWeights.get(node);
                        if (result == null) {
                            var children = getChildren(node, left);
                            if (children.length == 0)
                                result = node.view.getHeight(); 
                            else {
                                result = _.sum(children, c => getNodeWeight(c, left)) + (children.length - 1) * MindmapLayout.yOffset;
                            }
                            if (node != root)
                                nodeWeights.put(node, result);
                        }
                        return result;
                    }

                    var treeHeight = _.max([getNodeWeight(root, false), getNodeWeight(root, true)]);
                    height = _.max([height, treeHeight]);

                    var geo = root.view.startChangeGeometry();
                    var bounds = geo.getBounds();
                    var dy = height > bounds.height ? height / 2 - bounds.y - bounds.height / 2 : -bounds.y;
                    geo.translate(width / 2 - bounds.x - bounds.width / 2, dy);
                    this.model.commitGeometryChange(geo);


                    var layoutSide = (left: boolean) => {

                        var layoutChildren = (parent: Node, left: boolean) => {
                            var parentGeo = parent.view.getGeometry().getBounds();
                            var x = left ? parentGeo.x - MindmapLayout.xOffset : parentGeo.x + parentGeo.width + MindmapLayout.xOffset;
                            var children = getChildren(parent, left);
                            if (children.length > 0) {
                                var childrenHeight = getNodeWeight(parent, left);
                                var y = parentGeo.y + parentGeo.height / 2 - childrenHeight / 2;
                                for (var i = 0; i < children.length; i++) {
                                    var child = children[i];
                                    var geo = child.view.startChangeGeometry();
                                    var bounds = geo.getBounds();
                                    y += getNodeWeight(child, left) / 2 - bounds.height / 2;
                                    geo.translate(left ? x - bounds.x - bounds.width : x - bounds.x, y - bounds.y);
                                    this.model.commitGeometryChange(geo);
                                    y += nodeWeights.get(child) / 2 + bounds.height / 2 + MindmapLayout.yOffset;
                                    layoutChildren(child, left);
                                }
                            }
                        }
                        layoutChildren(root, left);
                    }
                    layoutSide(true);
                    layoutSide(false);

                } finally {
                    this.model.endUpdate();
                }
            }
        }


    }

    export function createMindMap(): IBehavior {
        return new MindMapBehavior();
    }

    class MindMapStyleSelect implements IHtmlWidget  {
        private selectedClass: string = "selected";

        constructor(public styleName: string, public nodeStyle: INodeStyle, private onSelect: (sel: MindMapStyleSelect) => void) {
            this.root = document.createElement("a");
            this.root.classList.add("style-button");
            var style = this.root.style;
            this.root.onclick = () => this.onClick();
            style.backgroundColor = nodeStyle.fillColor;
            style.borderColor = nodeStyle.strokeColor;
            style.color = nodeStyle.strokeColor;
        }

        select(value: boolean) {
            if (value)
                this.root.classList.add(this.selectedClass);
            else
                this.root.classList.remove(this.selectedClass);
        }

        private onClick() {
            var wasSelected = this.root.classList.contains(this.selectedClass);
            if (!wasSelected) {
                this.onSelect(this);
            }
        }

        root: HTMLAnchorElement;

        getRoot(): HTMLElement {
            return this.root;
        }
    }

    class ChangeStyleDialog implements IOverlayEvents {
        private selection: IPresentationSelection;
        private presentationModel: IPresentationModel;
        private items: MindMapStyleSelect[];
        private container: IOverlay;
        private node: Node;

        constructor(factory: IOverlayFactory, presentationModel: IPresentationModel, selection: IPresentationSelection) {
            this.selection = selection;
            this.presentationModel = presentationModel;
            this.container = factory.createOverlay(this);
            var layout = this.container.stackLayout();
            this.items = [];
            var styles = MindMapStyler.predefinedNodeStyles;
            styles.getKeys().forEach(s => {
                var select = new MindMapStyleSelect(s, styles.get(s), (sel) => this.onSelect(sel));
                this.items.push(select);
                return layout.append(select);
            });
            this.container.setState(OverlayState.Hidden);
        }

        onCloseClick(): void {
            this.close();
        }

        private close() {
            this.selection.removeSelectionListener();
            this.container.setState(OverlayState.Hidden);
        }

        private snapToNode() {
            var bounds = this.node.view.getGeometry().getBounds();
            var point = new Point(bounds.x + bounds.width + 30, bounds.y);
            this.container.moveTo(point);
            var initSel = _.find(this.items, s => s.nodeStyle == this.node.style);
            this.selectSelector(initSel);
        } 

        show(node: Node) {
            this.node = node;
            this.snapToNode();
            this.container.setState(OverlayState.Active);
            this.selection.addSelectionListener(() => this.onSelectionChanged());

        }

        onSelectionChanged(): void {
            var views = this.selection.getSelection();
            if (views.length != 1) {
                this.close();
            } else {
                this.node = <Node>(views[0].semanticObject);
                this.snapToNode();
            }
        }

        onSelect(sel: MindMapStyleSelect): void {
            this.selectSelector(sel);
            var style = new AppliedStyle(sel.styleName);
            this.presentationModel.changeNodeStyle(this.node.view, style);
        }

        selectSelector(sel: MindMapStyleSelect) {
            this.items.forEach(s => {
                s.select(s === sel);
            });
        }

    }

    class MindMapBehavior implements IBehavior {
        private presenter: Presenter;
        private model: Model;
        overlayFactory: IOverlayFactory;
        private changeStyleDialog_: ChangeStyleDialog;
        private get changeStyleDialog(): ChangeStyleDialog {
            if (!this.changeStyleDialog_)
                this.changeStyleDialog_ = new ChangeStyleDialog(this.overlayFactory, this.presenter.getModel(), this.presenter);
            return this.changeStyleDialog_;
        }

        constructor() {
            this.setupActions();
        }

        nodeSizeRestriction: CellSizeRestrictions = {
            minHeight: () => 40,
            maxWidth: () => 160
        };

        actions: IBehaviorAction[];

        canInsertChild(sels: IPresentationSelection): boolean {
            var sel = sels.getSelection();
            if (sel && sel.length == 1 && (sel[0].semanticObject instanceof (Node))) {
                return true;
            }
            return false;
        }

        canInsertSibling(sels: IPresentationSelection): boolean {
            var sel = sels.getSelection();
            if (sel && sel.length === 1 && (sel[0].semanticObject instanceof (Node))) {
                return this.model.root !== <Node>sel[0].semanticObject;
            }
            return false;
        }

        canInsertParent(sels: IPresentationSelection): boolean {
            var sel = sels.getSelection();
            if (sel && sel.length == 1 && (sel[0].semanticObject instanceof (Node))) {
                return this.model.root !== <Node>sel[0].semanticObject;
            }
            return false;
        }

        canEditCell(sels: IPresentationSelection): boolean {
            var sel = sels.getSelection();
            return (sel && sel.length == 1 && (sel[0].semanticObject instanceof (Node)));
        }

        canChangeStyle(sels: IPresentationSelection): boolean {
            var sel = sels.getSelection();
            return (sel && sel.length == 1 && (sel.every(s => s.semanticObject instanceof (Node))));
        }

        canDeleteCells(sels: IPresentationSelection): boolean {
            var sel = sels.getSelection();
            if (sel && sel.length == 1 && (sel.every(s => s.semanticObject instanceof (Node))))
                return this.model.root !== <Node>sel[0].semanticObject;
            return false;
        }

        insertChild(sels: IPresentationSelection) {
            var sel = sels.getSelection();
            var presentationModel = this.presenter.getModel();

            var parent = <Node>sel[0].semanticObject;
            presentationModel.beginUpdate();
            try {
                var left = this.model.root == parent ? parent.children.length % 2 === 1 : false; 
                var child = parent.addChild("new node", left);
                var newNode = this.createDefaultNodeView(child);
                this.createDefaultLinkView(parent, child);
                this.presenter.setSelection([newNode]);
                this.relayout(this.presenter.getRootParent());
            } finally {
                presentationModel.endUpdate();
            }
        }


        insertParent(sels: IPresentationSelection) {
            var sel = sels.getSelection();
            var grandChild = <Node>sel[0].semanticObject;
            var parent = grandChild.parent;
            var presentationModel = this.presenter.getModel();
            presentationModel.beginUpdate();
            try {
                var child = parent.addChildAfter("new node", grandChild);
                var newNode = this.createDefaultNodeView(child);
                this.createDefaultLinkView(parent, child);
                this.removeDefaultLinkView(parent, grandChild);
                parent.removeChild(grandChild);
                child.appendChild(grandChild, null);
                this.createDefaultLinkView(child, grandChild);
                this.presenter.setSelection([newNode]);
                this.relayout(this.presenter.getRootParent());
            } finally {
                presentationModel.endUpdate();
            }
        }

        insertSibling(sels: IPresentationSelection) {
            var sel = sels.getSelection();
            var presentationModel = this.presenter.getModel();
            var self = <Node>sel[0].semanticObject;
            var parent = self.parent;
            presentationModel.beginUpdate();
            try {
                var child = parent.addChildAfter("new node", self);
                var newNode = this.createDefaultNodeView(child);
                this.createDefaultLinkView(parent, child);
                this.presenter.setSelection([newNode]);
                this.relayout(this.presenter.getRootParent());
            } finally {
                presentationModel.endUpdate();
            }

        }


        deleteCells(sels: IPresentationSelection) {
            var sel = sels.getSelection();
            var presentationModel = this.presenter.getModel();
            presentationModel.beginUpdate();
            try {
                var removeOne = (node: Node) => {
                    var children = node.children;
                    var parent = node.parent;
                    this.removeDefaultLinkView(parent, node);
                    this.removeDefaultNodeView(node);
                    parent.removeChild(node);
                    children.forEach(c => removeOne(c.child));
                }
                removeOne(<Node>sel[0].semanticObject);
                //this.presenter.setSelection([newNode]);
                this.relayout(this.presenter.getRootParent());
            } finally {
                presentationModel.endUpdate();
            }

        }

        startCellEdit(sels: IPresentationSelection): void {
            var sel = sels.getSelection();
            var node = <Node>sel[0].semanticObject;
            this.presenter.editText(node.view);
        }

        changeStyle(sels: IPresentationSelection): void {
            var sel = sels.getSelection();
            var elem = <Five.IPresentationNodeElement>(sel[0]);
            var node = <Node>elem.semanticObject;
            var dialog = this.changeStyleDialog;
            dialog.show(node);
        }

        setupActions() {
            this.actions = [
                behaviorAction("Add Child", 1, KeyCode.tab, KeyModifier.none, (s) => this.canInsertChild(s), (s) => this.insertChild(s)),
                behaviorAction("Insert Parent", 1, KeyCode.tab, KeyModifier.shift, (sel) => this.canInsertParent(sel), (sel) => this.insertParent(sel)),
                behaviorAction("Insert Sibling", 1, KeyCode.enter, KeyModifier.none, (sel) => this.canInsertSibling(sel), (sel) => this.insertSibling(sel)),
                behaviorAction("Delete Node", 1, KeyCode.del, KeyModifier.none,(sel) => this.canDeleteCells(sel),(sel) => this.deleteCells(sel)),
                behaviorAction("Change Text", 2, KeyCode.f2, KeyModifier.none, (sel) => this.canEditCell(sel),  (sel) => this.startCellEdit(sel)),
                behaviorAction("Change Style", 2, KeyCode.f4, KeyModifier.none, (sel) => this.canChangeStyle(sel),  (sel) => this.changeStyle(sel))
            ];
        }

        setPresentation(presenter: Presenter): void {
            this.presenter = presenter;
            MindMapStyler.setupStyles(presenter.getStylesheet());
            MindMapStyler.configurePresenter(presenter);
        }

        private createDefaultNodeView(node: Node, cachedFactory?: IPresentationFactory): IPresentationNodeElement {
            var factory = cachedFactory ? cachedFactory : this.presenter.getFactory();
            var view = factory.insertNode(this.presenter.getRootParent(), node.text, MindMapStyler.defaultNodeSize, new AppliedStyle(MindMapStyler.defaultNodeStyle), false, this.nodeSizeRestriction);
            node.view = view;
            view.semanticObject = node;
            return view;
        }

        private createDefaultLinkView(parent: Node, child: Node, cachedFactory?: IPresentationFactory): PresentationLinkElement {
            var factory = cachedFactory ? cachedFactory : this.presenter.getFactory();
            var view = factory.insertLink(this.presenter.getRootParent(), null, parent.view, child.view, new AppliedStyle(MindMapStyler.defaultLinkStyle));
            var link = parent.findChildLink(child);
            link.view = view;
            view.semanticObject = link;
            return view;
        }

        removeDefaultLinkView(parent: Node, oldChild: Node) {
            var link = parent.findChildLink(oldChild);
            this.presenter.getFactory().removeLink(link.view);
            link.view = null;
        }

        removeDefaultNodeView(node: Node) {
            this.presenter.getFactory().removeNode(node.view);
            node.view = null;
        }

        private presentNodeTree(model: Node, parent: IPresentationElement, factory: IPresentationFactory): IPresentationNodeElement {
            var view = this.createDefaultNodeView(model, factory);
            model.children.forEach(c => {
                this.presentNodeTree(c.child, parent, factory);
                this.createDefaultLinkView(model, c.child);
            });
            return view;
        }

        private relayout(parent: IPresentationNodeElement) {
            var presentationModel = this.presenter.getModel();
            presentationModel.beginUpdate();
            try {
                new MindmapLayout(this.presenter.getGraphForLegacyCode(), presentationModel).execute(<Cell>parent);
            } finally {
                // Updates the display
                presentationModel.endUpdate();
            }
        }

        private importModel(model: Model) {

            var presentationModel = this.presenter.getModel();
            var factory = this.presenter.getFactory();
            presentationModel.beginUpdate();
            try {
                var parent = this.presenter.getRootParent();
                this.model = model;
                this.presentNodeTree(model.root, parent, factory);
                this.relayout(parent);
            } finally {
                // Updates the display
                presentationModel.endUpdate();
            }
        }


        bootstrap(): void {
            var model = new Model();
            model.createRoot("Root");
            this.importModel(model);
        }


        getDiagram(): MindMapDto {
            return InternalMindMapFormat.exportModel(this.model);
        }

        load(mindMapDto: MindMapDto): void {
            var model = InternalMindMapFormat.importModel(mindMapDto);
            this.importModel(model);
        }

        allowResize: boolean = false;

        setDockPanelFactory(dockPanelFactory: IOverlayFactory) {
            this.overlayFactory = dockPanelFactory;
        }

        menuCaption(): string {
            return "Mind Map";
        }
    }
}