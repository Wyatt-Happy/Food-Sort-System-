import { ElMessage } from 'element-plus'

/**
 * 校验增减补格式
 * @param {string} value 输入值
 * @returns {boolean} 是否合法
 */
export const validateAdjustValue = (value) => {
  const reg = /^0$|^[+-]\d*(\.\d*)?$/
  if (value && !reg.test(value)) {
    ElMessage.warning('增减补格式错误！仅支持0、+数字、-数字')
    return false
  }
  return true
}

/**
 * 格式化Excel数据（合并备注、补全字段）
 * @param {Array} originData Excel原始数据
 * @param {Array} categoryList 类别列表
 * @returns {Array} 格式化后的数据
 */
export const formatExcelData = (originData, categoryList) => {
  return originData.map(item => {
    const foodRemark = item['食材备注'] || ''
    const orderRemark = item['订单备注'] || ''
    const mergeRemark = [foodRemark, orderRemark].filter(Boolean).join('；')
    const foodName = (item['食材名称'] || '').trim()
    const category = categoryList.find(c => c.foods.some(f => f.trim() === foodName))

    return {
      '食堂名称': item['食堂名称'] || '',
      '配送日期': item['配送日期'] || item['日期'] || '',
      '食材名称': item['食材名称'] || '',
      '食材类别': category ? category.name : '',
      '规格': item['规格'] || '',
      '单位': item['单位'] || '',
      '数量': Number(item['数量']) || 0,
      '订单备注': mergeRemark || ''
    }
  }).filter(item => {
    return item['食堂名称'] || item['配送日期']
  })
}

/**
 * 校验食材映射关系
 * @param {Array} formattedData 格式化后的Excel数据
 * @param {Array} categoryList 类别列表
 * @returns {Object} 校验结果 { isAllMapped: boolean, unmapped: Array }
 */
export const checkFoodMapping = (formattedData, categoryList) => {
  const allFoods = formattedData.map(item => item['食材名称'].trim()).filter(Boolean)
  if (allFoods.length === 0) {
    ElMessage.warning('Excel中未检测到有效食材名称！')
    return { isAllMapped: true, unmapped: [] }
  }
  const uniqueExcelFoods = [...new Set(allFoods)]
  const mappedFoods = [...new Set(categoryList.flatMap(item => item.foods.map(f => f.trim())))]
  const unmapped = uniqueExcelFoods.filter(food => food && !mappedFoods.includes(food))
  return { isAllMapped: unmapped.length === 0, unmapped }
}

/**
 * 提取并排序配送日期
 * @param {Array} data 格式化后的Excel数据
 * @returns {Array} 去重排序后的日期列表
 */
export const extractDeliveryDates = (data) => {
  const dateSet = new Set()
  data.forEach(item => {
    if (item['配送日期']) dateSet.add(item['配送日期'])
  })
  const dateArray = Array.from(dateSet).filter(Boolean)
  return dateArray.sort((a, b) => new Date(a) - new Date(b))
}

/**
 * 计算表格预览高度
 * @param {string} containerClass 容器类名
 * @param {string} filterAreaClass 筛选区域类名
 * @returns {Object} { previewTableHeight: string, previewAreaHeight: string }
 */
export const calculatePreviewHeight = (containerClass, filterAreaClass) => {
  const filterArea = document.querySelector(filterAreaClass)
  const filterHeight = filterArea ? filterArea.offsetHeight : 0
  const mainContent = document.querySelector(containerClass)
  const mainHeight = mainContent ? mainContent.offsetHeight : 0
  const previewHeight = mainHeight - filterHeight - 50
  const previewTableHeight = `${previewHeight - 40}px`
  const previewAreaHeight = `${previewHeight}px`
  
  // 设置上传提示区域高度
  const uploadTip = document.querySelector('.upload-tip')
  if (uploadTip) uploadTip.style.height = `${previewHeight - 20}px`
  
  return { previewTableHeight, previewAreaHeight }
}