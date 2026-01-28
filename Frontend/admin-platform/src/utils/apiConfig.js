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
    // 公网环境改为HTTPS，去掉8000端口！
    baseUrl = 'https://3f7748e1.r10.cpolar.top';
    // ❌ 原错误：http://3f7748e1.r10.cpolar.top:8000（HTTP+端口）
    // ✅ 正确：https://3f7748e1.r10.cpolar.top（HTTPS+无端口）
  }
  
  console.log('【拼接的后端基础地址】', baseUrl);
  return baseUrl;
};

export const requestConfig = {
  timeout: 30000,
  withCredentials: true,
  crossDomain: true
};