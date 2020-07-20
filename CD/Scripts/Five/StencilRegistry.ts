module Five {
    export class StencilRegistry {
        /// <summary>A singleton class that provides a registry for stencils and the methods for painting those stencils onto a canvas or into a DOM.</summary>
        private static stencils = [];

        static addStencil(name, stencil) {
            StencilRegistry.stencils[name] = stencil;
        }

        static getStencil(name) {
            return StencilRegistry.stencils[name];
        }
    }
}