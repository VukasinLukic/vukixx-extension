import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';

function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension',
    closeBundle() {
      const dist = resolve(__dirname, 'dist');
      const chunksDir = resolve(dist, 'chunks');
      const assetsDir = resolve(dist, 'assets');

      // ── 1. Inline chunks into content scripts & service worker ──
      // Chrome content scripts can't use ES module imports
      if (existsSync(chunksDir)) {
        // Parse each chunk: extract exports mapping and clean code
        const chunkData = new Map<string, { code: string; exports: Map<string, string> }>();
        for (const file of readdirSync(chunksDir)) {
          if (!file.endsWith('.js')) continue;
          const raw = readFileSync(resolve(chunksDir, file), 'utf-8');

          // Parse: export { localVar as ExportedName, ... }
          const exports = new Map<string, string>(); // exportedName -> localName
          const expMatch = raw.match(/export\s*\{([^}]+)\}/);
          if (expMatch) {
            for (const part of expMatch[1].split(',')) {
              const asM = part.trim().match(/^(\w+)\s+as\s+(\w+)$/);
              if (asM) {
                exports.set(asM[2], asM[1]);
              } else {
                const name = part.trim();
                if (name) exports.set(name, name);
              }
            }
          }

          const cleanCode = raw.replace(/export\s*\{[^}]*\}\s*;?\s*/g, '');
          chunkData.set(file, { code: cleanCode, exports });
        }

        const entryFiles = ['chatgpt.js', 'claude.js', 'midjourney.js', 'gemini.js', 'service-worker.js'];
        for (const entry of entryFiles) {
          const entryPath = resolve(dist, entry);
          if (!existsSync(entryPath)) continue;

          let code = readFileSync(entryPath, 'utf-8');

          for (const [chunkFile, { code: chunkCode, exports }] of chunkData) {
            const escaped = chunkFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const importRe = new RegExp(
              `import\\s*\\{([^}]+)\\}\\s*from\\s*["']\\.\\/chunks\\/${escaped}["']\\s*;?`
            );
            const importMatch = code.match(importRe);
            if (!importMatch) continue;

            // Build alias assignments for renamed imports
            let aliases = '';
            for (const part of importMatch[1].split(',')) {
              const asM = part.trim().match(/^(\w+)\s+as\s+(\w+)$/);
              const exportedName = asM ? asM[1] : part.trim();
              const localAlias = asM ? asM[2] : part.trim();
              const chunkLocal = exports.get(exportedName);
              if (chunkLocal && chunkLocal !== localAlias) {
                aliases += `const ${localAlias}=${chunkLocal};`;
              }
            }

            code = code.replace(importRe, '');
            code = chunkCode + aliases + '\n' + code;
          }

          writeFileSync(entryPath, code);
        }
      }

      // ── 2. Fix popup HTML — move to dist root, fix paths ──
      const popupSrc = resolve(dist, 'src/popup/index.html');
      if (existsSync(popupSrc)) {
        let html = readFileSync(popupSrc, 'utf-8');
        // Fix absolute paths to relative paths
        html = html.replace(/src="\/popup\.js"/g, 'src="popup.js"');
        html = html.replace(/href="\/chunks\//g, 'href="chunks/');
        html = html.replace(/href="\/assets\//g, 'href="assets/');
        writeFileSync(resolve(dist, 'popup.html'), html);
      }

      // ── 3. Copy manifest.json ──
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(dist, 'manifest.json'));

      // ── 4. Copy icons ──
      if (!existsSync(assetsDir)) mkdirSync(assetsDir, { recursive: true });
      for (const size of [16, 48, 128]) {
        const src = resolve(__dirname, `src/assets/icon-${size}.png`);
        if (existsSync(src)) {
          copyFileSync(src, resolve(assetsDir, `icon-${size}.png`));
        }
      }

      // ── 5. Copy content script CSS ──
      const cssSource = resolve(__dirname, 'src/content/styles.css');
      if (existsSync(cssSource)) {
        copyFileSync(cssSource, resolve(assetsDir, 'styles.css'));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), chromeExtensionPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
    rollupOptions: {
      input: {
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'chatgpt': resolve(__dirname, 'src/content/chatgpt.ts'),
        'claude': resolve(__dirname, 'src/content/claude.ts'),
        'midjourney': resolve(__dirname, 'src/content/midjourney.ts'),
        'gemini': resolve(__dirname, 'src/content/gemini.ts'),
        'popup': resolve(__dirname, 'src/popup/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
