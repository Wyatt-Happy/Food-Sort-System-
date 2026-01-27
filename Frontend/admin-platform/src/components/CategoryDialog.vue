<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑食材类别' : '新增食材类别'"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    center
    class="category-dialog"
    @close="handleClose"
  >
    <div class="category-form-wrap">
      <div class="form-item">
        <label class="form-label">类别名：</label>
        <el-input 
          v-model="localCategoryName" 
          placeholder="请输入类别名（如：蔬菜、肉类）"
          class="form-input"
        ></el-input>
      </div>
      <div class="form-item">
        <label class="form-label">食品名：</label>
        <div class="food-input-container">
          <div 
            class="food-input-item" 
            v-for="(food, idx) in localFoodList" 
            :key="idx"
          >
            <el-input 
              v-model="localFoodList[idx]" 
              placeholder="请输入食品名（如：西红柿、猪肉）"
              class="form-input food-input"
              :class="{ 'error-input': isFoodDuplicate(food, idx) }"
            ></el-input>
            <el-button 
              type="text" 
              @click="removeFood(idx)"
              v-if="localFoodList.length > 1"
              class="del-btn"
            >
              <el-icon color="#f56c6c"><Minus /></el-icon>
            </el-button>
            <div 
              v-if="isFoodDuplicate(food, idx)" 
              class="duplicate-tip"
            >
              {{ getDuplicateTip(food, idx) }}
            </div>
          </div>
          <el-button 
            type="text" 
            @click="addFood"
            class="add-food-btn"
          >
            <el-icon color="#409eff"><Plus /></el-icon> 添加食品名
          </el-button>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button 
        type="primary" 
        @click="handleSave"
        :disabled="!localCategoryName.trim() || localFoodList.every(f => !f.trim())"
      >
        确认
      </el-button>
      <el-button @click="handleClose">取消</el-button>
      <el-button 
        type="danger" 
        @click="handleDelete"
        v-if="isEdit"
      >
        删除
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, defineProps, defineEmits, defineModel } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Minus } from '@element-plus/icons-vue'
// 引入API获取类别数据（用于重复校验）
import { getCategories } from '@/utils/storageHandler'

// 接收父组件参数
const props = defineProps({
  categoryName: {
    type: String,
    default: ''
  },
  foodList: {
    type: Array,
    default: () => ['']
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})
// 双向绑定弹窗显示状态
const dialogVisible = defineModel()
// 向父组件传递事件
const emit = defineEmits(['save', 'delete', 'close'])

// 组件内局部状态（避免直接修改父组件数据）
const localCategoryName = ref(props.categoryName)
const localFoodList = ref([...props.foodList])
const categoryList = ref([])

// 监听父组件数据变化
watch([() => props.categoryName, () => props.foodList], () => {
  localCategoryName.value = props.categoryName
  localFoodList.value = [...props.foodList]
})

// 页面挂载加载类别数据（用于重复校验）
const loadCategories = async () => {
  try {
    const res = await getCategories()
    categoryList.value = res.map(item => ({
      id: item.id,
      name: item.name,
      foods: item.foods.map(f => f.name)
    }))
  } catch (error) {
    categoryList.value = []
  }
}
loadCategories()

// 添加食品
const addFood = () => {
  const lastFood = localFoodList.value[localFoodList.value.length - 1]
  if (lastFood.trim()) {
    localFoodList.value.push('')
  } else {
    ElMessage.warning('请先填写上一个食品名！')
  }
}

// 删除食品
const removeFood = (idx) => {
  localFoodList.value.splice(idx, 1)
  if (localFoodList.value.length === 0) {
    localFoodList.value.push('')
  }
}

// 食品名重复校验
const isFoodDuplicate = (food, currentIdx) => {
  const trimedFood = food.trim()
  if (!trimedFood) return false
  
  // 表单内重复
  const sameInForm = localFoodList.value.some((f, idx) => idx !== currentIdx && f.trim() === trimedFood)
  if (sameInForm) return true
  
  // 其他类别重复
  const sameInOtherCate = categoryList.value.some((cate) => {
    // 编辑时排除当前类别
    if (props.isEdit) {
      const currentCate = categoryList.value.find(c => c.name === localCategoryName.value)
      if (currentCate && cate.id === currentCate.id) return false
    }
    return cate.foods.some(f => f.trim() === trimedFood)
  })
  return sameInOtherCate
}

// 重复提示文本
const getDuplicateTip = (food, currentIdx) => {
  const trimedFood = food.trim()
  if (!trimedFood) return ''
  
  const sameInForm = localFoodList.value.some((f, idx) => idx !== currentIdx && f.trim() === trimedFood)
  if (sameInForm) return `❌ 当前表单内食品名重复`
  
  const duplicateCate = categoryList.value.find((cate) => {
    if (props.isEdit) {
      const currentCate = categoryList.value.find(c => c.name === localCategoryName.value)
      if (currentCate && cate.id === currentCate.id) return false
    }
    return cate.foods.some(f => f.trim() === trimedFood)
  })
  if (duplicateCate) return `❌ 该食品名已存在于${duplicateCate.name}类别`
  
  return ''
}

// 保存表单（向父组件传递数据）
const handleSave = () => {
  const trimName = localCategoryName.value.trim()
  const validFoods = localFoodList.value.map(f => f.trim()).filter(f => f)
  const uniqueValidFoods = [...new Set(validFoods)]
  
  // 重复校验
  const hasDuplicate = localFoodList.value.some((food, idx) => isFoodDuplicate(food, idx))
  if (hasDuplicate) {
    ElMessage.error('存在重复的食品名，请修改后再提交！')
    return
  }

  // 向父组件传递处理后的数据
  emit('save', {
    name: trimName,
    foods: uniqueValidFoods
  })
}

// 删除类别（通知父组件）
const handleDelete = () => {
  emit('delete')
}

// 关闭弹窗（通知父组件）
const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}
</script>

<style scoped>
:deep(.category-dialog .el-dialog__body) {
  padding: 20px 30px !important;
  display: flex;
  justify-content: center;
  align-items: center;
}

.category-form-wrap {
  width: 100%;
  max-width: 400px;
}

.form-item {
  width: 100%;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
  width: 100%;
}

.form-input {
  width: 100% !important;
  --el-input-height: 40px !important;
}

.food-input-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.food-input-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.food-input {
  width: 100% !important;
}

.del-btn {
  align-self: flex-start;
  padding: 0 !important;
}

.add-food-btn {
  align-self: flex-start;
  padding: 0 !important;
  margin-top: 4px;
}

.duplicate-tip {
  font-size: 12px;
  color: #f56c6c;
  line-height: 1.4;
  padding-left: 4px;
}

.error-input {
  --el-input-border-color: #f56c6c !important;
  --el-input-hover-border-color: #f56c6c !important;
}
</style>