from django.contrib import admin
from django.urls import path, include
# 注释掉以下所有 drf-yasg 相关导入
# from drf_yasg.views import get_schema_view
# from drf_yasg import openapi
# from rest_framework import permissions

# 注释掉接口文档配置
# schema_view = get_schema_view(
#    openapi.Info(
#       title="分拣管理系统API",
#       default_version='v1',
#       description="类别管理接口文档",
#    ),
#    public=True,
#    permission_classes=(permissions.AllowAny,),
# )

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('category.urls')),
    # 注释掉接口文档路由
    # path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    # path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]