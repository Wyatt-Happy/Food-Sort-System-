<template>
  <el-dialog
    v-model="dialogVisible"
    title="食材名称未映射"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleDialogClose"
  >
    <div class="unmapped-tip">
      <p>检测到以下食材名称未关联到任何类别，请先去类别管理模块添加：</p>
      <div class="unmapped-list">
        <span v-for="(food, idx) in unmappedFoods" :key="idx">{{ food }}</span>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" @click="handleGotoCategory">前往类别管理</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
// 导入Vue核心API（仅保留必要的，移除多余导入）
import { ref } from 'vue';

// 定义Props（编译器宏，无需导入）
const props = defineProps({
  unmappedFoods: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Boolean,
    default: false
  }
});

// 定义Emits（编译器宏，无需导入）
const emit = defineEmits(['update:modelValue', 'goto-category', 'close']);

// 双向绑定弹窗显示状态
const dialogVisible = defineModel({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  }
});

// 点击"前往类别管理"按钮
const handleGotoCategory = () => {
  emit('goto-category');
  dialogVisible.value = false;
};

// 弹窗关闭事件（点击叉号时触发）
const handleDialogClose = () => {
  emit('close');
};
</script>

<style scoped>
/* 样式统一使用英文符号，无特殊字符 */
.unmapped-tip { 
  padding: 10px 0; 
}

.unmapped-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.unmapped-list span {
  background: #fef0f0;
  color: #f56c6c;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 14px;
}
</style>