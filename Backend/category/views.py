from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny  # 新增：导入AllowAny
from .models import FoodCategory, FoodItem
from .serializers import FoodCategorySerializer

# 类别视图集（包含增删改查所有接口）
class FoodCategoryViewSet(viewsets.ModelViewSet):
    # 查询所有类别
    queryset = FoodCategory.objects.all()
    serializer_class = FoodCategorySerializer
    # 核心修复：显式配置允许所有访问（覆盖全局/默认权限）
    permission_classes = [AllowAny]

    # 新增：打印权限配置（验证是否生效）
    def dispatch(self, request, *args, **kwargs):
        # 打印当前视图的权限类（重启后端后看控制台）
        print("=== 权限配置调试 ===")
        print("全局DRF权限类：", self.get_permissions())
        print("请求方法：", request.method)
        print("请求路径：", request.path)
        print("是否认证：", request.user.is_authenticated)
        # 执行原有的dispatch逻辑
        response = super().dispatch(request, *args, **kwargs)
        return response

    # 重写创建方法（原有逻辑不变）
    def create(self, request, *args, **kwargs):
        # 前端传参格式：{name: '类别名', foods: ['食品1', '食品2']}
        category_name = request.data.get("name")
        food_names = request.data.get("foods", [])

        # 校验类别名是否为空
        if not category_name:
            return Response({"error": "类别名不能为空"}, status=status.HTTP_400_BAD_REQUEST)
        # 校验类别名是否已存在
        if FoodCategory.objects.filter(name=category_name).exists():
            return Response({"error": "该类别名已存在"}, status=status.HTTP_400_BAD_REQUEST)
        
        # 创建类别
        category = FoodCategory.objects.create(name=category_name)
        # 创建食品（去重）
        for food_name in set(food_names):
            if food_name.strip():  # 过滤空字符串
                FoodItem.objects.get_or_create(name=food_name.strip(), category=category)
        
        # 返回创建后的类别数据
        serializer = self.get_serializer(category)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # 重写更新方法（原有逻辑不变）
    def update(self, request, *args, **kwargs):
        category = self.get_object()
        category_name = request.data.get("name")
        food_names = request.data.get("foods", [])

        # 校验类别名
        if category_name and category_name != category.name:
            if FoodCategory.objects.filter(name=category_name).exclude(id=category.id).exists():
                return Response({"error": "该类别名已存在"}, status=status.HTTP_400_BAD_REQUEST)
            category.name = category_name
            category.save()
        
        # 更新食品（先删除原有食品，再创建新的）
        if food_names is not None:
            category.foods.all().delete()  # 删除原有食品
            for food_name in set(food_names):
                if food_name.strip():
                    FoodItem.objects.create(name=food_name.strip(), category=category)
        
        serializer = self.get_serializer(category)
        return Response(serializer.data)

    # 重写删除方法（原有逻辑不变）
    def destroy(self, request, *args, **kwargs):
        category = self.get_object()
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)