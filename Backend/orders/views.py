from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import re
import io
import platform
from urllib.parse import quote  # 处理中文文件名

# 新增：Excel生成依赖
import xlsxwriter

# PDF相关依赖（保留）
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.units import cm

# 全局配置：PDF样式参数（保留）
MAIN_FONT = 'SimHei'  # 默认字体名
try:
    system_type = platform.system()
    if system_type == 'Windows':
        pdfmetrics.registerFont(TTFont('SimHei', 'C:\\Windows\\Fonts\\simhei.ttf'))
        print("【本地调试】已加载Windows SimHei字体")
    elif system_type == 'Linux':
        pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc'))
        print("【容器调试】已加载Linux WenQuanYiMicroHei字体")
except Exception as e:
    print(f"【字体警告】注册失败：{e}，使用默认字体（不影响网页访问）")

# PDF样式常量（保留）
FONT_SIZE = 10
HEADER_FONT_SIZE = 12
TABLE_PADDING = 8
MARGIN = 2 * cm
BORDER_WIDTH = 1.5


# ========== 复用逻辑：提取数据处理函数（最终版逻辑） ==========
def process_export_data(params):
    """
    统一处理导出数据（PDF/Excel共用）
    :param params: 请求参数
    :return: (table_headers, table_data, filename)
    """
    selected_date = params.get('selectedDate', '')
    selected_canteen = params.get('selectedCanteen', '')
    selected_category = params.get('selectedCategory', '')
    export_type = params.get('exportType', '')
    excel_data = params.get('excelData', [])

    table_headers = []
    table_data = []
    filename = ""

    # 供货商单逻辑：填了用用户值，没填用原始值
    if export_type == 'supplier':
        # 表头
        table_headers = ['食堂名称', '食材类别', '食材名称', '规格', '单位', '数量', '订单备注']
        # 数据行
        for row in excel_data:
            final_qty = row.get('数量', row.get('原始数量', ''))
            canteen_name = re.sub(r'三河市', '', str(row.get('食堂名称', '')))
            table_data.append([
                str(canteen_name),
                str(row.get('食材类别', '')),
                str(row.get('食材名称', '')),
                str(row.get('规格', '')),
                str(row.get('单位', '')),
                str(final_qty),
                str(row.get('订单备注', ''))
            ])
        # 文件名
        category_name = selected_category if selected_category != 'none' else '全部'
        filename = f'供货商单_{selected_date}_{category_name}.xlsx'

    # 跟车单逻辑：下单数量=原表值，实际数量=填显值/未填显空
    elif export_type == 'follower':
        # 表头
        table_headers = ['食材名称', '标记', '备注', '规格', '单位', '下单数量', '实际数量']
        # 数据行
        for row in excel_data:
            # 固定：下单数量=原表原始数量
            original_qty = str(row.get('原始数量', '')) if row.get('原始数量') else ''
            # 固定：实际数量=用户填写值（有值显值，无值显空）
            actual_qty = str(row.get('实际数量', '')) if row.get('实际数量') else ''
            
            table_data.append([
                str(row.get('食材名称', '')),
                '',  # 标记列固定空
                str(row.get('订单备注', '')),
                str(row.get('规格', '')),
                str(row.get('单位', '')),
                original_qty,  # 下单数量
                actual_qty     # 实际数量（填显值/未填显空）
            ])
        # 文件名
        filename = f'跟车单_{selected_date}_{selected_canteen}.xlsx'

    return table_headers, table_data, filename


# ========== PDF导出接口（最终版） ==========
@csrf_exempt
@require_POST
def export_order_excel(request):
    try:
        # 1. 接收参数并容错
        params = json.loads(request.body or '{}')
        selected_date = params.get('selectedDate', '')
        selected_canteen = params.get('selectedCanteen', '')
        selected_category = params.get('selectedCategory', '')
        export_type = params.get('exportType', '')
        excel_data = params.get('excelData', [])

        # 参数校验
        if not excel_data or not export_type or not selected_date:
            return HttpResponse('缺少必要参数', status=400)

        # 2. 初始化PDF文档
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=MARGIN,
            rightMargin=MARGIN,
            topMargin=MARGIN,
            bottomMargin=MARGIN
        )

        # 3. 定义PDF样式
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            name='TitleStyle',
            fontName=MAIN_FONT,
            fontSize=HEADER_FONT_SIZE + 2,
            alignment=1,
            textColor=colors.black,
            spaceAfter=15
        )
        header_style = ParagraphStyle(
            name='HeaderStyle',
            fontName=MAIN_FONT,
            fontSize=HEADER_FONT_SIZE,
            alignment=1,
            textColor=colors.black,
            bold=True
        )
        content_style = ParagraphStyle(
            name='ContentStyle',
            fontName=MAIN_FONT,
            fontSize=FONT_SIZE,
            alignment=1,
            textColor=colors.black
        )

        # 4. 构建PDF内容
        elements = []
        table_data = []
        filename = ""

        # 复用数据处理逻辑
        if export_type == 'supplier':
            title_text = f"供货商单（配送日期：{selected_date}，食材类别：{selected_category}）"
            elements.append(Paragraph(title_text, title_style))
            elements.append(Spacer(1, 15))
            headers = ['食堂名称', '食材类别', '食材名称', '规格', '单位', '数量', '订单备注']
            table_data.append([Paragraph(h, header_style) for h in headers])
            
            # 处理数据行
            processed_headers, processed_rows, filename = process_export_data(params)
            for row in processed_rows:
                table_data.append([Paragraph(cell, content_style) for cell in row])
            filename = filename.replace('.xlsx', '.pdf')

        elif export_type == 'follower':
            title_text = f"跟车单（配送日期：{selected_date}，食堂名称：{selected_canteen}）"
            elements.append(Paragraph(title_text, title_style))
            elements.append(Spacer(1, 15))
            headers = ['食材名称', '标记', '备注', '规格', '单位', '下单数量', '实际数量']
            table_data.append([Paragraph(h, header_style) for h in headers])
            
            # 处理数据行
            processed_headers, processed_rows, filename = process_export_data(params)
            for row in processed_rows:
                table_data.append([Paragraph(cell, content_style) for cell in row])
            filename = filename.replace('.xlsx', '.pdf')

        # 5. 生成表格
        if not table_data:
            return HttpResponse('无数据可导出', status=400)

        # 适配列宽
        col_widths = []
        if export_type == 'supplier':
            col_widths = [2.2 * cm, 2 * cm, 2.5 * cm, 1.8 * cm, 1.5 * cm, 1.5 * cm, 3 * cm]
        else:
            col_widths = [2.8 * cm, 1.5 * cm, 3 * cm, 2 * cm, 1.5 * cm, 1.8 * cm, 1.8 * cm]
        col_widths = col_widths[:len(table_data[0])]

        # 表格样式
        table = Table(table_data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, -1), MAIN_FONT),
            ('FONTSIZE', (0, 0), (-1, 0), HEADER_FONT_SIZE),
            ('FONTSIZE', (0, 1), (-1, -1), FONT_SIZE),
            ('BOTTOMPADDING', (0, 0), (-1, -1), TABLE_PADDING),
            ('TOPPADDING', (0, 0), (-1, -1), TABLE_PADDING),
            ('LEFTPADDING', (0, 0), (-1, -1), TABLE_PADDING),
            ('RIGHTPADDING', (0, 0), (-1, -1), TABLE_PADDING),
            ('GRID', (0, 0), (-1, -1), BORDER_WIDTH, colors.black),
        ]))
        elements.append(table)

        # 6. 生成PDF文档
        doc.build(elements)
        buffer.seek(0)

        # 7. 返回PDF响应
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename*=utf-8\'\'{quote(filename)}'
        return response

    except Exception as e:
        error_msg = f'导出PDF失败：{str(e)}，错误类型：{type(e).__name__}'
        print(error_msg)
        return HttpResponse(error_msg, status=500)


# ========== Excel导出接口（最终版：标题行合并+逻辑修复） ==========
@csrf_exempt
@require_POST
def export_order_excel_file(request):
    try:
        # 1. 接收参数并容错
        params = json.loads(request.body or '{}')
        selected_date = params.get('selectedDate', '')
        selected_canteen = params.get('selectedCanteen', '')
        selected_category = params.get('selectedCategory', '')
        export_type = params.get('exportType', '')
        excel_data = params.get('excelData', [])

        # 参数校验
        if not excel_data or not export_type or not selected_date:
            return HttpResponse('缺少必要参数', status=400)

        # 2. 初始化Excel缓冲区
        buffer = io.BytesIO()
        workbook = xlsxwriter.Workbook(buffer, {'in_memory': True})
        worksheet = workbook.add_worksheet('导出数据')

        # 3. 设置Excel样式
        # 标题样式（第一行）
        title_format = workbook.add_format({
            'bold': True,
            'font_size': 14,
            'align': 'center',
            'valign': 'vcenter',
            'bg_color': '#409EFF',
            'font_color': '#FFFFFF',
            'border': 1
        })
        # 表头样式（第二行）
        header_format = workbook.add_format({
            'bold': True,
            'align': 'center',
            'valign': 'vcenter',
            'bg_color': '#f0f0f0',
            'border': 1
        })
        # 内容样式（第三行及以后）
        content_format = workbook.add_format({
            'align': 'center',
            'valign': 'vcenter',
            'border': 1
        })

        # 4. 处理导出数据
        table_headers, table_data, filename = process_export_data(params)
        
        # 生成标题文字（和文件名一致）
        title_text = filename.replace('.xlsx', '')
        
        # 5. 第一行：合并单元格+写入标题
        header_count = len(table_headers)
        last_col = header_count - 1
        worksheet.merge_range(0, 0, 0, last_col, title_text, title_format)
        worksheet.set_row(0, 25)  # 标题行高度

        # 6. 第二行：写入表头
        worksheet.set_row(1, 20)  # 表头行高度
        for col, header in enumerate(table_headers):
            worksheet.write(1, col, header, header_format)

        # 7. 第三行开始：写入数据行
        for row, row_data in enumerate(table_data, start=2):
            for col, cell_data in enumerate(row_data):
                worksheet.write(row, col, cell_data, content_format)

        # 8. 调整列宽
        column_widths = [15, 12, 20, 12, 8, 10, 20]
        for col, width in enumerate(column_widths):
            worksheet.set_column(col, col, width)

        # 9. 关闭工作簿
        workbook.close()
        buffer.seek(0)

        # 10. 返回Excel响应
        response = HttpResponse(buffer.getvalue(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename*=utf-8\'\'{quote(filename)}'
        return response

    except Exception as e:
        error_msg = f'导出Excel失败：{str(e)}，错误类型：{type(e).__name__}'
        print(error_msg)
        return HttpResponse(error_msg, status=500)