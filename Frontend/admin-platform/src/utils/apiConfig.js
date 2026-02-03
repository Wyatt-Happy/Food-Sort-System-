// Frontend\admin-platform\src\utils\apiConfig.js
export const getApiBaseUrl = () => {
  const currentOrigin = window.location.origin;
  console.log('【当前前端访问地址】', currentOrigin);
  
  const isLocal = /localhost|127\.0\.0\.1/.test(currentOrigin);
  console.log('【是否本地环境】', isLocal);
  
  let baseUrl = '';
  if (isLocal) {
    // 本地环境仍用HTTP（127.0.0.1无HTTPS）
    baseUrl = 'http://127.0.0.1:8000';
  } else {
    // 核心修改：替换为最新的后端HTTPS域名
    baseUrl = 'https://4f75eb32.r10.cpolar.top';
  }
  
  console.log('【拼接的后端基础地址】', baseUrl);
  return baseUrl;
};

export const requestConfig = {
  timeout: 30000,
  withCredentials: true,
  crossDomain: true
};