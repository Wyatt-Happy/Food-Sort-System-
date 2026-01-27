<template>
  <div class="home-container">
    <!-- 左侧导航栏 -->
    <el-aside width="240px" class="sidebar">
      <div class="sidebar-title">分拣管理系统</div>
      <div class="sidebar-btn-group">
        <el-button 
          type="primary" 
          class="filter-btn"
          @click="switchToOrder"
          :class="{ active: activeModule === 'order' }"
        >
          订单管理
        </el-button>
        <el-button 
          type="primary" 
          class="filter-btn"
          @click="switchToCategory"
          :class="{ active: activeModule === 'category' }"
        >
          类别管理
        </el-button>
      </div>
    </el-aside>

    <!-- 右侧内容（路由视图） -->
    <el-main class="main-content">
      <router-view />
    </el-main>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const activeModule = ref('order')

// 根据当前路由自动激活对应按钮
watch(() => route.path, (newPath) => {
  if (newPath.includes('order-manage')) {
    activeModule.value = 'order'
  } else if (newPath.includes('category-manage')) {
    activeModule.value = 'category'
  }
}, { immediate: true })

// 切换到订单管理
const switchToOrder = () => {
  router.push('/order-manage')
  activeModule.value = 'order'
}

// 切换到类别管理
const switchToCategory = () => {
  router.push('/category-manage')
  activeModule.value = 'category'
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
.filter-btn.active {
  background-color: #1989fa;
  border-color: #1989fa;
}

.main-content {
  flex: 1;
  padding: 20px;
  background-color: #f9f9f9;
  height: 100vh;
  overflow: hidden;
}
</style>