import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { cpSync, mkdirSync } from 'node:fs'

const assetVersion = '20261028-left-navigation'

// Standalone documents own their inline scripts and iframe bridges. Copy them
// verbatim rather than bundling them as main-page code.
const staticApplicationPaths = [
  'vsm.html',
  'e2e-robustness-check.html',
  'channel-variety-check.html',
  'embedded',
  'design-previews',
  'src/presentation/assets'
]

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // Use IIFE format to avoid ES module issues with file:// protocol
        format: 'iife',
        entryFileNames: 'assets/bundle.js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  },
  plugins: [
    {
      name: 'copy-standalone-application-assets',
      apply: 'build',
      closeBundle() {
        for (const path of staticApplicationPaths) {
          // A missing editor must fail the build rather than ship broken frames.
          cpSync(resolve(__dirname, path), resolve(__dirname, 'dist', path), {
            recursive: true,
            filter: (source) => !source.endsWith('/.DS_Store')
          })
        }
        mkdirSync(resolve(__dirname, 'dist/assets'), { recursive: true })
        for (const stylesheet of ['styles.css', 'suite.css']) {
          cpSync(resolve(__dirname, 'src/presentation', stylesheet), resolve(__dirname, 'dist/assets', stylesheet))
        }
      }
    },
    {
      name: 'support-static-file-entry',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          // Preserve file:// launches: defer the classic IIFE until #app exists.
          // Vite's relative base supports / and arbitrary deployment prefixes.
          return html
            .replace(/type="module"\s*/g, 'defer ')
            .replace(/crossorigin\s*/g, '')
            .replace('src="./assets/bundle.js"', `src="./assets/bundle.js?v=${assetVersion}"`)
            .replace('</title>', `</title>\n    <link rel="stylesheet" href="./assets/styles.css?v=${assetVersion}">\n    <link rel="stylesheet" href="./assets/suite.css?v=${assetVersion}">`)
        }
      }
    }
  ]
})
