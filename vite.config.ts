import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import { defineConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa'

const prefix = `monaco-editor/esm/vs`;

export default defineConfig({
  optimizeDeps: {
    include: [
      `${prefix}/language/json/json.worker`,
      `${prefix}/language/css/css.worker`,
      `${prefix}/language/html/html.worker`,
      `${prefix}/language/typescript/ts.worker`,
      `${prefix}/editor/editor.worker`
    ]
  },
  plugins: [
    VitePWA({ registerType: 'autoUpdate' }),
    monacoEditorPlugin({

    }),
    {
      name: "isolation",
      configureServer(server) {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
          next();
        });
      },
    },
  ],
  //   server: {
  //     https: {
  //       key: fs.readFileSync("./cert/localhost-key.pem"),
  //       cert: fs.readFileSync("./cert/localhost.pem"),
  //     },
  //   },
  test: {
    includeSource: ['src/**/*.{ts,tsx}'],
  },
  server: {
    proxy: {
      '/anthropic-api/': {
        target: 'https://api.anthropic.com/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/anthropic-api/, ''),
      },
    },
  },

});