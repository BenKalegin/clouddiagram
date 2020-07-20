module Five {
    export class CellAttributeChange implements IChange{
    constructor(public cell: Cell, private attribute: string, private value: string) {
            this.previous = value;
        }

        execute() {
            var tmp = this.cell.getAttribute(this.attribute, null);

            if (this.previous == null) {
                (<Element>this.cell.value).removeAttribute(this.attribute);
            }
            else {
                this.cell.setAttribute(this.attribute, this.previous);
            }

            this.previous = tmp;
        }

        previous: string;
    }    
} 