import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dts(),
    vue({
      template: {
        transformAssetUrls: {
          video: ["src", "poster"],
          source: ["src"],
          img: ["src"],
          image: ["xlink:href", "href"],
          use: ["xlink:href", "href"],
          "v-img": ["src"],
        },
      },
    }),
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    // https://vitejs.dev/config/build-options.html#build-csscodesplit
    cssCodeSplit: false,
    minify: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, "src/index.ts"),
      name: "MyLib",
      // the proper extensions will be added
      fileName: "my-lib",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ["vue"],
      output: {
        // format: "iife",
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: "Vue",
        },
      },
    },
  },
});
