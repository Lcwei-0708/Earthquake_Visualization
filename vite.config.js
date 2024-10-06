import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {

  // 加載環境變數
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/Earthquake_Visualization/', // 設置為你的 GitHub Pages 路徑    
    publicPath: '/earthquake-visualization',
    plugins: [
      vue({
        include: [/\.vue$/],
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@components': path.resolve(__dirname, './src/components'),
        '@views': path.resolve(__dirname, './src/views'),
      },
    },
    server: {
      port: 5000, // 設置開發服務器端口
      open: true, // 自動打開瀏覽器
    },
    build: {
      outDir: 'dist', // 構建輸出目錄
      assetsDir: 'assets', // 靜態資源目錄
      minify: 'terser', // 使用 terser 進行壓縮
      terserOptions: {
        compress: {
          drop_console: true, // 生產環境下移除 console
          drop_debugger: true // 生產環境下移除 debugger
        }
      }
    }
  }
})
