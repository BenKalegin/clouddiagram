import {defineConfig} from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import {resolve} from "path";

const PORT = 3000;

export default defineConfig(({mode}) => {
    const isLibraryBuild = mode === "library";

    return {
        plugins: [
            react(),
            ...(isLibraryBuild
                ? [
                      dts({
                          entryRoot: "src",
                          include: ["src/editor/**/*", "src/features/**/*", "src/common/**/*", "src/services/**/*", "src/package/**/*"],
                          exclude: ["**/*.test.ts", "**/*.test.tsx", "**/*.integration.test.ts"],
                          outDir: "dist/editor-types",
                          tsconfigPath: "tsconfig.editor.json"
                      })
                  ]
                : [])
        ],
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
                  rollupOptions: {
                      external: [
                          "react",
                          "react-dom",
                          "react/jsx-runtime",
                          /^@mui\//,
                          /^@emotion\//,
                          "jotai",
                          "jotai/utils",
                          "konva",
                          "react-konva",
                          "react-konva-to-svg",
                          "react-draggable",
                          "react-hotkeys-hook",
                          "use-image",
                          "@reduxjs/toolkit",
                          "nanoid",
                          "immer"
                      ]
                  }
              }
            : {
                  outDir: "build",
                  sourcemap: true
              }
    };
});
