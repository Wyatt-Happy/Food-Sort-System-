import { createRouter, createWebHistory } from 'vue-router'
// 导入独立首页
import Index from '../views/index.vue'
// 导入订单/类别管理的布局容器
import Home from '../views/Home.vue'
// 导入订单/类别管理页面
import OrderManage from '../views/OrderManage/index.vue'
import CategoryManage from '../views/CategoryManage/index.vue'

const routes = [
  // 1. 根路径 → 独立首页
  {
    path: '/',
    name: 'Index',
    component: Index
  },
  // 2. 订单/类别管理（带左侧导航）
  {
    path: '/',
    component: Home,
    children: [
      // 订单管理
      {
        path: 'order-manage',
        name: 'OrderManage',
        component: OrderManage
      },
      // 类别管理
      {
        path: 'category-manage',
        name: 'CategoryManage',
        component: CategoryManage
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router