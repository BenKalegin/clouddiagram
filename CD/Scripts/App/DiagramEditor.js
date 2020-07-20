var CloudDiagram;
(function (CloudDiagram) {
    var KeyHandler = Five.KeyHandler;
    function createDiagramEditor(graph, behavior, diagramId, diagram) {
        return new DiagramEditor(graph, behavior, diagramId, diagram);
    }
    CloudDiagram.createDiagramEditor = createDiagramEditor;
    var DiagramEditor = (function () {
        function DiagramEditor(graph, behavior, diagramId, diagram) {
            var _this = this;
            this.behavior = behavior;
            this.diagramId = diagramId;
            this.graph = graph;
            var graphPresenter = Five.graphPresenter(graph);
            behavior.setPresentation(graphPresenter);
            this.keyHandler = new KeyHandler(graph);
            behavior.actions.forEach(function (a) { return a.setSelectionProvider(graphPresenter); });
            CloudDiagram.Menus.setupMindMapActions(behavior.actions);
            behavior.actions.forEach(function (a) { return _this.bindKeyAction(a); });
            this.graph.cellsResizable = behavior.allowResize;
            if (diagramId)
                behavior.load(diagram);
            else
                behavior.bootstrap();
        }
        DiagramEditor.prototype.bindKeyAction = function (action) {
            var handler = function (evt) {
                if (action.isEnabled())
                    action.execute();
            };
            this.keyHandler.bindKey(action.getKeyModifier(), action.getKeyCode(), handler);
        };
        DiagramEditor.prototype.getDiagram = function () {
            return this.behavior.getDiagram();
        };
        DiagramEditor.prototype.getDiagramId = function () {
            return this.diagramId;
        };
        return DiagramEditor;
    })();
})(CloudDiagram || (CloudDiagram = {}));
//# sourceMappingURL=DiagramEditor.js.map