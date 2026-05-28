import { defineConfig } from 'vite'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'

// Custom plugin to copy CSS file to dist
const copyCssPlugin = {
  name: 'copy-css',
  closeBundle() {
    const src = resolve(__dirname, 'src/presentation/styles.css')
    const destDir = resolve(__dirname, 'dist/assets')
    const dest = resolve(destDir, 'styles.css')
    
    if (existsSync(src)) {
      mkdirSync(destDir, { recursive: true })
      copyFileSync(src, dest)
    }
  }
}

export default defineConfig({
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
  // Custom plugin to remove type="module" from script tags and use relative paths
  plugins: [
    copyCssPlugin,
    {
      name: 'fix-html-for-file-protocol',
      transformIndexHtml(html) {
        // Remove type="module" and fix paths
        let result = html
          .replace(/type="module"\s*/g, '')
          .replace(/src="\/assets\//g, 'src="./assets/')
          .replace(/href="\.\/src\/presentation\/styles\.css[^"]*/g, 'href="./assets/styles.css"')
        
        // Ensure CSS link exists (Vite might strip it)
        if (!result.includes('styles.css')) {
          result = result.replace(
            '</title>',
            '</title>\n    <link rel="stylesheet" href="./assets/styles.css">'
          )
        }
        
        return result
      }
    }
  ]
})
