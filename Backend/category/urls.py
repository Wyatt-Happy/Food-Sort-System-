from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FoodCategoryViewSet

# 创建路由器
router = DefaultRouter()
# 注册类别接口，路由前缀：/categories/
router.register(r'categories', FoodCategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]