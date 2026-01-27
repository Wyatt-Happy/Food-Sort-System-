from rest_framework import serializers
from .models import FoodCategory, FoodItem

# 食品序列化器
class FoodItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodItem
        fields = ["id", "name"]  # 只返回id和名称（前端需要）

# 类别序列化器（包含关联的食品）
class FoodCategorySerializer(serializers.ModelSerializer):
    # 嵌套食品序列化器，返回类别下的所有食品
    foods = FoodItemSerializer(many=True, read_only=True)

    class Meta:
        model = FoodCategory
        fields = ["id", "name", "foods"]  # 对应前端的 {name: '', foods: []} 结构