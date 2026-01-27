# 食品分拣系统 (Food Sort System)



![](https://p3-flow-imagex-sign.byteimg.com/ocean-cloud-tos/image_skill/2cb3606f-6d38-49b8-85f5-ae57791a92e9_1769531934696208283_origin~tplv-a9rns2rl98-image-qvalue.image?lk3s=8e244e95\&rcl=20260128004017A58D6F75E43EE81A7263\&rrcfp=026f1a63\&x-expires=1801154417\&x-signature=TgMGXzYxlTfCes68CiQUNHCCa8A%3D)

基于 Vue3 + Django 4 开发的食品分拣管理系统，支持本地 / 容器化部署，适配内网穿透远程调试。

## 🌟 核心功能



* 食品分类管理（新增 / 编辑 / 删除 / 查询）

* 分拣规则配置

* 数据可视化（分拣数量 / 类别统计）

* 前后端分离架构，支持跨端访问

## 🛠️ 技术栈

### 前端



* Vue 3 + Element Plus

* Vite（构建工具）

* Axios（接口请求）

### 后端



* Django 4 + Django REST Framework

* SQLite（轻量数据库，无需额外部署）

### 部署



* Docker + Docker Compose（一键启动）

## 🚀 快速部署（推荐 Docker）

### 环境要求



* 安装 Docker Desktop（Windows/Mac）或 Docker Engine（Linux）

* Git（可选，克隆仓库用）

### 部署步骤



1. 克隆仓库到本地



```
git clone git@github.com:Wyatt-Happy/Food-Sort-System.git

cd Food-Sort-System
```



1. 一键启动容器



```
\# 运行容器（后台启动）

docker-compose up -d
```



1. 访问项目

* 前端页面：[http://localhost:5174](http://localhost:5174)

* 后端接口：[http://localhost:8000/api/categories/](http://localhost:8000/api/categories/)

## 🔧 本地开发部署（非 Docker）

### 后端启动



```
cd Backend

\# 安装依赖

pip install -r requirements.txt

\# 启动服务（允许局域网访问）

python manage.py runserver 0.0.0.0:8000
```

### 前端启动



```
cd Frontend/admin-platform

\# 安装依赖

npm install

\# 启动开发服务（二选一）

npm run dev:remote  # 远程调试模式（适配内网穿透）

\# 或

npm run dev:docker  # Docker本地联动模式
```

## 🌐 内网穿透远程调试（旧电脑）



1. 启动本地服务

* 后端：`python ``manage.py``  runserver  ``0.0.0.0:8000`

* 前端：`npm run dev:remote`

1. 配置 cpolar 映射（需提前安装 cpolar）

* 前端：`xxx.r10.cpolar.top` → `localhost:5174`

* 后端：`yyy.r10.cpolar.top` → `localhost:8000`

## 📁 项目结构



```
Food-Sort-System/

├── Backend/          # Django后端目录

│   ├── food\_sort\_system/  # 项目核心配置

│   ├── categories/       # 分类管理业务模块

│   └── db.sqlite3        # 本地数据库（不上传GitHub）

├── Frontend/         # Vue前端目录

│   └── admin-platform/   # 前端主项目（Vite构建）

├── docker-compose.yml # Docker编排配置文件

└── README.md         # 项目说明文档（当前文件）
```

## 📞 维护说明

### 代码更新（旧电脑操作）



```
git add .

git commit -m "备注更新内容（如：修复前端样式bug/新增分类接口）"

git push
```

### 新电脑同步项目



```
git pull  # 拉取最新代码

docker-compose restart  # 重启容器（若用Docker部署）
```

### 数据库同步

手动拷贝旧电脑的 `Backend/db.sqlite3` 文件，覆盖新电脑对应目录下的文件即可（确保服务已停止）。

> （注：文档部分内容可能由 AI 生成）