# 匹配Django 4.2.10兼容的Python版本（3.9+）
FROM python:3.10-slim

# 设置工作目录（容器内对应Backend目录）
WORKDIR /app

# 安装系统依赖（SQLite无需额外依赖，仅装基础编译工具）
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 禁用Python缓存、输出缓冲（方便看日志）
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 生成requirements.txt（自动导出当前项目依赖，无需旧电脑手动导出）
RUN pip install django==4.2.10 djangorestframework corsheaders -i https://pypi.tuna.tsinghua.edu.cn/simple

# 拷贝后端所有代码（包含category、food_sort_system、db.sqlite3）
COPY . .

# 暴露Django默认端口（和你旧电脑一致）
EXPOSE 8000

# 启动Django（适配0.0.0.0，允许容器外访问）
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]