// Frontend\admin-platform\src\utils\storageHandler.js
import axios from 'axios';
import { ElMessage } from 'element-plus'; // 引入Element Plus提示组件
// 导入utils下的apiConfig配置
import { getApiBaseUrl, requestConfig } from './apiConfig.js';

// ========== 核心优化1：全局配置增强 ==========
// 使用动态后端地址，拼接/api前缀（增加空值校验）
const baseUrl = getApiBaseUrl() || '';
const fullBaseUrl = baseUrl ? `${baseUrl}/api` : '';
console.log('【storageHandler - 完整baseURL】', fullBaseUrl); // 打印拼接后的baseURL

// 创建axios实例（增加配置兜底，修复axios.Agent错误）
const api = axios.create({
  baseURL: fullBaseUrl,  // 动态地址 + /api 前缀
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // 新增：标识AJAX请求，适配Django CSRF
  },
  timeout: requestConfig.timeout || 30000,  // 通用超时时间（增加兜底）
  withCredentials: requestConfig.withCredentials ?? true,  // 携带Cookie（增加空值处理）
  crossDomain: requestConfig.crossDomain ?? true, // 允许跨域（增加空值处理）
  // 修复：移除错误的axios.Agent，改用正确的httpsAgent配置（仅Node.js环境需要，浏览器环境自动忽略）
  ...(baseUrl.startsWith('https') && {
    httpsAgent: typeof window === 'undefined' 
      ? new (require('https').Agent)({ rejectUnauthorized: false }) 
      : undefined
  })
})

// ========== 核心优化2：请求拦截器增强 ==========
api.interceptors.request.use(
  (config) => {
    // 1. 打印最终请求地址（增加空值校验）
    const finalUrl = config.baseURL && config.url 
      ? `${config.baseURL}${config.url}` 
      : '地址拼接失败';
    console.log('【最终请求地址】', finalUrl);

    // 2. 基础校验：地址为空时直接拦截
    if (!config.baseURL) {
      ElMessage.error('后端接口地址配置错误，请检查apiConfig.js');
      return Promise.reject(new Error('后端接口地址配置错误'));
    }

    // 3. 提取CSRF Token（优化提取逻辑，增加兼容性）
    const getCsrfToken = () => {
      if (!document.cookie) return '';
      // 兼容不同Cookie格式
      const cookieArr = document.cookie.split('; ');
      for (const cookie of cookieArr) {
        const [key, value] = cookie.split('=');
        if (key === 'csrftoken') {
          return value || '';
        }
      }
      return '';
    };

    // 4. 添加CSRF Token（HTTPS环境强制添加）
    const csrfToken = getCsrfToken();
    if (csrfToken || baseUrl.startsWith('https')) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
  },
  (error) => {
    console.error('【请求拦截器错误】', error);
    ElMessage.error('请求初始化失败，请稍后重试');
    return Promise.reject(error);
  }
);

// ========== 核心优化3：响应拦截器增强 ==========
api.interceptors.response.use(
  (response) => {
    // 1. 打印响应信息（调试用）
    console.log('【接口响应成功】', {
      status: response.status,
      data: response.data
    });
    
    // 2. 适配DRF ViewSet的results（增加空值校验）
    return response.data?.results || response.data || {};
  },
  (error) => {
    // 1. 分类处理不同错误类型
    let errMsg = '加载数据失败';
    
    // 网络错误（无响应）
    if (!error.response) {
      if (error.message.includes('Network Error')) {
        errMsg = '网络连接失败，请检查：1.后端服务是否运行 2.跨域配置是否正确 3.HTTPS/HTTP协议是否匹配';
      } else if (error.message.includes('timeout')) {
        errMsg = '请求超时，请稍后重试';
      } else {
        errMsg = `网络错误：${error.message}`;
      }
    } 
    // 服务器响应错误
    else {
      const { status, data } = error.response;
      switch (status) {
        case 403:
          errMsg = '权限不足：CSRF Token验证失败，请刷新页面重试';
          break;
        case 404:
          errMsg = `接口不存在：${error.config.url}`;
          break;
        case 500:
          errMsg = '服务器内部错误，请联系管理员';
          break;
        default:
          errMsg = `请求失败 [${status}]：${data?.message || data?.detail || '未知错误'}`;
      }
    }

    // 2. 打印完整错误信息（便于调试）
    console.error('【加载类别失败详情】', {
      message: errMsg,
      originalError: error,
      config: error.config,
      response: error.response
    });

    // 3. 友好的错误提示（避免重复提示）
    if (!errMsg.includes('取消请求')) {
      ElMessage.error(errMsg);
    }

    // 4. 统一错误格式
    return Promise.reject(new Error(errMsg));
  }
);

// ========== 核心优化4：API方法封装（增加防抖/重复请求处理） ==========
// 存储正在进行的请求，防止重复请求
const pendingRequests = new Set();

/**
 * 获取分类列表
 * @returns {Promise<Array>} 分类列表
 */
export const getCategories = async () => {
  const requestKey = 'GET:/category/categories/';
  // 防止重复请求
  if (pendingRequests.has(requestKey)) {
    console.warn('【重复请求拦截】', requestKey);
    return Promise.reject(new Error('请求已在处理中，请稍后重试'));
  }

  try {
    pendingRequests.add(requestKey);
    return await api.get('/category/categories/');
  } finally {
    pendingRequests.delete(requestKey);
  }
};

/**
 * 创建分类
 * @param {Object} data 分类数据 { name: string, foods: Array }
 * @returns {Promise<Object>} 创建的分类
 */
export const createCategory = async (data) => {
  // 数据校验
  if (!data?.name) {
    ElMessage.warning('分类名称不能为空');
    return Promise.reject(new Error('分类名称不能为空'));
  }
  return await api.post('/category/categories/', data);
};

/**
 * 更新分类
 * @param {number|string} id 分类ID
 * @param {Object} data 分类数据
 * @returns {Promise<Object>} 更新后的分类
 */
export const updateCategory = async (id, data) => {
  // 数据校验
  if (!id) {
    ElMessage.warning('分类ID不能为空');
    return Promise.reject(new Error('分类ID不能为空'));
  }
  if (!data?.name) {
    ElMessage.warning('分类名称不能为空');
    return Promise.reject(new Error('分类名称不能为空'));
  }
  return await api.put(`/category/categories/${id}/`, data);
};

/**
 * 删除分类
 * @param {number|string} id 分类ID
 * @returns {Promise<Object>} 删除结果
 */
export const deleteCategory = async (id) => {
  // 数据校验
  if (!id) {
    ElMessage.warning('分类ID不能为空');
    return Promise.reject(new Error('分类ID不能为空'));
  }
  return await api.delete(`/category/categories/${id}/`);
};

// ========== 核心优化5：导出通用请求方法（便于扩展） ==========
/**
 * 通用请求方法
 * @param {string} method 请求方法 GET/POST/PUT/DELETE
 * @param {string} url 接口路径
 * @param {Object} data 请求数据
 * @returns {Promise<any>} 响应数据
 */
export const request = async (method, url, data = {}) => {
  const requestKey = `${method}:${url}`;
  if (pendingRequests.has(requestKey)) {
    console.warn('【重复请求拦截】', requestKey);
    return Promise.reject(new Error('请求已在处理中，请稍后重试'));
  }

  try {
    pendingRequests.add(requestKey);
    switch (method.toUpperCase()) {
      case 'GET':
        return await api.get(url, { params: data });
      case 'POST':
        return await api.post(url, data);
      case 'PUT':
        return await api.put(url, data);
      case 'DELETE':
        return await api.delete(url);
      default:
        throw new Error(`不支持的请求方法：${method}`);
    }
  } finally {
    pendingRequests.delete(requestKey);
  }
};

export default api;