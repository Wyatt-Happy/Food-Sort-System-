// 1. Excel数据格式化（匹配OrderManage中调用）
export const formatExcelData = (originData, categoryList) => {
  return originData.map(item => {
    const foodRemark = item['食材备注'] || ''
    const orderRemark = item['订单备注'] || ''
    const mergeRemark = [foodRemark, orderRemark].filter(Boolean).join('；')
    const foodName = (item['食材名称'] || '').trim()
    const category = categoryList.find(c => c.foods.some(f => f.trim() === foodName))

    return {
      '学校名称': item['学校名称'] || '',
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

// 2. 食材映射校验（匹配OrderManage中调用）
export const checkFoodMapping = (formattedData, categoryList) => {
  const allFoods = formattedData.map(item => item['食材名称'].trim()).filter(Boolean)
  if (allFoods.length === 0) {
    return { isAllMapped: true, unmapped: [] }
  }
  const uniqueExcelFoods = [...new Set(allFoods)]
  const mappedFoods = [...new Set(categoryList.flatMap(item => item.foods.map(f => f.trim())))]
  const unmapped = uniqueExcelFoods.filter(food => food && !mappedFoods.includes(food))
  return { isAllMapped: unmapped.length === 0, unmapped }
}

// 3. 提取配送日期（匹配OrderManage中调用）
export const extractAndProcessDeliveryDate = (data, dateListRef) => {
  const dateSet = new Set()
  data.forEach(item => {
    if (item['配送日期']) dateSet.add(item['配送日期'])
  })
  const dateArray = Array.from(dateSet).filter(Boolean)
  dateArray.sort((a, b) => new Date(a) - new Date(b))
  dateListRef.value = dateArray
}

// 4. 导出数据处理（核心修复：供货商/跟车单导出规则）
export const getExportData = (filteredData, exportType) => {
  const exportData = []
  for (const row of filteredData) {
    // 基础数据提取
    const base = {
      学校名称: row['学校名称'],
      食堂名称: row['食堂名称'],
      配送日期: row['配送日期'],
      食材类别: row['食材类别'],
      食材名称: row['食材名称'],
      规格: row['规格'],
      单位: row['单位'],
      订单备注: row['订单备注'],
      原始数量: row['原始数量'] || row['数量'], // 导入的原始数量
      实际增减补: (row['实际增减补'] || '').trim() // 用户填写的增减补
    }

    // 1. 供货商导出：仅保留最终数量，无原始/增减补列
    if (exportType === 'supplier') {
      let finalQty = base.原始数量
      // 有填写实际增减补 → 直接覆盖数量；无填写 → 用导入的原始数量
      if (base.实际增减补) {
        const inputQty = Number(base.实际增减补)
        finalQty = isNaN(inputQty) ? base.原始数量 : inputQty
      }
      exportData.push({
        学校名称: base.学校名称,
        食堂名称: base.食堂名称,
        配送日期: base.配送日期,
        食材类别: base.食材类别,
        食材名称: base.食材名称,
        规格: base.规格,
        单位: base.单位,
        数量: finalQty, // 最终唯一数量列
        订单备注: base.订单备注
      })
    }

    // 2. 跟车单导出：下单数量=原始数量，实际数量=原始±增减补（无则为原始）
    else if (exportType === 'follower') {
      let actualQty = base.原始数量
      if (base.实际增减补) {
        const adjustNum = Number(base.实际增减补)
        if (!isNaN(adjustNum)) actualQty += adjustNum
      }
      actualQty = Math.max(0, actualQty) // 确保数量非负
      exportData.push({
        食材名称: base.食材名称,
        标记: '', // 空列，用户手工填
        备注: base.订单备注,
        规格: base.规格,
        单位: base.单位,
        下单数量: base.原始数量, // 导入的原始数量
        实际数量: actualQty // 填写增减补后的实际数量
      })
    }
  }
  return exportData
}