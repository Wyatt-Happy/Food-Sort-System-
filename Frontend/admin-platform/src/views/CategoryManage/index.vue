<template>
  <div class="category-management">
    <!-- 类别图标列表 -->
    <div class="category-icon-grid">
      <div 
        class="category-icon"
        v-for="(category, index) in categoryList"
        :key="category.id || index"
        @click="openCategoryDialog(category)"
      >
        <span class="category-icon-name">{{ category.name }}</span>
        <span class="category-icon-count">{{ getFoodCount(category) }}种</span>
      </div>
      <div v-if="!categoryList.length" class="empty-tip">暂无类别，点击右下角+添加</div>
    </div>

    <!-- 悬浮新增按钮 -->
    <div class="add-category-btn" @click="openAddCategory">
      <el-icon size="24"><Plus /></el-icon>
    </div>

    <!-- 引入类别弹窗组件 -->
    <CategoryDialog 
      v-model="showDialog"
      :category-name="categoryName"
      :food-list="foodList"
      :is-edit="!!editingCategoryId"
      @save="handleSaveCategory"
      @delete="handleDeleteCategory"
      @close="resetForm"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
// 引入弹窗组件
import CategoryDialog from '@/components/CategoryDialog.vue'
// 引入API
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/utils/storageHandler'

// 响应式数据
const categoryList = ref([])
const showDialog = ref(false)
const editingCategoryId = ref(null)
const categoryName = ref('')
const foodList = ref([''])

// 页面挂载加载数据
onMounted(async () => {
  await loadCategories()
})

// 加载类别数据
const loadCategories = async () => {
  try {
    const res = await getCategories()
    categoryList.value = res.map(item => ({
      id: item.id,
      name: item.name,
      foods: item.foods.map(f => f.name)
    }))
  } catch (error) {
    ElMessage.error(`加载类别失败：${error.message}`)
    categoryList.value = []
  }
}

// 打开新增弹窗
const openAddCategory = () => {
  resetForm()
  showDialog.value = true
}

// 打开编辑弹窗
const openCategoryDialog = (category) => {
  categoryName.value = category.name
  foodList.value = [...category.foods]
  editingCategoryId.value = category.id
  showDialog.value = true
}

// 重置表单
const resetForm = () => {
  categoryName.value = ''
  foodList.value = ['']
  editingCategoryId.value = null
}

// 保存类别（新增/编辑）
const handleSaveCategory = async (formData) => {
  try {
    if (editingCategoryId.value) {
      // 编辑
      await updateCategory(editingCategoryId.value, formData)
      ElMessage.success('类别修改成功！')
    } else {
      // 新增
      await createCategory(formData)
      ElMessage.success('类别新增成功！')
    }
    await loadCategories()
    showDialog.value = false
  } catch (error) {
    ElMessage.error(`保存失败：${error.message}`)
  }
}

// 删除类别
const handleDeleteCategory = async () => {
  if (!editingCategoryId.value) return

  try {
    await ElMessageBox.confirm(
      '确定要删除该类别吗？删除后关联的食材映射会失效！',
      '确认删除',
      { type: 'warning' }
    )
    await deleteCategory(editingCategoryId.value)
    await loadCategories()
    showDialog.value = false
    ElMessage.success('类别删除成功！')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(`删除失败：${error.message}`)
    }
  }
}

// 获取食品数量
const getFoodCount = (category) => {
  return category.foods ? category.foods.length : 0
}
</script>

<style scoped>
.category-management {
  width: 100%;
  height: 100%;
  background-color: #fff;
  border-radius: 6px;
  padding: 20px;
  box-sizing: border-box;
  position: relative;
  overflow-y: auto;
}

.category-icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
  width: 100%;
  padding: 10px 0;
}

.category-icon {
  width: 100%;
  aspect-ratio: 1/1;
  background-color: #e8f4ff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.category-icon:hover {
  background-color: #409eff;
  color: #fff;
  transform: translateY(-5px);
}

.category-icon-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.category-icon-count {
  font-size: 12px;
  color: #606266;
}

.category-icon:hover .category-icon-count {
  color: #fff;
}

.empty-tip {
  grid-column: 1 / -1;
  text-align: center;
  color: #909399;
  font-size: 14px;
  margin-top: 50px;
}

.add-category-btn {
  position: fixed;
  right: 30px;
  bottom: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transition: all 0.3s;
  z-index: 10;
}

.add-category-btn:hover {
  background: #1989fa;
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .category-icon-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 15px;
  }
  
  .add-category-btn {
    width: 50px;
    height: 50px;
    right: 20px;
    bottom: 20px;
  }
}
</style>