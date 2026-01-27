import axios from 'axios'

// 核心：baseURL设为'/api'，匹配后端路径
const api = axios.create({
  baseURL: '/api',  // 对应后端/api前缀
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000,  // 延长超时时间（解决10s超时）
  withCredentials: true  // 仅保留携带Cookie（CSRF核心）
})

// 请求拦截器：只保留CSRF Token提取，删除Origin/Referer手动设置
api.interceptors.request.use(config => {
  // 提取CSRF Token（仅保留这个核心逻辑）
  const getCsrfToken = () => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrftoken=`);
    return parts.length === 2 ? parts.pop().split(';').shift() : '';
  };
  
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  
  // 彻底删除Origin/Referer手动设置（浏览器会自动添加）
  return config;
}, error => Promise.reject(error));

// 响应拦截器：适配DRF ViewSet的results，统一处理错误
api.interceptors.response.use(
  response => {
    // DRF列表接口返回{count:..., results:[]}，提取results
    return response.data.results || response.data;
  },
  error => {
    const errMsg = error.message || '加载类别失败';
    console.error('加载类别失败：', errMsg);
    return Promise.reject(new Error(errMsg));
  }
);

// 接口路径（匹配后端DRF路由器）
export const getCategories = () => api.get('/categories/');
export const createCategory = (data) => api.post('/categories/', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}/`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}/`);

export default api;