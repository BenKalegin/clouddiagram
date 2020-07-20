var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Five;
(function (Five) {
    var Mindmap;
    (function (Mindmap) {
        var Parameters = (function () {
            function Parameters() {
            }
            return Parameters;
        })();
        var ArrowLink = (function () {
            function ArrowLink() {
            }
            return ArrowLink;
        })();
        var Cloud = (function () {
            function Cloud() {
            }
            return Cloud;
        })();
        var Edge = (function () {
            function Edge() {
            }
            return Edge;
        })();
        Mindmap.Edge = Edge;
        var Font = (function () {
            function Font() {
            }
            return Font;
        })();
        Mindmap.Font = Font;
        var Hook = (function () {
            function Hook() {
            }
            return Hook;
        })();
        var Icon = (function () {
            function Icon() {
            }
            return Icon;
        })();
        var NodePosition;
        (function (NodePosition) {
            NodePosition[NodePosition["Left"] = 0] = "Left";
            NodePosition[NodePosition["Right"] = 1] = "Right";
        })(NodePosition || (NodePosition = {}));
        var NodeDecarator = (function () {
            function NodeDecarator() {
            }
            return NodeDecarator;
        })();
        var Node = (function () {
            function Node(text, parent) {
                this._children = [];
                this._text = text;
                this._parent = parent;
            }
            Object.defineProperty(Node.prototype, "children", {
                get: function () {
                    return this._children;
                },
                enumerable: true,
                configurable: true
            });
            Node.prototype.findChildLink = function (child) {
                for (var i = 0; i < this._children.length; i++) {
                    if (this._children[i].child === child) {
                        return this._children[i];
                    }
                }
                return null;
            };
            Object.defineProperty(Node.prototype, "text", {
                get: function () {
                    return this._text;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Node.prototype, "parent", {
                get: function () {
                    return this._parent;
                },
                enumerable: true,
                configurable: true
            });
            Node.prototype.addChild = function (text, left) {
                var child = new Node(text, this);
                this.appendChild(child, left);
                return child;
            };
            Node.prototype.appendChild = function (child, left) {
                this._children.push({ child: child, left: left, view: null });
                child.parent = this;
            };
            Node.prototype.addChildAfter = function (text, sibling) {
                var child = new Node(text, this);
                var siblingLink = this.findChildLink(sibling);
                if (!siblingLink)
                    throw new Error("Cannot found child");
                var index = this.children.indexOf(siblingLink);
                this._children.splice(index + 1, 0, { child: child, left: siblingLink.left, view: null });
                return child;
            };
            Node.prototype.removeChild = function (child) {
                var link = this.findChildLink(child);
                this.children.splice(this.children.indexOf(link), 1);
                child.parent = null;
            };
            return Node;
        })();
        Mindmap.Node = Node;
        var Model = (function () {
            function Model() {
            }
            Object.defineProperty(Model.prototype, "root", {
                get: function () {
                    return this._root;
                },
                enumerable: true,
                configurable: true
            });
            Model.prototype.createRoot = function (text) {
                var node = new Node(text, null);
                this._root = node;
                return node;
            };
            return Model;
        })();
        Mindmap.Model = Model;
        var MmFileFormat = (function () {
            function MmFileFormat() {
            }
            MmFileFormat.read = function (content) {
                var doc = Five.Utils.parseXml(content);
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
                    var appendChildren = function (xmlNode, modelNode) {
                        for (var i = 0; i < xmlNode.childNodes.length; i++) {
                            var xmlChild = xmlNode.childNodes[i];
                            if (xmlChild.nodeName === "node") {
                                var element = xmlChild;
                                var positionText = element.getAttribute("POSITION");
                                var left = null;
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
                    };
                    appendChildren(rootNode, root);
                }
                return mm;
            };
            return MmFileFormat;
        })();
        Mindmap.MmFileFormat = MmFileFormat;
        var InternalMindMapFormat = (function () {
            function InternalMindMapFormat() {
            }
            InternalMindMapFormat.exportModel = function (model) {
                var nodes = new Array();
                var links = new Array();
                var id = 0;
                function saveNode(node) {
                    var nodeId = id;
                    id++;
                    nodes.push({ id: nodeId, text: node.text });
                    node.children.forEach(function (c) {
                        var childId = saveNode(c.child);
                        links.push({
                            from: nodeId,
                            to: childId,
                            left: c.left
                        });
                    });
                    return nodeId;
                }
                saveNode(model.root);
                var serializeModel = {
                    version: 0.1,
                    nodes: nodes,
                    links: links
                };
                return serializeModel;
            };
            InternalMindMapFormat.importModel = function (dto) {
                var model = new Model();
                var nodeMap = {};
                var dtoMap = {};
                dto.nodes.forEach(function (n) { return dtoMap[n.id] = n; });
                var rootDto = dto.nodes[0];
                var rootModel = model.createRoot(rootDto.text);
                nodeMap[rootDto.id] = rootModel;
                dto.links.forEach(function (l) {
                    var toDto = dtoMap[l.to];
                    var fromModel = nodeMap[l.from];
                    fromModel.addChild(toDto.text, l.left);
                });
                return model;
            };
            return InternalMindMapFormat;
        })();
        var MindMapStyler = (function () {
            function MindMapStyler() {
            }
            MindMapStyler.configurePresenter = function (presenter) {
                var config = presenter.configuration();
                config.setAutoSizeCells(true);
                config.setAutoSizeCellsOnAdd(true);
                config.setResizeContainer(false);
                config.setHtmlLabels(true);
            };
            MindMapStyler.modifyDefaultStyles = function (styleSheet) {
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
                eStyle[Five.Constants.styleCurved] = "1";
                eStyle[Five.Constants.styleStartarrow] = Five.Constants.none;
                eStyle[Five.Constants.styleEndarrow] = Five.Constants.none;
                eStyle[Five.Constants.styleEdge] = Five.Constants.edgestyleTopToSide;
            };
            MindMapStyler.defaultNodeSize = new Five.Rectangle(0, 0, 160, 40);
            MindMapStyler.defaultNodeStyle = null;
            MindMapStyler.defaultLinkStyle = null;
            return MindMapStyler;
        })();
        var MindmapLayout = (function (_super) {
            __extends(MindmapLayout, _super);
            function MindmapLayout(graph, model) {
                this.model = model;
                _super.call(this, graph);
            }
            MindmapLayout.prototype.execute = function (parent) {
                var _this = this;
                if (parent != null) {
                    var offset = this.graph.container.getOffsetSize();
                    var width = offset.x - 1;
                    var height = offset.y - 1;
                    this.model.beginUpdate();
                    try {
                        var root = (parent.getChildAt(0).semanticObject);
                        var getChildren = function (node, left) { return node.children.filter(function (c) { return node === root ? c.left === left : true; }).map(function (c) { return c.child; }); };
                        var nodeWeights = new Five.Dictionary();
                        var getNodeWeight = function (node, left) {
                            var result = nodeWeights.get(node);
                            if (result == null) {
                                var children = getChildren(node, left);
                                if (children.length == 0)
                                    result = node.view.getHeight();
                                else {
                                    result = Five._.sum(children, function (c) { return getNodeWeight(c, left); }) + (children.length - 1) * MindmapLayout.yOffset;
                                }
                                if (node != root)
                                    nodeWeights.put(node, result);
                            }
                            return result;
                        };
                        var treeHeight = Five._.max([getNodeWeight(root, false), getNodeWeight(root, true)]);
                        height = Five._.max([height, treeHeight]);
                        var geo = root.view.startChangeGeometry();
                        var bounds = geo.getBounds();
                        var dy = height > bounds.height ? height / 2 - bounds.y - bounds.height / 2 : -bounds.y;
                        geo.translate(width / 2 - bounds.x - bounds.width / 2, dy);
                        this.model.commitGeometryChange(geo);
                        var layoutSide = function (left) {
                            var layoutChildren = function (parent, left) {
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
                                        _this.model.commitGeometryChange(geo);
                                        y += nodeWeights.get(child) / 2 + bounds.height / 2 + MindmapLayout.yOffset;
                                        layoutChildren(child, left);
                                    }
                                }
                            };
                            layoutChildren(root, left);
                        };
                        layoutSide(true);
                        layoutSide(false);
                    }
                    finally {
                        this.model.endUpdate();
                    }
                }
            };
            MindmapLayout.xOffset = 40;
            MindmapLayout.yOffset = 20;
            return MindmapLayout;
        })(Five.BasicLayout);
        function createMindMap() {
            return new MindMapBehavior();
        }
        Mindmap.createMindMap = createMindMap;
        var MindMapBehavior = (function () {
            function MindMapBehavior() {
                this.nodeSizeRestriction = {
                    minHeight: function () { return 40; },
                    maxWidth: function () { return 160; }
                };
                this.allowResize = false;
                this.setupActions();
            }
            MindMapBehavior.prototype.canInsertChild = function (sels) {
                var sel = sels.getSelection();
                if (sel && sel.length == 1 && (sel[0].semanticObject instanceof (Node))) {
                    return true;
                }
                return false;
            };
            MindMapBehavior.prototype.canInsertSibling = function (sels) {
                var sel = sels.getSelection();
                if (sel && sel.length === 1 && (sel[0].semanticObject instanceof (Node))) {
                    return this.model.root !== sel[0].semanticObject;
                }
                return false;
            };
            MindMapBehavior.prototype.canInsertParent = function (sels) {
                var sel = sels.getSelection();
                if (sel && sel.length == 1 && (sel[0].semanticObject instanceof (Node))) {
                    return this.model.root !== sel[0].semanticObject;
                }
                return false;
            };
            MindMapBehavior.prototype.canEditCell = function (sels) {
                var sel = sels.getSelection();
                return (sel && sel.length == 1 && (sel[0].semanticObject instanceof (Node)));
            };
            MindMapBehavior.prototype.canDeleteCells = function (sels) {
                var sel = sels.getSelection();
                if (sel && sel.length == 1 && (sel.every(function (s) { return s.semanticObject instanceof (Node); })))
                    return this.model.root !== sel[0].semanticObject;
                return false;
            };
            MindMapBehavior.prototype.insertChild = function (sels) {
                var sel = sels.getSelection();
                var presentationModel = this.presenter.getModel();
                var parent = sel[0].semanticObject;
                presentationModel.beginUpdate();
                try {
                    var left = this.model.root == parent ? parent.children.length % 2 === 1 : false;
                    var child = parent.addChild("new node", left);
                    var newNode = this.createDefaultNodeView(child);
                    this.createDefaultLinkView(parent, child);
                    this.presenter.setSelection([newNode]);
                    this.relayout(this.presenter.getRootParent());
                }
                finally {
                    presentationModel.endUpdate();
                }
            };
            MindMapBehavior.prototype.insertParent = function (sels) {
                var sel = sels.getSelection();
                var grandChild = sel[0].semanticObject;
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
                }
                finally {
                    presentationModel.endUpdate();
                }
            };
            MindMapBehavior.prototype.insertSibling = function (sels) {
                var sel = sels.getSelection();
                var presentationModel = this.presenter.getModel();
                var self = sel[0].semanticObject;
                var parent = self.parent;
                presentationModel.beginUpdate();
                try {
                    var child = parent.addChildAfter("new node", self);
                    var newNode = this.createDefaultNodeView(child);
                    this.createDefaultLinkView(parent, child);
                    this.presenter.setSelection([newNode]);
                    this.relayout(this.presenter.getRootParent());
                }
                finally {
                    presentationModel.endUpdate();
                }
            };
            MindMapBehavior.prototype.deleteCells = function (sels) {
                var _this = this;
                var sel = sels.getSelection();
                var presentationModel = this.presenter.getModel();
                presentationModel.beginUpdate();
                try {
                    var removeOne = function (node) {
                        var children = node.children;
                        var parent = node.parent;
                        _this.removeDefaultLinkView(parent, node);
                        _this.removeDefaultNodeView(node);
                        parent.removeChild(node);
                        children.forEach(function (c) { return removeOne(c.child); });
                    };
                    removeOne(sel[0].semanticObject);
                    this.relayout(this.presenter.getRootParent());
                }
                finally {
                    presentationModel.endUpdate();
                }
            };
            MindMapBehavior.prototype.startCellEdit = function (sels) {
                var sel = sels.getSelection();
                var node = sel[0].semanticObject;
                this.presenter.editText(node.view);
            };
            MindMapBehavior.prototype.setupActions = function () {
                var _this = this;
                this.actions = [
                    Five.behaviorAction("Add Child", 1, 9 /* tab */, 0 /* none */, function (s) { return _this.canInsertChild(s); }, function (s) { return _this.insertChild(s); }),
                    Five.behaviorAction("Insert Parent", 1, 9 /* tab */, 1 /* shift */, function (sel) { return _this.canInsertParent(sel); }, function (sel) { return _this.insertParent(sel); }),
                    Five.behaviorAction("Insert Sibling", 1, 13 /* enter */, 0 /* none */, function (sel) { return _this.canInsertSibling(sel); }, function (sel) { return _this.insertSibling(sel); }),
                    Five.behaviorAction("Delete Node", 1, 46 /* del */, 0 /* none */, function (sel) { return _this.canDeleteCells(sel); }, function (sel) { return _this.deleteCells(sel); }),
                    Five.behaviorAction("Change Text", 2, 113 /* f2 */, 0 /* none */, function (sel) { return _this.canEditCell(sel); }, function (sel) { return _this.startCellEdit(sel); })
                ];
            };
            MindMapBehavior.prototype.setPresentation = function (presenter) {
                this.presenter = presenter;
                MindMapStyler.modifyDefaultStyles(presenter.getStylesheet());
                MindMapStyler.configurePresenter(presenter);
            };
            MindMapBehavior.prototype.createDefaultNodeView = function (node, cachedFactory) {
                var factory = cachedFactory ? cachedFactory : this.presenter.getFactory();
                var view = factory.insertNode(this.presenter.getRootParent(), node.text, MindMapStyler.defaultNodeSize, MindMapStyler.defaultNodeStyle, false, this.nodeSizeRestriction);
                node.view = view;
                view.semanticObject = node;
                return view;
            };
            MindMapBehavior.prototype.createDefaultLinkView = function (parent, child, cachedFactory) {
                var factory = cachedFactory ? cachedFactory : this.presenter.getFactory();
                var view = factory.insertLink(this.presenter.getRootParent(), null, parent.view, child.view, MindMapStyler.defaultLinkStyle);
                var link = parent.findChildLink(child);
                link.view = view;
                view.semanticObject = link;
                return view;
            };
            MindMapBehavior.prototype.removeDefaultLinkView = function (parent, oldChild) {
                var link = parent.findChildLink(oldChild);
                this.presenter.getFactory().removeLink(link.view);
                link.view = null;
            };
            MindMapBehavior.prototype.removeDefaultNodeView = function (node) {
                this.presenter.getFactory().removeNode(node.view);
                node.view = null;
            };
            MindMapBehavior.prototype.PresentNodeTree = function (model, parent, factory) {
                var _this = this;
                var view = this.createDefaultNodeView(model, factory);
                model.children.forEach(function (c) {
                    _this.PresentNodeTree(c.child, parent, factory);
                    _this.createDefaultLinkView(model, c.child);
                });
                return view;
            };
            MindMapBehavior.prototype.relayout = function (parent) {
                var presentationModel = this.presenter.getModel();
                presentationModel.beginUpdate();
                try {
                    new MindmapLayout(this.presenter.getGraphForLegacyCode(), presentationModel).execute(parent);
                }
                finally {
                    presentationModel.endUpdate();
                }
            };
            MindMapBehavior.prototype.importModel = function (model) {
                var presentationModel = this.presenter.getModel();
                var factory = this.presenter.getFactory();
                presentationModel.beginUpdate();
                try {
                    var parent = this.presenter.getRootParent();
                    this.model = model;
                    this.PresentNodeTree(model.root, parent, factory);
                    this.relayout(parent);
                }
                finally {
                    presentationModel.endUpdate();
                }
            };
            MindMapBehavior.prototype.bootstrap = function () {
                var model = new Model();
                model.createRoot("Root");
                this.importModel(model);
            };
            MindMapBehavior.prototype.getDiagram = function () {
                return InternalMindMapFormat.exportModel(this.model);
            };
            MindMapBehavior.prototype.load = function (mindMapDto) {
                var model = InternalMindMapFormat.importModel(mindMapDto);
                this.importModel(model);
            };
            return MindMapBehavior;
        })();
    })(Mindmap = Five.Mindmap || (Five.Mindmap = {}));
})(Five || (Five = {}));
//# sourceMappingURL=MindMap.js.map