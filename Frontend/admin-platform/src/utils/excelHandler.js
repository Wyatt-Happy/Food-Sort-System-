// 1. Excel数据格式化（匹配OrderManage中调用）
export const formatExcelData = (originData, categoryList) => {
  return originData.map(item => {
    const foodRemark = item['食材备注'] || ''
    const orderRemark = item['订单备注'] || ''
    const mergeRemark = [foodRemark, orderRemark].filter(Boolean).join('；')
    const foodName = (item['食材名称'] || '').trim()
    const category = categoryList.find(c => c.foods.some(f => f.trim() === foodName))

    return {
      // 已删除「学校名称」字段
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

// 4. 导出数据处理（最终版：跟车单纯透传，供货商单保留计算）
export const getExportData = (filteredData, exportType) => {
  const exportData = []
  for (const row of filteredData) {
    // 基础数据提取：保留原始字段
    const base = {
      食堂名称: row['食堂名称'],
      配送日期: row['配送日期'],
      食材类别: row['食材类别'],
      食材名称: row['食材名称'],
      规格: row['规格'],
      单位: row['单位'],
      订单备注: row['订单备注'],
      原始数量: row['原始数量'] || row['数量'], // 下单数量=原表原始数量
      实际增减补: (row['实际增减补'] || '').trim() // 用户填写的实际数量，纯字符串透传
    }

    // 1. 供货商导出：填了用用户值，没填用原始值
    if (exportType === 'supplier') {
      let finalQty = base.原始数量
      if (base.实际增减补) {
        const inputQty = Number(base.实际增减补)
        finalQty = isNaN(inputQty) ? base.原始数量 : inputQty
      }
      exportData.push({
        ...base,
        数量: finalQty
      })
    }

    // 2. 跟车单导出：纯透传，不做任何计算（填显值/未填显空）
    else if (exportType === 'follower') {
      exportData.push({
        ...base,
        下单数量: base.原始数量, // 固定=原表原始数量
        实际数量: base.实际增减补 // 直接=用户填写值（空/填写值）
      })
    }
  }
  return exportData
}