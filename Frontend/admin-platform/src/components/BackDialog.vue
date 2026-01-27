<template>
  <el-dialog
    v-model="dialogVisible"
    title="确认回退"
    width="400px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="dialog-content">
      若选择确认后本次修改失效，回退到选择文件界面
    </div>
    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { defineModel, defineEmits } from 'vue'

// 双向绑定弹窗显示状态
const dialogVisible = defineModel()
// 向父组件传递事件
const emit = defineEmits(['confirm'])

// 确认回退
const handleConfirm = () => {
  emit('confirm')
  dialogVisible.value = false
}

// 取消回退
const handleCancel = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.dialog-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 10px;
  text-align: center;
}
</style>