module Five {

	export class Cells {
        static getGeometry(cell: Cell): Geometry {
            return (cell != null) ? cell.getGeometry() : null;
        }
	}

    export class Cell {
        constructor(value?: any, geometry?: Geometry, style?: string) {
            ///<param name="value">Optional object that represents the cell value</param>
            ///<param name="geometry">Optional Geometry that specifies the geometry</param>
            ///<param name="style">Optional formatted string that defines the style</param>
            this.value = value;
            this.setGeometry(geometry);
            this.setStyle(style);
        }
        className = "Cell";

        // Holds the Id. Default is null.
        private id : number = null;

        // Holds the user object. Default is null.
        value: Node = null;

        // Holds the Geometry. Default is null.
        geometry : Geometry = null;

        // Holds the style as a string of the form [(stylename|key=value);]. Default is null.
        style : string = null;

        // Specifies whether the cell is a vertex. Default is false.
        private vertex = false;

        // Specifies whether the cell is an edge. Default is false.
        private edge = false;

        // Specifies whether the cell is connectable. Default is true.
        private connectable = true;

        // Specifies whether the cell is visible. Default is true.
        private visible = true;

        // Specifies whether the cell is collapsed. Default is false.
        private collapsed = false;

        // Reference to the parent cell.
        parent : Cell = null;

        //  Reference to the source terminal.
        private source: Cell = null;

        // Reference to the target terminal.
        private target: Cell = null;

        // Holds the child cells.
        children: Cell[] = null;

        // Holds the edges.
        private edges: Cell[] = null;

        // List of members that should not be cloned inside <clone>. This field is passed to <mxUtils.clone> and is not made persistent in <mxCellCodec>.
        // This is not a convention for all classes, it is only used in this class to mark transient fields since transient modifiers are not supported by the language.
        private transient = ["id", "value", "parent", "source","target", "children", "edges"];

        invalidating: boolean;
        overlays: CellOverlay[];

        // Returns the Id of the cell as a string.
        getId() : number {
            return this.id;
        } 

        // Sets the Id of the cell to the given string.
        setId(id: number) {
            this.id = id;
        } 
        
        // Returns the user object of the cell. The user object is stored in <value>.
        getValue() : Node{
            return this.value;
        } 
        
        
        // Sets the user object of the cell. The user object is stored in <value>.
        setValue(value: Node) {
            this.value = value;
        }
        
        // Changes the user object after an in-place edit and returns the previous value. This implementation
        //  replaces the user object with the given value and returns the old user object.
        valueChanged(newValue: Node) : Node {
            var previous = this.getValue();
            this.setValue(newValue);

            return previous;
        } 
        
        // Returns the Geometry that describes the geometry.
        getGeometry() {
            return this.geometry;
        } 
        
        // Sets the Geometry to be used as the geometry.
        setGeometry(geometry: Geometry) {
            this.geometry = geometry;
        } 
        
        // Returns a string that describes the <style>.
        getStyle() {
            return this.style;
        }

        setStyle(style: string) {
            this.style = style;
        } 
        
        // Returns true if the cell is a vertex.
        isVertex() {
            return this.vertex;
        } 
        
        // Specifies if the cell is a vertex. This should only be assigned at construction of the cell and not be changed during its lifecycle.
        // vertex - Boolean that specifies if the cell is a vertex.
        setVertex(vertex: boolean) {
            this.vertex = vertex;
        } 
        
        // Returns true if the cell is an edge.
        isEdge() {
            return this.edge;
        } 
        
        // Specifies if the cell is an edge. This should only be assigned at construction of the cell and not be changed during its lifecycle.
        // edge - Boolean that specifies if the cell is an edge.
        setEdge(edge: boolean) {
            this.edge = edge;
        } 
        
        // Returns true if the cell is connectable.
        isConnectable() {
            return this.connectable;
        }

        setConnectable(connectable: boolean) {
            this.connectable = connectable;
        } 
        
        // Returns true if the cell is visibile.
        isVisible() {
            return this.visible;
        }

        setVisible(visible: boolean) {
            this.visible = visible;
        }

        isCollapsed() {
            return this.collapsed;
        }

        setCollapsed(collapsed) {
            this.collapsed = collapsed;
        }

        getParent() {
            return this.parent;
        }

        setParent(parent: Cell) {
            this.parent = parent;
        } 

        // Returns the source or target terminal.
        // source - Boolean that specifies if the source terminal should be returned.
        getTerminal(source: boolean) {
            return (source) ? this.source : this.target;
        } 

        // Sets the source or target terminal and returns the new terminal.
        // terminal - Cell that represents the new source or target terminal.
        // isSource - Boolean that specifies if the source or target terminal should be set.
        setTerminal(terminal: Cell, isSource: boolean) {
            if (isSource) {
                this.source = terminal;
            } else {
                this.target = terminal;
            }

            return terminal;
        }

        // Returns the number of child cells.
        getChildCount(): number {
            return (this.children == null) ? 0 : this.children.length;
        } 
        
        // Returns the index of the specified child in the child array.
        // child - Child whose index should be returned.
        getIndex(child) {
            return Utils.indexOf(this.children, child);
        } 
        
        // Returns the child at the specified index.
        // index - Integer that specifies the child to be returned.
        getChildAt(index: number) {
            return (this.children == null) ? null : this.children[index];
        }
        
        insert(child: Cell, index? : number) {
            /// <summary>Inserts the specified child into the child array at the specified index and updates the parent reference of the child. 
            /// If not childIndex is specified then the child is appended to the child array. Returns the inserted child. </summary>
            /// <param name="child">Cell to be inserted or appended to the child array</param>
            /// <param name="index" type="">Optional integer that specifies the index at which the child should be inserted into the child array</param>
            /// <returns type=""></returns>
            if (child != null) {
                if (index == null) {
                    index = this.getChildCount();

                    if (child.getParent() == this) {
                        index--;
                    }
                }

                child.removeFromParent();
                child.setParent(this);

                if (this.children == null) {
                    this.children = [];
                    this.children.push(child);
                } else {
                    this.children.splice(index, 0, child);
                }
            }

            return child;
        }
        
        remove(index: number) : Cell {
            /// <summary>Removes the child at the specified index from the child array and returns the child that was removed. 
            /// Will remove the parent reference of the child.</summary>
            /// <param name="index">Integer that specifies the index of the child to be removed.</param>
            /// <returns type=""></returns>
            var child = null;

            if (this.children != null && index >= 0) {
                child = this.getChildAt(index);

                if (child != null) {
                    this.children.splice(index, 1);
                    child.setParent(null);
                }
            }
            return child;
        }

        removeFromParent(): void {
            /// <summary>Removes the cell from its parent.</summary>
            if (this.parent != null) {
                var index = this.parent.getIndex(this);
                this.parent.remove(index);
            }
        }

        getEdgeCount() : number {
            /// <summary>Returns the number of edges in the .edge array.</summary>
            /// <returns type=""></returns>
            return (this.edges == null) ? 0 : this.edges.length;
        } 
        
        getEdgeIndex(edge: Cell) {
            /// <summary>Returns the index of the specified edge in .edges</summary>
            /// <param name="edge">Cell whose index in edges should be returned</param>
            /// <returns type="Object"></returns>
            return Utils.indexOf(this.edges, edge);
        }

        getEdgeAt(index: number) {
            /// <summary></summary>
            /// <param name="index" type="">Integer that specifies the index of the edge to be returned</param>
            /// <returns type=""></returns>
            return (this.edges == null) ? null : this.edges[index];
        } 
        
        insertEdge(edge: Cell, isOutgoing: boolean) : Cell{
            /// <summary>Inserts the specified edge into the edge array and returns the edge. 
            /// Will update the respective terminal reference of the edge.</summary>
            /// <param name="edge">Cell to be inserted into the edge array</param>
            /// <param name="isOutgoing">Boolean that specifies if the edge is outgoing.</param>
            /// <returns>inserted edge</returns>
            if (edge != null) {
                edge.removeFromTerminal(isOutgoing);
                edge.setTerminal(this, isOutgoing);

                if (this.edges == null ||
                    edge.getTerminal(!isOutgoing) != this || Utils.indexOf(this.edges, edge) < 0) {
                    if (this.edges == null) {
                        this.edges = [];
                    }

                    this.edges.push(edge);
                }
            }

            return edge;
        } 
        
        removeEdge(edge: Cell, isOutgoing: boolean) {
            /// <summary>Removes the specified edge from the edge array and returns the edge. Will remove the respective terminal reference from the edge.</summary>
            /// <param name="edge">Cell to be removed from the edge array</param>
            /// <param name="isOutgoing">Boolean that specifies if the edge is outgoing</param>
            /// <returns type="Object"></returns>
            if (edge != null) {
                if (edge.getTerminal(!isOutgoing) != this &&
                    this.edges != null) {
                    var index = this.getEdgeIndex(edge);

                    if (index >= 0) {
                        this.edges.splice(index, 1);
                    }
                }

                edge.setTerminal(null, isOutgoing);
            }

            return edge;
        } 
        
        removeFromTerminal(isSource: boolean): void {
            /// <summary>Removes the edge from its source or target terminal.</summary>
            /// <param name="isSource" type="Object">Boolean that specifies if the edge should be removed from its source or target terminal.</param>
            var terminal = this.getTerminal(isSource);

            if (terminal != null) {
                terminal.removeEdge(this, isSource);
            }
        }
        
        getAttribute(name: string, defaultValue: string): string {
            /// <summary>Returns the specified attribute from the user object if it is an XML node</summary>
            /// <param name="name" type="string">Name of the attribute whose value should be returned</param>
            /// <param name="defaultValue" type="Object">Optional default value to use if the attribute has no value</param>
            /// <returns type="Object"></returns>
            var userObject = this.getValue();
            var val = (userObject != null && userObject.nodeType === NodeType.Element) ? (<Element>userObject).getAttribute(name) : null;
            return val || defaultValue;
        } 
        
        setAttribute(name: string, value: string) {
            /// <summary>Sets the specified attribute on the user object if it is an XML node.</summary>
            /// <param name="name" type="string">Name of the attribute whose value should be set</param>
            /// <param name="value" type="string">New value of the attribute</param>
            var userObject = this.getValue();

            if (userObject != null &&
                userObject.nodeType === NodeType.Element) {
                (<Element>userObject).setAttribute(name, value);
            }
        }

        clone(): Cell {
            /// <summary> Returns a clone of the cell. Uses cloneValue to clone the user object. 
            /// All fields in .transient are ignored during the cloning.</summary>
            /// <returns type="Object"></returns>
            var clone = Utils.clone(this, this.transient);
            clone.setValue(this.cloneValue());

            return clone;
        }

        cloneValue() {
            /// <summary>Returns a clone of the cell's user object.</summary>
            /// <returns type="Object"></returns>
            var value: Node = this.getValue();

            if (value != null) {
                //if (typeof (value.clone) == 'function') {
                //    value = value.clone();
                //}else 
                if (!isNaN(value.nodeType)) {
                    value = value.cloneNode(true);
                }
            }

            return value;
        }

        semanticObject: Object;
    }
}