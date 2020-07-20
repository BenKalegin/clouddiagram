module Five {

    export function graphPresenter(graph: Graph): IPresenter {
        return new GraphPresenter(graph);
    }

    class GraphPresentationModel implements IPresentationModel {
        constructor(graph: Graph) {
            this.model = graph.model;
        }

        private model: GraphModel;

        beginUpdate(): void {
            this.model.beginUpdate();
        }

        endUpdate(): void {
            this.model.endUpdate();
        }

        commitGeometryChange(change: IPresentationGeometryChange) {
            var changeObj = <PresentationGeometryChange>change;
            this.model.setGeometry(changeObj.cell, changeObj.geometry);
        }

        changeNodeStyle(presentationNodeElement: IPresentationNodeElement, appliedStyle: AppliedStyle) {
            this.beginUpdate();
            this.model.setStyle(<Cell>presentationNodeElement, appliedStyle);
            this.endUpdate();
        }
    }

    export function createGeomtryChange(cell: Cell) : IPresentationGeometryChange {
        return new PresentationGeometryChange(cell);
    }

    class PresentationGeometryChange implements IPresentationGeometryChange {
        constructor(cell: Cell) {
            this.cell = cell;
            this.geometry = cell.geometry.clone();
        }

        translate(dx: number, dy: number) {
            this.geometry.translate(dx, dy);
        }
        getBounds(): Rectangle {
            return this.geometry.getBounds();
        }

        geometry: Geometry;
        cell: Cell;
    }

    class GraphPresentationFactory implements IPresentationFactory {
        constructor(private graph: Graph) {
        }

        insertNode(parent: IPresentationElement, text: string, bounds: Rectangle, style: AppliedStyle, relative: boolean, cellSizeRestrictions: ICellSizeRestrictions): IPresentationNodeElement{
            return this.graph.insertVertex(<Cell>parent, null, text, bounds, style, relative, cellSizeRestrictions);
        }

        insertLink(parent: IPresentationElement, text: string, source: IPresentationNodeElement, target: IPresentationNodeElement, style: AppliedStyle) {
            return this.graph.insertEdge(<Cell>parent, null, text, <Cell><IPresentationElement>source, <Cell><IPresentationElement>target, style);
        }

        removeLink(link: IPresentationLinkElement) {
            this.graph.removeCells([<Cell>link]);
        }

        removeNode(node: IPresentationNodeElement) {
            this.graph.removeCells([<Cell>node]);
        }
    }

    class GraphPresenter implements IPresenter {
        private listener: (e: SelectionChangeEvent) => void;

        constructor(private graph: Graph) {
        }

        configuration(): IPresenterConfiguration {
            return new GraphConfiguration(this.graph);
        }

        // todo replace with interface
        getStylesheet(): Stylesheet {
             return this.graph.getStylesheet();
        }

        getModel(): IPresentationModel {
            return new GraphPresentationModel(this.graph);
        }

        getRootParent(): IPresentationNodeElement {
            return this.graph.getDefaultParent();
        }

        getFactory(): IPresentationFactory {
            return new GraphPresentationFactory(this.graph);
        }

        getGraphForLegacyCode(): Graph {
            return this.graph;
        }

        editText(node: IPresentationNodeElement) {
            this.graph.startEditingAtCell(<Cell>node);
        }

        setSelection(nodes: IPresentationNodeElement[]) {
            this.graph.setSelectionCells(<Cell[]>nodes);
        }

        getSelection(): IPresentationElement[] {
            return this.graph.getSelectionCells();
        }

        addSelectionListener(handler: SelectionSubscriber) {
            this.listener = (e: SelectionChangeEvent) => handler();
            this.graph.getSelectionModel().onSelectionChange.add(this.listener);
        }

        removeSelectionListener() {
            if (this.listener)
                this.graph.getSelectionModel().onSelectionChange.remove(this.listener);
        }
    }

    class GraphConfiguration implements IPresenterConfiguration {
        constructor(private graph: Graph) { return; }

        getAutoSizeCells(): boolean {
            return this.graph.isAutoSizeCells();
        }

        setAutoSizeCells(value: boolean): void {
            this.graph.setAutoSizeCells(value);
        }

        getAutoSizeCellsOnAdd(): boolean {
            return this.graph.autoSizeCellsOnAdd;
        }

        setAutoSizeCellsOnAdd(value: boolean): void {
            this.graph.autoSizeCellsOnAdd = value;
        }

        getResizeContainer(): boolean {
            return this.graph.resizeContainer;
        }

        setResizeContainer(value: boolean): void {
            this.graph.resizeContainer = value;
        }

        getHtmlLabels(): boolean {
            return this.graph.htmlLabels;
        }

        setHtmlLabels(value: boolean) {
            this.graph.htmlLabels = value;
        }
    }
}