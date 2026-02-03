from django.urls import path
from .views import export_order_excel,export_order_excel_file

urlpatterns = [
    path('export-excel/', export_order_excel, name='export_order_excel'),  # 最终路径：/api/orders/export-excel/
    path('export-excel-file/', export_order_excel_file, name='export-excel-file'),
]