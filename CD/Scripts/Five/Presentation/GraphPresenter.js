var Five;
(function (Five) {
    function graphPresenter(graph) {
        return new GraphPresenter(graph);
    }
    Five.graphPresenter = graphPresenter;
    var GraphPresentationModel = (function () {
        function GraphPresentationModel(graph) {
            this.model = graph.model;
        }
        GraphPresentationModel.prototype.beginUpdate = function () {
            this.model.beginUpdate();
        };
        GraphPresentationModel.prototype.endUpdate = function () {
            this.model.endUpdate();
        };
        GraphPresentationModel.prototype.commitGeometryChange = function (change) {
            var changeObj = change;
            this.model.setGeometry(changeObj.cell, changeObj.geometry);
        };
        return GraphPresentationModel;
    })();
    function createGeomtryChange(cell) {
        return new PresentationGeometryChange(cell);
    }
    Five.createGeomtryChange = createGeomtryChange;
    var PresentationGeometryChange = (function () {
        function PresentationGeometryChange(cell) {
            this.cell = cell;
            this.geometry = cell.geometry.clone();
        }
        PresentationGeometryChange.prototype.translate = function (dx, dy) {
            this.geometry.translate(dx, dy);
        };
        PresentationGeometryChange.prototype.getBounds = function () {
            return this.geometry.getBounds();
        };
        return PresentationGeometryChange;
    })();
    var GraphPresentationFactory = (function () {
        function GraphPresentationFactory(graph) {
            this.graph = graph;
        }
        GraphPresentationFactory.prototype.insertNode = function (parent, text, bounds, style, relative, cellSizeRestrictions) {
            return this.graph.insertVertex(parent, null, text, bounds, style, relative, cellSizeRestrictions);
        };
        GraphPresentationFactory.prototype.insertLink = function (parent, text, source, target, style) {
            return this.graph.insertEdge(parent, null, text, source, target, style);
        };
        GraphPresentationFactory.prototype.removeLink = function (link) {
            this.graph.removeCells([link]);
        };
        GraphPresentationFactory.prototype.removeNode = function (node) {
            this.graph.removeCells([node]);
        };
        return GraphPresentationFactory;
    })();
    var GraphPresenter = (function () {
        function GraphPresenter(graph) {
            this.graph = graph;
        }
        GraphPresenter.prototype.configuration = function () {
            return new GraphConfiguration(this.graph);
        };
        GraphPresenter.prototype.getStylesheet = function () {
            return this.graph.getStylesheet();
        };
        GraphPresenter.prototype.getModel = function () {
            return new GraphPresentationModel(this.graph);
        };
        GraphPresenter.prototype.getRootParent = function () {
            return this.graph.getDefaultParent();
        };
        GraphPresenter.prototype.getFactory = function () {
            return new GraphPresentationFactory(this.graph);
        };
        GraphPresenter.prototype.getGraphForLegacyCode = function () {
            return this.graph;
        };
        GraphPresenter.prototype.editText = function (node) {
            this.graph.startEditingAtCell(node);
        };
        GraphPresenter.prototype.setSelection = function (nodes) {
            this.graph.setSelectionCells(nodes);
        };
        GraphPresenter.prototype.getSelection = function () {
            return this.graph.getSelectionCells();
        };
        return GraphPresenter;
    })();
    var GraphConfiguration = (function () {
        function GraphConfiguration(graph) {
            this.graph = graph;
            return;
        }
        GraphConfiguration.prototype.getAutoSizeCells = function () {
            return this.graph.isAutoSizeCells();
        };
        GraphConfiguration.prototype.setAutoSizeCells = function (value) {
            this.graph.setAutoSizeCells(value);
        };
        GraphConfiguration.prototype.getAutoSizeCellsOnAdd = function () {
            return this.graph.autoSizeCellsOnAdd;
        };
        GraphConfiguration.prototype.setAutoSizeCellsOnAdd = function (value) {
            this.graph.autoSizeCellsOnAdd = value;
        };
        GraphConfiguration.prototype.getResizeContainer = function () {
            return this.graph.resizeContainer;
        };
        GraphConfiguration.prototype.setResizeContainer = function (value) {
            this.graph.resizeContainer = value;
        };
        GraphConfiguration.prototype.getHtmlLabels = function () {
            return this.graph.htmlLabels;
        };
        GraphConfiguration.prototype.setHtmlLabels = function (value) {
            this.graph.htmlLabels = value;
        };
        return GraphConfiguration;
    })();
})(Five || (Five = {}));
//# sourceMappingURL=GraphPresenter.js.map