<template>
  <div class="index-page">
    <!-- 首页头部 -->
    <div class="index-header">
      <h1 class="index-title">分拣管理系统</h1>
      <p class="index-desc">高效管理食堂食材分拣与订单配送</p>
    </div>

    <!-- 功能入口按钮 -->
    <div class="index-btn-group">
      <el-button 
        type="primary" 
        size="large"
        @click="gotoOrderManage"
        class="index-btn"
      >
        <el-icon><ShoppingCart /></el-icon>
        订单管理
      </el-button>
      <el-button 
        type="success" 
        size="large"
        @click="gotoCategoryManage"
        class="index-btn"
      >
        <el-icon><Menu /></el-icon>
        类别管理
      </el-button>
    </div>

    <!-- 底部信息 -->
    <div class="index-footer">
      <p>© 2026 分拣管理系统 - 所有权利保留</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ShoppingCart, Menu } from '@element-plus/icons-vue'

const router = useRouter()

// 跳转到订单管理
const gotoOrderManage = () => {
  router.push('/order-manage')
}

// 跳转到类别管理
const gotoCategoryManage = () => {
  router.push('/category-manage')
}
</script>

<style scoped>
.index-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;
}

.index-header {
  text-align: center;
  margin-bottom: 50px;
}

.index-title {
  font-size: 36px;
  color: #303133;
  font-weight: bold;
  margin-bottom: 15px;
}

.index-desc {
  font-size: 18px;
  color: #606266;
}

.index-btn-group {
  display: flex;
  gap: 30px;
  margin-bottom: 80px;
}

.index-btn {
  width: 200px;
  height: 60px;
  font-size: 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.index-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.index-footer {
  color: #909399;
  font-size: 14px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .index-title {
    font-size: 28px;
  }
  .index-btn-group {
    flex-direction: column;
    gap: 20px;
  }
  .index-btn {
    width: 180px;
    height: 50px;
  }
}
</style>