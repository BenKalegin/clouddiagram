import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import {resolve} from "path";

const PORT = 3000;

// Note: type declarations are emitted by `pnpm build:editor:types`
// (tsc -p tsconfig.editor.json), not by vite-plugin-dts.
export default defineConfig(({mode}) => {
    const isLibraryBuild = mode === "library";

    return {
        plugins: [react()],
        server: {
            port: PORT,
            host: true
        },
        test: {
            globals: true,
            environment: "jsdom",
            setupFiles: ["./vitest.setup.ts"],
            include: ["src/**/*.test.{ts,tsx}", "src/**/*.integration.test.{ts,tsx}"]
        },
        build: isLibraryBuild
            ? {
                  lib: {
                      entry: resolve(__dirname, "src/editor/index.ts"),
                      formats: ["es"],
                      fileName: () => "editor.js"
                  },
                  outDir: "dist/lib",
                  emptyOutDir: false,
                  sourcemap: true,
                  // react-reconciler (a CJS dep pulled in by react-konva) calls
                  // require("react") at runtime. Without these settings rollup
                  // emits a `__require` shim that throws at runtime in browser
                  // ESM. transformMixedEsModules + requireReturnsDefault forces
                  // static conversion of those require calls into ESM imports.
                  commonjsOptions: {
                      transformMixedEsModules: true,
                      requireReturnsDefault: "auto"
                  },
                  rollupOptions: {
                      // Externalize React only — host (axonize) MUST share the
                      // same React instance. Everything else (MUI, jotai, konva,
                      // emotion, etc.) is bundled so the host doesn't need them.
                      external: [
                          "react",
                          "react-dom",
                          "react/jsx-runtime"
                      ],
                      output: {
                          // react-reconciler (CJS, pulled in by react-konva) calls
                          // require("react") at runtime. Rolldown emits a shim that
                          // checks `typeof require < "u"` and throws otherwise.
                          // Install a require resolver on globalThis so the shim
                          // finds it. Using globalThis.require avoids the
                          // minifier renaming `var require` to a short name.
                          intro: [
                              `import * as __cdEditor_react from "react";`,
                              `import * as __cdEditor_reactDom from "react-dom";`,
                              `import * as __cdEditor_reactJsx from "react/jsx-runtime";`,
                              `if (typeof globalThis.require === "undefined") {`,
                              `  globalThis.require = function (id) {`,
                              `    if (id === "react") return __cdEditor_react;`,
                              `    if (id === "react-dom") return __cdEditor_reactDom;`,
                              `    if (id === "react/jsx-runtime") return __cdEditor_reactJsx;`,
                              `    throw new Error("[clouddiagram-editor] Unsupported require: " + id);`,
                              `  };`,
                              `}`
                          ].join("\n")
                      }
                  }
              }
            : {
                  outDir: "build",
                  sourcemap: true
              }
    };
});
