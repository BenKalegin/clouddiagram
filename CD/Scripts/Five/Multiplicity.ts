module Five {
    
    // Defines invalid connections along with the error messages that they produce.
    // To add or remove rules on a graph, you must add/remove instances of this
    // class to <mxGraph.multiplicities>.
    // 
    // Example:
    // 
    // (code)
    // graph.multiplicities.push(new mxMultiplicity(
    //   true, 'rectangle', null, null, 0, 2, ['circle'],
    //   'Only 2 targets allowed',
    //   'Only circle targets allowed'));
    // (end)
    // 
    // Defines a rule where each rectangle must be connected to no more than 2
    // circles and no other types of targets are allowed.
    // 
    // 
    export enum Cardinality {
        Zero,
        One,
        Two,
        Three,
        Four,
        Five,
        Six,
        Seven,
        N
    }

    export class Multiplicity {


        constructor(source: boolean, type: string, attr?: string, value?: string, min: Cardinality = Cardinality.Zero, max: number = Cardinality.N, 
            validNeighbors?: string[], countError?:string, typeError?:string, validNeighborsAllowed:boolean = true) {
            /// <summary>Instantiate class Multiplicity in order to describe allowed connections in a graph. 
            /// Not all constraints can be enforced while editing, some must be checked at validation time. The countError and typeError are treated as resource keys in Resources.</summary>
            /// <param name="source">Boolean indicating if this rule applies to the source or target terminal.</param>
            /// <param name="type"> Type of the source or target terminal that this rule applies to.See type for more information.</param>
            /// <param name="attr"> Optional attribute name to match the source or target terminal.</param>
            /// <param name="value"> Optional attribute value to match the source or target terminal.</param>
            /// <param name="min">Minimum number of edges for this rule. </param>
            /// <param name="max">Maximum number of edges for this rule. </param>
            /// <param name="validNeighbors">Array of types of the opposite terminal for which this rule applies.</param>
            /// <param name="countError"> Error to be displayed for invalid number of edges.</param>
            /// <param name="typeError"> Error to be displayed for invalid opposite terminals.</param>
            /// <param name="validNeighborsAllowed"> Optional boolean indicating if the array of opposite types should be valid or invalid.</param>

            this.source = source;
            this.type = type; //todo refactor to enum
            this.attr = attr;
            this.value = value;
            this.min = min;
            this.max = max;
            this.validNeighbors = validNeighbors; //todo refactor to enum
            this.countError = Resources.get(countError) || countError;
            this.typeError = Resources.get(typeError) || typeError;
            this.validNeighborsAllowed = validNeighborsAllowed;
        }

        // Defines the type of the source or target terminal. The type is a string passed to Utils.isNode together with the source or target vertex value as the first argument.
        type: string = null;

        // Optional string that specifies the attributename to be passed to Utils.isNode to check if the rule applies to a cell.
        attr: string = null;

        // Optional string that specifies the value of the attribute to be passed to Utils.isNode to check if the rule applies to a cell.
        value: string = null;

        // Boolean that specifies if the rule is applied to the source or target terminal of an edge.
         source: boolean = null;

        // Defines the minimum number of connections for which this rule applies. Default is 0.
        min: Cardinality = null;

        // Defines the maximum number of connections for which this rule applies. A value of 'n' means unlimited times. Default is 'n'. 
        max: Cardinality = null;

        // Holds an array of strings that specify the type of neighbor for which this rule applies. 
        // The strings are used in Cell.is on the opposite terminal to check if the rule applies to the connection.
        validNeighbors: string[] = null;

        // Boolean indicating if the list of validNeighbors are those that are allowed for this rule or those that are not allowed for this rule.
        validNeighborsAllowed = true;

        // Holds the localized error message to be displayed if the number of connections for which the rule applies is smaller than <min> or greater than <max>.
        countError:string = null;

        // Holds the localized error message to be displayed if the type of the neighbor for a connection does not match the rule.
        typeError: string = null;

        check(graph: Graph, edge: Cell, source: Cell, target: Cell, sourceOut: number, targetIn: number): string {
            /// <summary>Checks the multiplicity for the given arguments and returns the error for the given connection or null if the multiplicity does not apply.</summary>
            /// <param name="graph" type="Graph">Reference to the enclosing Graph instance</param>
            /// <param name="edge" type="Cell">the edge to validate</param>
            /// <param name="source" type="Cell">source terminal</param>
            /// <param name="target" type="Cell">target terminal</param>
            /// <param name="sourceOut">Number of outgoing edges from the source terminal</param>
            /// <param name="targetIn">Number of incoming edges for the target terminal</param>
            /// <returns type="string">Error message or null if ok</returns>
            var error = "";

            if ((this.source && this.checkTerminal(graph, source, edge)) ||
            (!this.source && this.checkTerminal(graph, target, edge))) {
                if (this.countError != null &&
                ((this.source && (this.max == 0 || (sourceOut >= this.max))) ||
                (!this.source && (this.max == 0 || (targetIn >= this.max))))) {
                    error += this.countError + "\n";
                }

                if (this.validNeighbors != null && this.typeError != null && this.validNeighbors.length > 0) {
                    var isValid = this.checkNeighbors(graph, edge, source, target);

                    if (!isValid) {
                        error += this.typeError + "\n";
                    }
                }
            }

            return (error.length > 0) ? error : null;
        }

        checkNeighbors(graph: Graph, edge: Cell, source: Cell, target: Cell) {
            /// <summary>Checks if there are any valid neighbours in validNeighbors. This is only called if validNeighbors is a non-empty array.</summary>
            /// <param name="graph" type="">Reference to the enclosing Graph instance</param>
            /// <param name="edge" type="">the edge to validate</param>
            /// <param name="source" type="">source terminal</param>
            /// <param name="target" type="">target terminal</param>
            /// <returns type=""></returns>
            var sourceValue = <Element>Cells.getValue(source);
            var targetValue = <Element>Cells.getValue(target);
            var isValid = !this.validNeighborsAllowed;
            var valid = this.validNeighbors;

            for (var j = 0; j < valid.length; j++) {
                if (this.source &&
                    this.checkType(graph, targetValue, valid[j])) {
                    isValid = this.validNeighborsAllowed;
                    break;
                } else if (!this.source &&
                    this.checkType(graph, sourceValue, valid[j])) {
                    isValid = this.validNeighborsAllowed;
                    break;
                }
            }

            return isValid;
        }

        private checkTerminal(graph: Graph, terminal: Cell, edge: Cell) {
            /// <summary>Checks the given terminal cell and returns true if this rule applies. 
            /// The given cell is the source or target of the given edge, depending on source. 
            /// This implementation uses checkType on the terminal's value</summary>
            var value = Cells.getValue(terminal);

            return this.checkType(graph, <Element>value, this.type, this.attr, this.value);
        }

        private checkType(graph: Graph, value: Element, type: string, attr?, attrValue?) {
            /// <summary>Checks the type of the given value.</summary>
            if (value != null) {
                if (!isNaN(value.nodeType)) // Checks if value is a DOM node
                {
                    return Utils.isNode(value, type, attr, attrValue);
                } else {
                    return value.nodeName === type;
                }
            }

            return false;
        }
    }
}