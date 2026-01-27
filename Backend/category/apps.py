from django.apps import AppConfig

class CategoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'category'  # 必须和应用名一致
    verbose_name = '食材类别管理'  # 可选，中文名称