# E:\work\backend\orders\views.py
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import re
import io
# 关键：注册系统字体解决中文显示问题
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.units import cm

# 全局配置：PDF样式参数（彻底解决字体问题）
# 1. 注册Windows系统自带的黑体（必存在，无环境依赖）
try:
    # 注册SimHei（黑体）- Windows默认路径
    pdfmetrics.registerFont(TTFont('SimHei', 'C:\\Windows\\Fonts\\simhei.ttf'))
    MAIN_FONT = 'SimHei'
except Exception as e:
    # 备用方案：使用reportlab内置字体（避免报错）
    print(f"字体注册失败：{e}，使用内置字体")
    MAIN_FONT = 'Helvetica'

# PDF样式常量
FONT_SIZE = 10
HEADER_FONT_SIZE = 12
TABLE_PADDING = 8
MARGIN = 2 * cm
BORDER_WIDTH = 1.5

# 订单PDF导出接口（保留原函数名兼容路由）
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
        # 标题样式
        title_style = ParagraphStyle(
            name='TitleStyle',
            fontName=MAIN_FONT,
            fontSize=HEADER_FONT_SIZE + 2,
            alignment=1,  # 居中
            textColor=colors.darkblue,
            spaceAfter=15
        )
        # 表头样式
        header_style = ParagraphStyle(
            name='HeaderStyle',
            fontName=MAIN_FONT,
            fontSize=HEADER_FONT_SIZE,
            alignment=1,
            textColor=colors.white,
            bold=True
        )
        # 内容样式
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

        # 4.1 供货商单逻辑
        if export_type == 'supplier':
            # 标题
            title_text = f"供货商单（配送日期：{selected_date}，食材类别：{selected_category}）"
            elements.append(Paragraph(title_text, title_style))
            elements.append(Spacer(1, 15))

            # 表头
            headers = ['学校名称', '食堂名称', '配送日期', '食材类别', '食材名称', '规格', '单位', '数量', '订单备注']
            table_data.append([Paragraph(h, header_style) for h in headers])

            # 数据行（容错处理所有值）
            for row in excel_data:
                final_qty = row.get('实际增减补') or row.get('原始数量') or ''
                school_name = re.sub(r'三河市', '', str(row.get('学校名称', '')))
                canteen_name = re.sub(r'三河市', '', str(row.get('食堂名称', '')))
                
                row_data = [
                    Paragraph(str(school_name), content_style),
                    Paragraph(str(canteen_name), content_style),
                    Paragraph(str(row.get('配送日期', '')), content_style),
                    Paragraph(str(row.get('食材类别', '')), content_style),
                    Paragraph(str(row.get('食材名称', '')), content_style),
                    Paragraph(str(row.get('规格', '')), content_style),
                    Paragraph(str(row.get('单位', '')), content_style),
                    Paragraph(str(final_qty), content_style),
                    Paragraph(str(row.get('订单备注', '')), content_style)
                ]
                table_data.append(row_data)

            # 文件名
            category_name = selected_category if selected_category != 'none' else '全部'
            filename = f'供货商单_{selected_date}_{category_name}.pdf'

        # 4.2 跟车单逻辑
        elif export_type == 'follower':
            # 标题
            title_text = f"跟车单（配送日期：{selected_date}，食堂名称：{selected_canteen}）"
            elements.append(Paragraph(title_text, title_style))
            elements.append(Spacer(1, 15))

            # 表头
            headers = ['食材名称', '标记', '备注', '规格', '单位', '下单数量', '实际数量']
            table_data.append([Paragraph(h, header_style) for h in headers])

            # 数据行（容错处理所有值）
            for row in excel_data:
                actual_qty = row.get('实际增减补') or row.get('原始数量') or ''
                
                row_data = [
                    Paragraph(str(row.get('食材名称', '')), content_style),
                    Paragraph('', content_style),
                    Paragraph(str(row.get('订单备注', '')), content_style),
                    Paragraph(str(row.get('规格', '')), content_style),
                    Paragraph(str(row.get('单位', '')), content_style),
                    Paragraph(str(row.get('原始数量', '')), content_style),
                    Paragraph(str(actual_qty), content_style)
                ]
                table_data.append(row_data)

            # 文件名
            filename = f'跟车单_{selected_date}_{selected_canteen}.pdf'

        # 5. 生成表格（带清晰格子）
        if not table_data:
            return HttpResponse('无数据可导出', status=400)
        
        # 适配列宽（避免内容溢出格子）
        col_widths = []
        if export_type == 'supplier':
            col_widths = [2.2*cm, 2.2*cm, 2*cm, 2*cm, 2.5*cm, 1.8*cm, 1.5*cm, 1.5*cm, 3*cm]
        else:
            col_widths = [2.8*cm, 1.5*cm, 3*cm, 2*cm, 1.5*cm, 1.8*cm, 1.8*cm]
        # 容错：列宽数量与表头一致
        col_widths = col_widths[:len(table_data[0])]

        # 创建表格并设置格子样式
        table = Table(table_data, colWidths=col_widths)
        table.setStyle(TableStyle([
            # 表头背景
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            # 表头文字颜色
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            # 居中对齐
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            # 字体
            ('FONTNAME', (0, 0), (-1, -1), MAIN_FONT),
            ('FONTSIZE', (0, 0), (-1, 0), HEADER_FONT_SIZE),
            ('FONTSIZE', (0, 1), (-1, -1), FONT_SIZE),
            # 单元格内边距
            ('BOTTOMPADDING', (0, 0), (-1, -1), TABLE_PADDING),
            ('TOPPADDING', (0, 0), (-1, -1), TABLE_PADDING),
            ('LEFTPADDING', (0, 0), (-1, -1), TABLE_PADDING),
            ('RIGHTPADDING', (0, 0), (-1, -1), TABLE_PADDING),
            # 核心：清晰的格子边框
            ('GRID', (0, 0), (-1, -1), BORDER_WIDTH, colors.black),
            # 隔行变色增强可读性
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ]))
        elements.append(table)

        # 6. 生成PDF文档
        doc.build(elements)
        buffer.seek(0)

        # 7. 返回PDF响应
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename*=utf-8\'\'{filename}'
        return response

    except Exception as e:
        error_msg = f'导出PDF失败：{str(e)}，错误类型：{type(e).__name__}'
        print(error_msg)
        return HttpResponse(error_msg, status=500)