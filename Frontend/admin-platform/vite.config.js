import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 核心修改：替换为最新的后端cpolar域名
  const proxyTarget = process.env.VITE_API_BASE_URL || 
                      (mode === 'remote' ? 'http://4f75eb32.r10.cpolar.top' : 'http://backend:8000');

  // 核心修改：替换为最新的后端cpolar域名
  const proxyHeaders = {};
  if (mode === 'remote') {
    proxyHeaders['Host'] = '4f75eb32.r10.cpolar.top';
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
      host: '0.0.0.0', // 保留：支持本地+远程访问
      // 核心修改：替换为最新的前端cpolar域名
      allowedHosts: ['1821c9ea.r10.cpolar.top', 'localhost', '127.0.0.1', 'backend'], 
      cors: true, // 保留：解决前端跨域
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
          timeout: 60000, // 保留：适配PDF生成耗时
          headers: proxyHeaders, // 动态Host头：仅remote模式生效
          // 新增：修复PDF下载时的路径重写（避免接口路径错误）
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    }
  }
})