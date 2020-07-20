module Five {

    // Implements a mechanism for temporary cell Ids.
    export class CellPath {

        static pathSeparator = ".";

        /** Creates the cell path for the given cell. The cell path is a concatenation of the indices of all ancestors on the (finite) path to the root, eg. "0.0.0.1". */
        static create(cell: Cell) {
            var result = "";

            if (cell != null) {
                var parent = cell.getParent();

                while (parent != null) {
                    var index = parent.getIndex(cell);
                    result = index + CellPath.pathSeparator + result;

                    cell = parent;
                    parent = cell.getParent();
                }
            }

            // Removes trailing separator
            var n = result.length;

            if (n > 1) {
                result = result.substring(0, n - 1);
            }

            return result;
        }

        /** Returns the path for the parent of the cell represented by the given path. Returns null if the given path has no parent. */
        static getParentPath(path: string): string {
            if (path != null) {
                var index = path.lastIndexOf(CellPath.pathSeparator);

                if (index >= 0) {
                    return path.substring(0, index);
                } else if (path.length > 0) {
                    return "";
                }
            }

            return null;
        }

        /** Returns the cell for the specified cell path using the given root as the root of the path.*/
        static resolve(root: Cell, path: string): Cell {
            var parent = root;

            if (path != null) {
                var tokens = path.split(CellPath.pathSeparator);

                for (var i = 0; i < tokens.length; i++) {
                    parent = parent.getChildAt(parseInt(tokens[i]));
                }
            }

            return parent;
        }

        /** Compares the given cell paths and returns -1 if p1 is smaller, 0 if p1 is equal and 1 if p1 is greater than p2.	 */
        static compare(p1: string, p2: string) {
            var min = Math.min(p1.length, p2.length);
            var comp = 0;
            var t1: number;
            var t2: number;
            for (var i = 0; i < min; i++) {
                if (p1[i] != p2[i]) {
                    if (p1[i].length == 0 ||
                        p2[i].length == 0) {
                        comp = (p1[i] == p2[i]) ? 0 : ((p1[i] > p2[i]) ? 1 : -1);
                    } else {
                        t1 = parseInt(p1[i]);
                        t2 = parseInt(p2[i]);
                        comp = (t1 == t2) ? 0 : ((t1 > t2) ? 1 : -1);
                    }

                    break;
                }
            }

            // Compares path length if both paths are equal to this point
            if (comp == 0) {
                t1 = p1.length;
                t2 = p2.length;
                if (t1 != t2) {
                    comp = (t1 > t2) ? 1 : -1;
                }
            }

            return comp;
        }
    }
}
