from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
import re
import io
# 仅保留核心兼容逻辑，简化判断避免崩溃
import platform

# 关键：注册系统字体解决中文显示问题
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.units import cm

# 全局配置：PDF样式参数（兼容Windows/Docker Linux + 无蓝色样式）
MAIN_FONT = 'SimHei'  # 默认字体名
# 简化字体注册逻辑：优先Windows，失败则跳过（不影响网页加载）
try:
    system_type = platform.system()
    if system_type == 'Windows':
        # Windows本地：注册系统黑体（原路径）
        pdfmetrics.registerFont(TTFont('SimHei', 'C:\\Windows\\Fonts\\simhei.ttf'))
        print("【本地调试】已加载Windows SimHei字体")
    elif system_type == 'Linux':
        # Docker容器：注册文泉驿微米黑
        pdfmetrics.registerFont(TTFont('SimHei', '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc'))
        print("【容器调试】已加载Linux WenQuanYiMicroHei字体")
    # 异常仅打印日志，不修改MAIN_FONT（避免网页崩溃）
except Exception as e:
    print(f"【字体警告】注册失败：{e}，使用默认字体（不影响网页访问）")

# PDF样式常量（与原代码一致）
FONT_SIZE = 10
HEADER_FONT_SIZE = 12
TABLE_PADDING = 8
MARGIN = 2 * cm
BORDER_WIDTH = 1.5


# 订单PDF导出接口（核心逻辑与原代码一致，仅改样式）
@csrf_exempt
@require_POST
def export_order_excel(request):
    try:
        # 1. 接收参数并容错（原逻辑不变）
        params = json.loads(request.body or '{}')
        selected_date = params.get('selectedDate', '')
        selected_canteen = params.get('selectedCanteen', '')
        selected_category = params.get('selectedCategory', '')
        export_type = params.get('exportType', '')
        excel_data = params.get('excelData', [])

        # 参数校验（原逻辑不变）
        if not excel_data or not export_type or not selected_date:
            return HttpResponse('缺少必要参数', status=400)

        # 2. 初始化PDF文档（原逻辑不变）
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=MARGIN,
            rightMargin=MARGIN,
            topMargin=MARGIN,
            bottomMargin=MARGIN
        )

        # 3. 定义PDF样式（无蓝色，文字全黑）
        styles = getSampleStyleSheet()
        # 标题样式：黑色文字，居中
        title_style = ParagraphStyle(
            name='TitleStyle',
            fontName=MAIN_FONT,
            fontSize=HEADER_FONT_SIZE + 2,
            alignment=1,
            textColor=colors.black,  # 取消蓝色
            spaceAfter=15
        )
        # 表头样式：黑色文字，加粗
        header_style = ParagraphStyle(
            name='HeaderStyle',
            fontName=MAIN_FONT,
            fontSize=HEADER_FONT_SIZE,
            alignment=1,
            textColor=colors.black,  # 取消白色
            bold=True
        )
        # 内容样式：黑色文字
        content_style = ParagraphStyle(
            name='ContentStyle',
            fontName=MAIN_FONT,
            fontSize=FONT_SIZE,
            alignment=1,
            textColor=colors.black
        )

        # 4. 构建PDF内容（原业务逻辑完全不变）
        elements = []
        table_data = []
        filename = ""

        # 4.1 供货商单逻辑（原逻辑不变）
        if export_type == 'supplier':
            title_text = f"供货商单（配送日期：{selected_date}，食材类别：{selected_category}）"
            elements.append(Paragraph(title_text, title_style))
            elements.append(Spacer(1, 15))

            headers = ['学校名称', '食堂名称', '配送日期', '食材类别', '食材名称', '规格', '单位', '数量', '订单备注']
            table_data.append([Paragraph(h, header_style) for h in headers])

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

            category_name = selected_category if selected_category != 'none' else '全部'
            filename = f'供货商单_{selected_date}_{category_name}.pdf'

        # 4.2 跟车单逻辑（原逻辑不变）
        elif export_type == 'follower':
            title_text = f"跟车单（配送日期：{selected_date}，食堂名称：{selected_canteen}）"
            elements.append(Paragraph(title_text, title_style))
            elements.append(Spacer(1, 15))

            headers = ['食材名称', '标记', '备注', '规格', '单位', '下单数量', '实际数量']
            table_data.append([Paragraph(h, header_style) for h in headers])

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

            filename = f'跟车单_{selected_date}_{selected_canteen}.pdf'

        # 5. 生成表格（无蓝色背景、无隔行变色）
        if not table_data:
            return HttpResponse('无数据可导出', status=400)

        # 适配列宽（原逻辑不变）
        col_widths = []
        if export_type == 'supplier':
            col_widths = [2.2 * cm, 2.2 * cm, 2 * cm, 2 * cm, 2.5 * cm, 1.8 * cm, 1.5 * cm, 1.5 * cm, 3 * cm]
        else:
            col_widths = [2.8 * cm, 1.5 * cm, 3 * cm, 2 * cm, 1.5 * cm, 1.8 * cm, 1.8 * cm]
        col_widths = col_widths[:len(table_data[0])]

        # 表格样式：仅保留黑色边框、内边距、对齐（无颜色填充）
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

        # 6. 生成PDF文档（原逻辑不变）
        doc.build(elements)
        buffer.seek(0)

        # 7. 返回PDF响应（原逻辑不变）
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename*=utf-8\'\'{filename}'
        return response

    # 异常仅返回错误信息，不崩溃（核心修复：保留原异常逻辑）
    except Exception as e:
        error_msg = f'导出PDF失败：{str(e)}，错误类型：{type(e).__name__}'
        print(error_msg)
        return HttpResponse(error_msg, status=500)