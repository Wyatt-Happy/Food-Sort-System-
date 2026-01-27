<template>
  <router-view />
</template>

<script setup>
// 无业务逻辑，仅作为路由容器
</script>

<style scoped>
/* 清空原有样式，仅保留基础布局 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
html, body, #app {
  height: 100vh;
  width: 100%;
  overflow: hidden;
}
</style>