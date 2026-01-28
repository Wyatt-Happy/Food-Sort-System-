from django.urls import path
from .views import export_order_excel

urlpatterns = [
    path('export-excel/', export_order_excel, name='export_order_excel'),  # 最终路径：/api/orders/export-excel/
]