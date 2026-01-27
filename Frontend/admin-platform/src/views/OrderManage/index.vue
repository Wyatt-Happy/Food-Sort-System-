<template>
  <div class="filter-content">
    <!-- 筛选区域 -->
    <div class="filter-form-area">
      <!-- 返回按钮占位容器 -->
      <div class="back-btn-wrapper">
        <div 
          class="back-btn" 
          v-if="uploadFile || selectedDate"
          @click="openBackDialog"
        >
          <el-icon><ArrowLeft /></el-icon>
        </div>
      </div>

      <!-- 筛选表单容器 -->
      <div class="filter-form-wrapper">
        <!-- 第一行：食堂名称 + 配送日期 + 食材类别 -->
        <div class="filter-row first-row">
          <el-form-item label="食堂名称：" class="filter-item fixed-width-item">
            <el-select 
              v-model="selectedCanteen" 
              placeholder="请选择食堂名称" 
              style="width: 180px;"
              :disabled="!canteenList.length"
              @change="filterExcelData"
            >
              <el-option label="无" value="none"></el-option>
              <el-option
                v-for="canteen in canteenList"
                :key="canteen"
                :label="canteen"
                :value="canteen"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="配送日期：" class="filter-item fixed-width-item">
            <el-select 
              v-model="selectedDate" 
              placeholder="请先上传Excel文件获取日期" 
              style="width: 180px;"
              :disabled="!dateList.length"
              @change="filterExcelData"
            >
              <el-option
                v-for="date in dateList"
                :key="date"
                :label="date"
                :value="date"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="食材类别：" class="filter-item fixed-width-item">
            <el-select 
              v-model="selectedCategory" 
              placeholder="请选择食材类别" 
              style="width: 180px;"
              :disabled="!excelMappedCategories.length"
              @change="filterExcelData"
            >
              <el-option label="无" value="none"></el-option>
              <el-option
                v-for="cate in excelMappedCategories"
                :key="cate"
                :label="cate"
                :value="cate"
              ></el-option>
            </el-select>
          </el-form-item>
        </div>

        <!-- 第二行：导出类型 + 按钮组（同行左右平行） -->
        <div class="filter-row second-row">
          <el-form-item label="导出类型：" class="filter-item fixed-width-item">
            <el-select 
              v-model="exportType" 
              placeholder="请选择导出类型" 
              style="width: 180px;"
              :disabled="!uploadFile"
              @change="filterExcelData"
            >
              <el-option label="供货商导出" value="supplier"></el-option>
              <el-option label="跟车单导出" value="follower"></el-option>
            </el-select>
          </el-form-item>

          <!-- 按钮组：与导出类型同行右侧 -->
          <div class="filter-btn-group">
            <el-button 
              type="primary" 
              @click="handleFilterAndDownload"
              :disabled="!canDownload"
            >
              下载
            </el-button>
            <el-button 
              @click="resetFilter" 
              style="margin-left: 10px;"
              :disabled="!selectedDate && (selectedCategory === 'none' || !selectedCategory) && (selectedCanteen === 'none' || !selectedCanteen) && !exportType"
            >
              清空条件
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Excel预览区域 -->
    <div 
      class="preview-area" 
      @drop="handleDrop" 
      @dragover="handleDragOver" 
      @dragleave="handleDragLeave" 
      :class="{ active: isDragActive }"
    >
      <div class="upload-tip" v-if="!uploadFile">
        <el-upload
          class="upload-excel"
          drag
          action="#"
          :auto-upload="false"
          :on-change="handleFileChange"
          accept=".xlsx,.xls"
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将Excel文件拖到此处，或<em>点击上传</em></div>
          <div class="el-upload__tip" slot="tip">仅支持.xlsx/.xls格式文件</div>
        </el-upload>
      </div>

      <div class="excel-preview" v-else>
        <div class="preview-title">Excel数据预览（筛选条件：{{ filterDesc }}）</div>
        <el-table 
          :data="filteredExcelData" 
          border 
          stripe 
          :height="previewTableHeight"
          :empty-text="filteredExcelData.length === 0 ? '暂无匹配数据' : ''"
          :cell-style="{padding: '2px 0'}"
          style="width: 100%;"
        >
          <el-table-column prop="学校名称" label="学校名称" align="center" min-width="100"></el-table-column>
          <el-table-column prop="食堂名称" label="食堂名称" align="center" min-width="100"></el-table-column>
          <el-table-column prop="配送日期" label="配送日期" align="center" min-width="100"></el-table-column>
          <el-table-column prop="食材类别" label="食材类别" align="center" min-width="100"></el-table-column>
          <el-table-column prop="食材名称" label="食材名称" align="center" min-width="120"></el-table-column>
          <el-table-column prop="规格" label="规格" align="center" min-width="80"></el-table-column>
          <el-table-column prop="单位" label="单位" align="center" min-width="60"></el-table-column>
          <el-table-column prop="数量" label="数量" align="center" min-width="80"></el-table-column>
          <!-- 核心改动1：先显示「实际数量」列 -->
          <el-table-column 
            label="实际数量" 
            align="center" 
            min-width="100"
          >
            <template #default="scope">
              <el-input
                v-model.trim="scope.row.实际增减补"
                size="mini"
                placeholder="填写0以上数字或留空"
                @input="handleAdjustInput(scope.row)"
                maxlength="8"
                style="width: 90px; margin: 0 auto;"
                clearable
              ></el-input>
            </template>
          </el-table-column>
          <!-- 核心改动2：后显示「订单备注」列 -->
          <el-table-column prop="订单备注" label="订单备注" align="center" min-width="150" show-overflow-tooltip></el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <BackDialog 
      v-model="showBackDialog"
      @confirm="confirmBack"
    ></BackDialog>
    <UnmappedTipDialog 
      v-model="showUnmappedTip"
      :unmapped-foods="unmappedFoods"
      @goto-category="gotoCategoryModule"
      @close="handleUnmappedDialogClose"
    ></UnmappedTipDialog>
  </div>
</template>

<script setup>
// 导入核心依赖
import { ref, computed, watch, onMounted, nextTick, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import { useRouter } from 'vue-router';

// 导入自定义组件和工具
import BackDialog from '@/components/BackDialog.vue';
import UnmappedTipDialog from '@/components/UnmappedTipDialog.vue';
import { getCategories } from '@/utils/storageHandler';
import { 
  formatExcelData, 
  checkFoodMapping, 
  extractAndProcessDeliveryDate,
  getExportData 
} from '@/utils/excelHandler';

// 初始化路由
const router = useRouter();

// 响应式数据定义
const selectedDate = ref('');
const selectedCategory = ref('none');
const selectedCanteen = ref('none');
const exportType = ref('');
const dateList = ref([]);
const canteenList = ref([]);
const isDragActive = ref(false);
const uploadFile = ref(null);
const showBackDialog = ref(false);
const originExcelData = ref([]);
const filteredExcelData = ref([]);
const excelMappedCategories = ref([]);
const previewTableHeight = ref('350px');
const showUnmappedTip = ref(false);
const unmappedFoods = ref([]);
const categoryList = ref([]);

// 下载按钮禁用逻辑
const canDownload = computed(() => {
  if (!uploadFile.value || !selectedDate.value || !exportType.value) return false;
  if (exportType.value === 'follower' && selectedCanteen.value === 'none') return false;
  if (exportType.value === 'supplier' && selectedCategory.value === 'none') return false;
  return true;
});

// 生命周期 - 挂载
onMounted(async () => {
  await loadCategoriesForMapping();
  nextTick(() => calcPreviewHeight());
  window.addEventListener('resize', calcPreviewHeight);
});

// 生命周期 - 卸载
onUnmounted(() => {
  window.removeEventListener('resize', calcPreviewHeight);
});

// 加载类别数据
const loadCategoriesForMapping = async () => {
  try {
    const res = await getCategories();
    categoryList.value = res.map(item => ({
      id: item.id,
      name: item.name,
      foods: item.foods.map(f => f.name)
    }));
  } catch (error) {
    ElMessage.error('加载类别映射失败：' + error.message);
    categoryList.value = [];
  }
};

// 计算表格高度
const calcPreviewHeight = () => {
  const filterArea = document.querySelector('.filter-form-area');
  const filterHeight = filterArea ? filterArea.offsetHeight : 0;
  const mainContent = document.querySelector('.main-content');
  const mainHeight = mainContent ? mainContent.offsetHeight : 0;
  const previewHeight = mainHeight - filterHeight - 50;
  previewTableHeight.value = (previewHeight - 40) + 'px';
  
  const previewArea = document.querySelector('.preview-area');
  if (previewArea) {
    previewArea.style.height = previewHeight + 'px';
    const uploadTip = document.querySelector('.upload-tip');
    if (uploadTip) uploadTip.style.height = (previewHeight - 20) + 'px';
  }
};

// Excel拖拽事件
const handleDragOver = (e) => {
  e.preventDefault();
  e.stopPropagation();
  isDragActive.value = true;
};
const handleDragLeave = (e) => {
  e.preventDefault();
  e.stopPropagation();
  isDragActive.value = false;
};
const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  isDragActive.value = false;
  const files = e.dataTransfer.files;
  if (files.length) {
    const file = files[0];
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      uploadFile.value = file;
      parseExcelFile(file);
    } else {
      ElMessage.error('请上传.xlsx/.xls格式文件！');
    }
  }
};

// Excel上传事件
const handleFileChange = (file) => {
  uploadFile.value = file.raw;
  parseExcelFile(file.raw);
};

// 解析Excel文件
const parseExcelFile = (file) => {
  try {
    ElMessage.info('正在解析Excel文件，请稍等...');
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const originData = XLSX.utils.sheet_to_json(worksheet);
      
      if (originData.length === 0) {
        ElMessage.error('Excel文件无数据！');
        return;
      }

      const formattedData = formatExcelData(originData, categoryList.value);
      if (formattedData.length === 0) {
        ElMessage.warning('Excel中无有效数据，请检查核心列！');
        return;
      }

      const checkResult = checkFoodMapping(formattedData, categoryList.value);
      if (!checkResult.isAllMapped) {
        unmappedFoods.value = checkResult.unmapped;
        showUnmappedTip.value = true;
        return;
      }

      originExcelData.value = formattedData.map(item => ({
        ...item,
        原始数量: item.数量,
        实际增减补: '',
        食材类别: item.食材类别
      }));
      filteredExcelData.value = [...originExcelData.value];

      extractAndProcessDeliveryDate(formattedData, dateList);
      const cateSet = new Set(formattedData.map(item => item.食材类别).filter(Boolean));
      const canteenSet = new Set(formattedData.map(item => item.食堂名称).filter(Boolean));
      excelMappedCategories.value = Array.from(cateSet).sort();
      canteenList.value = Array.from(canteenSet).sort();

      ElMessage.success('Excel解析成功！');
    };
    reader.readAsArrayBuffer(file);
  } catch (error) {
    console.error('Excel解析失败：', error);
    ElMessage.error('Excel解析失败，请检查文件格式！');
  }
};

// 实际数量输入校验
const handleAdjustInput = (row) => {
  const inputValue = row.实际增减补;
  if (inputValue === '') return;
  const reg = /^0$|^[1-9]\d*(\.\d+)?$/;
  if (!reg.test(inputValue)) {
    ElMessage.warning('实际数量仅允许填写0以上的数字，不能包含符号或负数！');
    row.实际增减补 = '';
  }
};

// 筛选数据逻辑
const filterExcelData = () => {
  if (originExcelData.value.length === 0) return;
  let filtered = [...originExcelData.value];
  if (selectedDate.value) {
    filtered = filtered.filter(item => item['配送日期'] === selectedDate.value);
  }
  if (selectedCanteen.value !== 'none' && selectedCanteen.value) {
    filtered = filtered.filter(item => item['食堂名称'] === selectedCanteen.value);
  }
  if (selectedCategory.value !== 'none' && selectedCategory.value) {
    filtered = filtered.filter(item => item['食材类别'] === selectedCategory.value);
  }
  filteredExcelData.value = filtered;
};


// 下载Excel文件
const handleFilterAndDownload = () => {
  if (!canDownload.value) {
    if (!uploadFile.value) ElMessage.warning('请先上传Excel数据！');
    else if (!selectedDate.value) ElMessage.warning('请选择配送日期！');
    else if (exportType.value === 'follower' && selectedCanteen.value === 'none') ElMessage.warning('跟车单导出必须选择具体食堂名称（不能选“无”）！');
    else if (exportType.value === 'supplier' && selectedCategory.value === 'none') ElMessage.warning('供货商单导出必须选择具体食材类别（不能选“无”）！');
    return;
  }

  if (filteredExcelData.value.length === 0) {
    ElMessage.warning('暂无匹配数据，无法下载！');
    return;
  }

  try {
    ElMessage.info('正在生成Excel文件，请稍等...');
    
    let exportHeaders = [];
    let fileName = '';
    let worksheet;
    
    if (exportType.value === 'supplier') {
      // 供货商导出逻辑（保留原有逻辑）
      exportHeaders = ['学校名称', '食堂名称', '配送日期', '食材类别', '食材名称', '规格', '单位', '数量', '订单备注'];
      fileName = `供货商单_配送日期_${selectedDate.value}_食材类别_${selectedCategory.value}.xlsx`;
      // 供货商单：实际数量覆盖原始数量（原有逻辑）
      const exportData = filteredExcelData.value.map(row => {
        let finalQty = row.原始数量;
        if (row.实际增减补) {
          const inputQty = Number(row.实际增减补);
          finalQty = isNaN(inputQty) ? row.原始数量 : inputQty;
        }
        return {
          学校名称: row.学校名称,
          食堂名称: row.食堂名称,
          配送日期: row.配送日期,
          食材类别: row.食材类别,
          食材名称: row.食材名称,
          规格: row.规格,
          单位: row.单位,
          数量: finalQty,
          订单备注: row.订单备注
        };
      });
      worksheet = XLSX.utils.json_to_sheet(exportData, {
        header: exportHeaders,
        skipHeader: false
      });
      worksheet['!cols'] = exportHeaders.map(header => {
        if (header === '订单备注') return { wch: 25 };
        return header === '数量' ? { wch: 10 } : { wch: 15 };
      });
    } else if (exportType.value === 'follower') {
      // 跟车单导出逻辑（核心：下单/实际数量列居中对齐）
      exportHeaders = ['食材名称', '标记', '备注', '规格', '单位', '下单数量', '实际数量'];
      fileName = `跟车单_配送日期_${selectedDate.value}_食堂名称_${selectedCanteen.value}.xlsx`;
      
      // 组装跟车单数据
      const titleRow = [`【${selectedCanteen.value}】跟车单（配送日期：${selectedDate.value}）`];
      const headerRow = exportHeaders;
      const dataRows = filteredExcelData.value.map(row => {
        const actualQty = row.实际增减补 ? row.实际增减补 : row.原始数量;
        return [
          row.食材名称,
          '', // 标记列
          row.订单备注,
          row.规格,
          row.单位,
          row.原始数量, // 下单数量（居中）
          actualQty     // 实际数量（居中）
        ];
      });
      
      const excelData = [titleRow, headerRow, ...dataRows];
      worksheet = XLSX.utils.aoa_to_sheet(excelData);
      
      // 1. 合并第一行7列
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }];
      // 2. 标题居中+加粗
      if (worksheet['A1']) {
        worksheet['A1'].s = {
          alignment: { horizontal: 'center', vertical: 'center' },
          font: { bold: true, size: 12 }
        };
      }

      // ========== 核心：精准控制列对齐 ==========
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let r = 1; r <= range.e.r; r++) { // 从表头行（第2行）开始遍历
        // 1. 下单数量列（第6列，索引5）：强制居中对齐
        const orderQtyCell = XLSX.utils.encode_cell({ r: r, c: 5 });
        if (!worksheet[orderQtyCell]) worksheet[orderQtyCell] = { v: '' };
        worksheet[orderQtyCell].s = {
          ...worksheet[orderQtyCell].s,
          alignment: { horizontal: 'center' } // 居中
        };

        // 2. 实际数量列（第7列，索引6）：强制居中对齐（无论是否填写值）
        const actualQtyCell = XLSX.utils.encode_cell({ r: r, c: 6 });
        if (!worksheet[actualQtyCell]) worksheet[actualQtyCell] = { v: '' };
        worksheet[actualQtyCell].s = {
          ...worksheet[actualQtyCell].s,
          alignment: { horizontal: 'center' } // 居中
        };
      }

      // 3. 列宽保持不变
      worksheet['!cols'] = [
        { wch: 18 }, { wch: 8 }, { wch: 25 }, 
        { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 12 }
      ];
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook, 
      worksheet, 
      exportType.value === 'supplier' ? '供货商数据' : '跟车单数据'
    );
    // 关键：保留单元格样式，确保对齐生效
    XLSX.writeFile(workbook, fileName, { cellStyles: true });

    ElMessage.success(`下载成功！文件名为：${fileName}`);
  } catch (error) {
    console.error('Excel下载失败：', error);
    ElMessage.error('下载失败，请重试！');
  }
};
// 清空筛选条件
const resetFilter = () => {
  selectedDate.value = '';
  selectedCategory.value = 'none';
  selectedCanteen.value = 'none';
  exportType.value = '';
  filteredExcelData.value = [...originExcelData.value];
  ElMessage.info('已清空筛选条件，保留实际数量数据，恢复全量数据预览');
};

// 回退相关
const openBackDialog = () => {
  showBackDialog.value = true;
};
const confirmBack = () => {
  showBackDialog.value = false;
  uploadFile.value = null;
  selectedDate.value = '';
  selectedCategory.value = 'none';
  selectedCanteen.value = 'none';
  exportType.value = '';
  dateList.value = [];
  canteenList.value = [];
  originExcelData.value = [];
  filteredExcelData.value = [];
  excelMappedCategories.value = [];
  ElMessage.success('已回退到选择文件界面，本次修改已失效');
};

// 未映射弹窗相关
const handleUnmappedDialogClose = () => {
  uploadFile.value = null;
  selectedDate.value = '';
  selectedCategory.value = 'none';
  selectedCanteen.value = 'none';
  exportType.value = '';
  dateList.value = [];
  canteenList.value = [];
  originExcelData.value = [];
  filteredExcelData.value = [];
  excelMappedCategories.value = [];
  unmappedFoods.value = [];
  showUnmappedTip.value = false;
  ElMessage.info('已取消本次Excel解析，请先去类别管理添加未映射的食材');
};
const gotoCategoryModule = () => {
  showUnmappedTip.value = false;
  router.push('/category-manage');
};

// 筛选条件描述
const filterDesc = computed(() => {
  let desc = '';
  if (selectedDate.value) desc += '配送日期：' + selectedDate.value;
  if (selectedCanteen.value && selectedCanteen.value !== 'none') desc += (desc ? ' | ' : '') + '食堂名称：' + selectedCanteen.value;
  if (selectedCategory.value && selectedCategory.value !== 'none') desc += (desc ? ' | ' : '') + '食材类别：' + selectedCategory.value;
  if (exportType.value) desc += (desc ? ' | ' : '') + `导出类型：${exportType.value === 'supplier' ? '供货商导出' : '跟车单导出'}`;
  return desc || '全部数据';
});

// 监听筛选条件变化
watch([selectedDate, selectedCategory, selectedCanteen, exportType], () => {
  filterExcelData();
});
</script>

<style scoped>
.filter-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 筛选主容器：压缩内边距，保证内容居中 */
.filter-form-area {
  margin-bottom: 20px;
  padding: 12px 20px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center; /* 垂直居中 */
}

/* 回退按钮占位容器 */
.back-btn-wrapper {
  width: 32px;
  height: 32px;
  margin-right: 15px;
  flex-shrink: 0;
}

/* 回退按钮样式 */
.back-btn {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  color: #409eff;
  transition: all 0.3s;
}
.back-btn:hover {
  background-color: #e8f4ff;
  color: #1989fa;
  transform: scale(1.1);
}

/* 筛选表单容器：压缩行间距，保证整体居中 */
.filter-form-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px; /* 压缩行间距 */
  padding: 4px 0;
}

/* 筛选行通用样式 */
.filter-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 第二行：导出类型+按钮，按钮靠右 */
.second-row {
  justify-content: space-between; /* 导出类型左，按钮右 */
}

/* 固定宽度项：统一样式 */
.fixed-width-item {
  width: 240px; /* 标签(60px) + 下拉框(180px) */
  flex-shrink: 0;
  margin: 0 !important;
}

/* 按钮组：取消原有对齐，由第二行的justify-content控制 */
.filter-btn-group {
  margin: 0; /* 清除原有margin */
}

/* 预览区域样式不变 */
.preview-area {
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  background-color: #fff;
  transition: all 0.3s;
  padding: 10px;
  width: 100%;
}
.preview-area.active {
  border-color: #409eff;
  background-color: #f0f8ff;
}

.upload-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.excel-preview {
  width: 100%;
  height: 100%;
}

.preview-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid #e6e6e6;
}

/* 表格样式不变 */
:deep(.el-table) { width: 100% !important; }
:deep(.el-table__header-wrapper), :deep(.el-table__body-wrapper) { width: 100% !important; }
:deep(.el-table__cell) {
  padding: 4px 0 !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:deep(.el-input--mini) { --el-input-height: 28px !important; }
:deep(.el-input__inner) {
  text-align: center;
  padding: 0 8px !important;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .second-row {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 15px;
  }
}
@media (max-width: 768px) {
  .filter-form-area {
    flex-direction: column;
    align-items: flex-start;
  }
  .back-btn-wrapper {
    margin-bottom: 8px;
  }
  .filter-row {
    flex-wrap: wrap;
  }
}
</style>