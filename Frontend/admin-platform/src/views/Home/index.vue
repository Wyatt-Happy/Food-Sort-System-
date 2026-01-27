<template>
  <div class="home-container">
    <!-- 左侧导航栏 -->
    <el-aside width="240px" class="sidebar">
      <div class="sidebar-title">分拣管理系统</div>
      <div class="sidebar-btn-group">
        <el-button 
          type="primary" 
          class="filter-btn"
          @click="goToOrderManage"
        >
          订单管理
        </el-button>
        <el-button 
          type="primary" 
          class="filter-btn"
          @click="goToCategoryManage"
        >
          类别管理
        </el-button>
      </div>
    </el-aside>

    <!-- 右侧主内容区 -->
    <el-main class="main-content">
      <div class="empty-state">
        <el-empty description="欢迎使用智能分拣管理系统，请点击左侧「订单管理」开始操作" />
      </div>
    </el-main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElEmpty } from 'element-plus'

const router = useRouter()

// 跳转到订单管理
const goToOrderManage = () => {
  router.push('/order-manage')
}

// 跳转到类别管理
const goToCategoryManage = () => {
  router.push('/category-manage')
}
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.sidebar {
  background-color: #f5f7fa;
  padding: 20px 10px;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sidebar-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 30px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e6e6e6;
  width: 100%;
  text-align: center;
}

.sidebar-btn-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 0 10px;
}

.filter-btn {
  width: 180px;
  height: 40px;
  font-size: 14px;
  margin: 0 !important;
  transition: all 0.3s;
}
.filter-btn:hover {
  background-color: #1989fa;
  border-color: #1989fa;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f9f9f9;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>