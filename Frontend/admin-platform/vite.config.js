import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 按模式精准配置代理：remote=内网穿透后端，其他=Docker后端
  let proxyTarget = 'http://backend:8000' // 默认Docker模式
  if (mode === 'remote') {
    proxyTarget = 'http://3f7748e1.r10.cpolar.top' // 远程模式强制指向cpolar后端
  }

  return {
    plugins: [
      vue(),
      AutoImport({ resolvers: [ElementPlusResolver()] }),
      Components({ resolvers: [ElementPlusResolver({ importStyle: 'css' })] })
    ],
    resolve: { 
      alias: { '@': path.resolve(__dirname, './src') } 
    },
    server: {
      port: 5174,
      open: true,
      host: '0.0.0.0',
      allowedHosts: ['16d0a48d.r10.cpolar.top', 'localhost', '127.0.0.1'],
      cors: true,
      hmr: {
        host: 'localhost',
        protocol: 'http',
        port: 5174,
        clientPort: 5174
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          timeout: 60000,
          // 强制设置Host头，避免后端跨域判断失败
          headers: {
            'Host': '3f7748e1.r10.cpolar.top'
          }
        }
      }
    }
  }
})