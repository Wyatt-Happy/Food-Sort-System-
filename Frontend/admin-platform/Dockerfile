# 匹配Vue+Vite兼容的Node版本（18.x）
FROM node:18-alpine

# 设置工作目录（容器内对应admin_platform目录）
WORKDIR /app

# 国内源加速，先拷贝依赖清单（利用Docker缓存）
COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

# 拷贝前端所有代码（包含你修改的src、vite.config.js等）
COPY . .

# 暴露前端端口（和你vite.config.js一致）
EXPOSE 5174

# 启动前端开发服务（适配0.0.0.0，热更新）
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]