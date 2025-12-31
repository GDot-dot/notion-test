
import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // 關鍵：確保在 GitHub Pages 子路徑下能正確尋找檔案
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
