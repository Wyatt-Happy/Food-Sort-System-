from django.contrib import admin
from .models import FoodCategory, FoodItem

# 注册食品模型（作为类别模型的内联显示）
class FoodItemInline(admin.TabularInline):
    model = FoodItem  # 关联食品模型
    extra = 1  # 默认显示1个新增食品的输入框
    fields = ['name']  # 后台显示的字段（只显示食品名）

# 注册类别模型
@admin.register(FoodCategory)
class FoodCategoryAdmin(admin.ModelAdmin):
    # 后台列表显示的字段
    list_display = ['id', 'name', 'create_time', 'update_time']
    # 可搜索的字段（按类别名搜索）
    search_fields = ['name']
    # 过滤器（按创建时间过滤）
    list_filter = ['create_time']
    # 编辑页面显示的字段
    fields = ['name']
    # 内联显示食品（编辑类别时可直接编辑关联的食品）
    inlines = [FoodItemInline]

# 单独注册食品模型（可选，方便单独管理食品）
@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category', 'create_time']
    search_fields = ['name']
    list_filter = ['category']  # 按类别过滤食品