from django.db import models

# 食材类别模型
class FoodCategory(models.Model):
    # 类别名（唯一，不重复）
    name = models.CharField(max_length=50, unique=True, verbose_name="类别名")
    # 创建时间（自动生成）
    create_time = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    # 更新时间（自动更新）
    update_time = models.DateTimeField(auto_now=True, verbose_name="更新时间")

    class Meta:
        verbose_name = "食材类别"
        verbose_name_plural = "食材类别"
        ordering = ["-create_time"]  # 按创建时间倒序

    def __str__(self):
        return self.name

# 食品模型（关联类别）
class FoodItem(models.Model):
    # 关联类别（外键，删除类别时级联删除食品）
    category = models.ForeignKey(FoodCategory, on_delete=models.CASCADE, related_name="foods", verbose_name="所属类别")
    # 食品名（唯一）
    name = models.CharField(max_length=50, unique=True, verbose_name="食品名")
    # 创建时间
    create_time = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")

    class Meta:
        verbose_name = "食品"
        verbose_name_plural = "食品"
        ordering = ["-create_time"]

    def __str__(self):
        return self.name