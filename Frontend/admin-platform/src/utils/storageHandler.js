// Frontend\admin-platform\src\utils\storageHandler.js
import axios from 'axios';
import { ElMessage } from 'element-plus';
import { getApiBaseUrl, requestConfig } from './apiConfig.js';

// ========== 基础配置 ==========
const baseUrl = getApiBaseUrl() || '';
const fullBaseUrl = baseUrl ? `${baseUrl}/api` : '';
console.log('【storageHandler - 完整baseURL】', fullBaseUrl);

// 创建axios实例
const api = axios.create({
  baseURL: fullBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: requestConfig.timeout || 30000,
  withCredentials: requestConfig.withCredentials ?? true,
  crossDomain: requestConfig.crossDomain ?? true,
})

// ========== 全局缓存 + 加载状态（新增核心逻辑） ==========
// 1. 分类数据全局缓存（所有组件共享）
let categoryCache = [];
// 2. 加载状态锁（防止同一时间多次请求）
let isCategoryLoading = false;

// ========== 请求拦截器（仅保留必要功能） ==========
api.interceptors.request.use(
  (config) => {
    // 打印请求地址
    const finalUrl = config.baseURL && config.url 
      ? `${config.baseURL}${config.url}` 
      : '地址拼接失败';
    console.log('【最终请求地址】', finalUrl);

    // 基础校验
    if (!config.baseURL) {
      ElMessage.error('后端接口地址配置错误，请检查apiConfig.js');
      return Promise.reject(new Error('后端接口地址配置错误'));
    }

    // 提取并添加CSRF Token
    const getCsrfToken = () => {
      if (!document.cookie) return '';
      const cookieArr = document.cookie.split('; ');
      for (const cookie of cookieArr) {
        const [key, value] = cookie.split('=');
        if (key === 'csrftoken') {
          return value || '';
        }
      }
      return '';
    };
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

// ========== 响应拦截器（移除canceled相关逻辑） ==========
api.interceptors.response.use(
  (response) => {
    console.log('【接口响应成功】', {
      status: response.status,
      data: response.data
    });
    return response.data?.results || response.data || {};
  },
  (error) => {
    // 分类处理错误（移除canceled相关逻辑）
    let errMsg = '加载数据失败';
    
    if (!error.response) {
      if (error.message.includes('Network Error')) {
        errMsg = '网络连接失败，请检查后端服务是否运行';
      } else if (error.message.includes('timeout')) {
        errMsg = '请求超时，请稍后重试';
      } else {
        errMsg = `网络错误：${error.message}`;
      }
    } else {
      const { status, data } = error.response;
      switch (status) {
        case 403:
          errMsg = '权限不足：CSRF Token验证失败，请刷新页面';
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

    // 打印错误日志
    console.error('【接口请求失败详情】', {
      message: errMsg,
      originalError: error,
      config: error.config,
      response: error.response
    });

    // 统一错误提示
    ElMessage.error(errMsg);

    // 正常抛错，由调用方处理
    return Promise.reject(new Error(errMsg));
  }
);

// ========== API方法（优化getCategories，新增全局缓存逻辑） ==========
/**
 * 获取分类列表（带全局缓存+加载状态控制）
 * @param {boolean} forceRefresh - 是否强制刷新（忽略缓存）
 * @returns {Promise<Array>} 分类列表
 */
export const getCategories = async (forceRefresh = false) => {
  // 1. 已有缓存且不强制刷新 → 直接返回缓存
  if (categoryCache.length > 0 && !forceRefresh) {
    console.log('💡 使用全局缓存的分类数据，跳过重复请求');
    return [...categoryCache]; // 返回副本，避免外部修改缓存
  }

  // 2. 正在加载中 → 等待加载完成（防止重复请求）
  if (isCategoryLoading) {
    console.log('💡 分类数据正在加载中，等待请求完成');
    // 轮询等待加载完成（最多等10秒，避免无限等待）
    return new Promise((resolve, reject) => {
      const maxWaitTime = 10000;
      const startTime = Date.now();
      const checkLoading = () => {
        if (categoryCache.length > 0) {
          resolve([...categoryCache]);
        } else if (Date.now() - startTime > maxWaitTime) {
          reject(new Error('获取分类数据超时'));
        } else if (!isCategoryLoading) {
          reject(new Error('获取分类数据失败'));
        } else {
          setTimeout(checkLoading, 100);
        }
      };
      checkLoading();
    });
  }

  // 3. 开始请求：加锁 + 调用接口
  isCategoryLoading = true;
  try {
    const res = await api.get('/category/categories/');
    // 更新全局缓存
    categoryCache = res || [];
    console.log('✅ 分类数据请求成功，已更新全局缓存');
    return [...categoryCache]; // 返回副本
  } catch (error) {
    console.warn('获取分类失败，返回空数组：', error);
    return []; // 兜底返回空数组
  } finally {
    // 无论成功/失败，都解锁
    isCategoryLoading = false;
  }
};

/**
 * 主动清空分类缓存（新增：用于新增/编辑/删除后刷新）
 */
export const clearCategoryCache = () => {
  categoryCache = [];
  console.log('🗑️ 已清空分类全局缓存');
};

/**
 * 创建分类（创建后清空缓存，确保下次获取最新数据）
 * @param {Object} data 分类数据
 * @returns {Promise<Object>}
 */
export const createCategory = async (data) => {
  if (!data?.name) {
    ElMessage.warning('分类名称不能为空');
    return Promise.reject(new Error('分类名称不能为空'));
  }
  const res = await api.post('/category/categories/', data);
  clearCategoryCache(); // 创建成功后清空缓存
  return res;
};

/**
 * 更新分类（更新后清空缓存）
 * @param {string|number} id 分类ID
 * @param {Object} data 分类数据
 * @returns {Promise<Object>}
 */
export const updateCategory = async (id, data) => {
  if (!id) {
    ElMessage.warning('分类ID不能为空');
    return Promise.reject(new Error('分类ID不能为空'));
  }
  if (!data?.name) {
    ElMessage.warning('分类名称不能为空');
    return Promise.reject(new Error('分类名称不能为空'));
  }
  const res = await api.put(`/category/categories/${id}/`, data);
  clearCategoryCache(); // 更新成功后清空缓存
  return res;
};

/**
 * 删除分类（删除后清空缓存）
 * @param {string|number} id 分类ID
 * @returns {Promise<Object>}
 */
export const deleteCategory = async (id) => {
  if (!id) {
    ElMessage.warning('分类ID不能为空');
    return Promise.reject(new Error('分类ID不能为空'));
  }
  const res = await api.delete(`/category/categories/${id}/`);
  clearCategoryCache(); // 删除成功后清空缓存
  return res;
};

/**
 * 通用请求方法
 * @param {string} method 请求方法
 * @param {string} url 接口路径
 * @param {Object} data 请求数据
 * @returns {Promise<any>}
 */
export const request = async (method, url, data = {}) => {
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
};

export default api;