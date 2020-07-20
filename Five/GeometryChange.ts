module Five {
    /** Action to change a cell's geometry in a model. */
    export class GeometryChange implements IChange {
        previous: Geometry;

        constructor(private model: GraphModel, public cell: Cell, public geometry: Geometry) {
            this.previous = geometry;
        }

        /** Changes the geometry of <cell> ro <previous> using <mxGraphModel.geometryForCellChanged>. */
        execute() {
            this.geometry = this.previous;
            this.previous = this.model.geometryForCellChanged(this.cell, this.previous);
        }
    }
}