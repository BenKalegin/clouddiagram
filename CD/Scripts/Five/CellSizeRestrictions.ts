module Five {
    export interface ICellSizeRestrictions {
        minHeight? : () => number;
        maxHeight? : () => number;
        minWidth? : () => number;
        maxWidth? : () => number;
    }

} 