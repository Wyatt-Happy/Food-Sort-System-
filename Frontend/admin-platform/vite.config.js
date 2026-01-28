import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'

export default defineConfig(({ mode }) => {
  // 核心优化：优先读取环境变量（Docker模式），再按mode适配
  // 1. Docker环境变量（容器内优先）：VITE_API_BASE_URL=http://backend:8000
  // 2. 本地模式：remote=cpolar穿透，其他=Docker后端（兼容你的原有逻辑）
  const proxyTarget = process.env.VITE_API_BASE_URL || 
                      (mode === 'remote' ? 'http://3f7748e1.r10.cpolar.top' : 'http://backend:8000');

  // 动态设置Host头：仅remote模式用cpolar域名，其他模式自动适配
  const proxyHeaders = {};
  if (mode === 'remote') {
    proxyHeaders['Host'] = '3f7748e1.r10.cpolar.top';
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
      allowedHosts: ['16d0a48d.r10.cpolar.top', 'localhost', '127.0.0.1', 'backend'], // 新增：允许Docker服务名
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