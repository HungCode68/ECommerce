import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ReportDataResponse, RecentOrder } from '@/types/adminStats.types'
import { formatCurrency } from '@/utils/adminDashboard'

// Hàm chuyển đổi tiếng Việt có dấu thành không dấu và xử lý ký tự unicode
function removeAccents(str: string) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/₫/g, 'd')
    // Xóa các khoảng trắng unicode đặc biệt (narrow no-break space, non-breaking space) gây lỗi font
    .replace(/[\u202F\u00A0]/g, ' ')
}

// Hàm format tiền tệ an toàn cho jsPDF (chỉ dùng ASCII)
function formatPDFCurrency(value: number) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " d";
}

export const generateRevenuePDF = (data: ReportDataResponse, type: 'month' | 'year', month?: number, year?: number, adminName?: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 15
  let currentY = 20

  // 1. Header
  doc.setFontSize(20)
  doc.setTextColor(76, 29, 149) // #4c1d95
  doc.setFont('helvetica', 'bold')
  const title = removeAccents(type === 'month' ? `BÁO CÁO DOANH THU ${month}/${year}` : `BÁO CÁO DOANH THU THEO NĂM ${year}`)
  doc.text(title, marginX, currentY)

  currentY += 8
  doc.setFontSize(9.5)
  doc.setTextColor(113, 128, 150) // #718096
  doc.setFont('helvetica', 'normal')
  const dateStr = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })
  doc.text(removeAccents(`Người lập báo cáo: ${dateStr} - Người xuất: ${adminName || 'Admin'}`), marginX, currentY)

  currentY += 5
  doc.setDrawColor(91, 33, 182) // #5b21b6
  doc.setLineWidth(1)
  doc.line(marginX, currentY, pageWidth - marginX, currentY)
  currentY += 10

  // Helper cho thẻ h2
  const addH2 = (text: string, y: number) => {
    doc.setFillColor(91, 33, 182) // #5b21b6
    doc.rect(marginX, y - 4.5, 1.5, 5.5, 'F')
    doc.setFontSize(13)
    doc.setTextColor(76, 29, 149) // #4c1d95
    doc.setFont('helvetica', 'bold')
    doc.text(removeAccents(text), marginX + 3, y)
    return y + 8
  }

  currentY = addH2('1. TỔNG QUAN DOANH THU', currentY)

  // 2. KPI Cards
  const kpiY = currentY
  const kpiHeight = 22
  const kpiWidth = (pageWidth - 2 * marginX - 10) / 3

  const drawKPI = (x: number, y: number, title: string, value: string, subtext?: string) => {
    doc.setFillColor(243, 232, 255) // #f3e8ff
    doc.setDrawColor(233, 213, 255) // #e9d5ff
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, kpiWidth, kpiHeight, 2, 2, 'FD')

    doc.setFontSize(8.5)
    doc.setTextColor(107, 33, 168) // #6b21a8
    doc.setFont('helvetica', 'bold')
    doc.text(removeAccents(title), x + 4, y + 7)

    doc.setFontSize(15)
    doc.setTextColor(76, 29, 149) // #4c1d95
    doc.text(value, x + 4, y + 17)

    if (subtext) {
      doc.setFontSize(8)
      doc.setTextColor(126, 34, 206) // #7e22ce
      doc.text(removeAccents(subtext), x + kpiWidth - 4, y + 17, { align: 'right' })
    }
  }

  drawKPI(marginX, kpiY, 'Don hang thanh cong / Tong', `${data.summary.completed_orders} / ${data.summary.total_orders}`, `Huy: ${data.summary.cancelled_orders}`)
  drawKPI(marginX + kpiWidth + 5, kpiY, 'Doanh thu du kien', formatPDFCurrency(data.summary.estimated_revenue))
  drawKPI(marginX + (kpiWidth + 5) * 2, kpiY, 'Doanh thu thuc te', formatPDFCurrency(data.summary.real_revenue))

  currentY = kpiY + kpiHeight + 15

  // 3. Chi tiết theo thời gian
  currentY = addH2('2. CHI TIẾT DOANH THU THEO THỜI GIAN', currentY)

  const timeData = data.revenue_by_time.map((row) => [
    row.label,
    row.total_orders.toString(),
    formatPDFCurrency(row.estimated_revenue),
    formatPDFCurrency(row.real_revenue),
  ])

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [[removeAccents('Thời gian'), removeAccents('Số đơn'), removeAccents('Doanh thu dự kiến'), removeAccents('Doanh thu thực tế')]],
    body: timeData,
    theme: 'striped',
    headStyles: { fillColor: [91, 33, 182], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] }, // #f9fafb
    styles: { fontSize: 9.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
    columnStyles: {
      0: { halign: 'center' },
      1: { halign: 'right' },
      2: { halign: 'right', fontStyle: 'bold', textColor: [26, 32, 44] }, // #1a202c
      3: { halign: 'right', fontStyle: 'bold', textColor: [47, 133, 90] }, // #2f855a (Thực thu)
    },
  })

  currentY = (doc as any).lastAutoTable.finalY + 15

  // Kiểm tra tràn trang
  if (currentY > pageHeight - 50) {
    doc.addPage()
    currentY = 20
  }

  // 4. Chi tiết sản phẩm bán ra
  currentY = addH2('3. CHI TIẾT SẢN PHẨM BÁN RA', currentY)

  const productData = data.product_sales.map((row) => [
    removeAccents(row.product_name),
    removeAccents(row.variant_title),
    row.units_sold.toString(),
    formatPDFCurrency(row.revenue),
  ])

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [[removeAccents('Ten san pham'), removeAccents('Phan loai'), removeAccents('So luong ban'), removeAccents('Doanh thu mang lai')]],
    body: productData,
    theme: 'striped',
    headStyles: { fillColor: [91, 33, 182], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    styles: { fontSize: 9.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'left' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold', textColor: [47, 133, 90] }, // Thực thu
    },
  })

  // 5. Thêm Footer cho tất cả các trang
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8.5)
    doc.setTextColor(160, 174, 192) // #a0aec0
    doc.setFont('helvetica', 'italic')
    doc.text(removeAccents('Môi trường thử nghiệm Hệ thống E-Commerce C2C'), marginX, pageHeight - 10)

    doc.setTextColor(113, 128, 150) // #718096
    doc.setFont('helvetica', 'normal')
    doc.text(`Trang ${i} / ${pageCount}`, pageWidth - marginX - 15, pageHeight - 10)
  }

  // Lưu file
  const fileName = type === 'month' ? `bao-cao-doanh-thu-${month}-${year}.pdf` : `bao-cao-doanh-thu-${year}.pdf`
  doc.save(fileName)
}

export const generateRecentOrdersPDF = (orders: RecentOrder[], adminName?: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const marginX = 15
  let currentY = 20

  // 1. Header
  doc.setFontSize(20)
  doc.setTextColor(76, 29, 149) // #4c1d95
  doc.setFont('helvetica', 'bold')
  const title = removeAccents(`BAO CAO DANH SACH DON HANG GAN DAY`)
  doc.text(title, marginX, currentY)

  currentY += 8
  doc.setFontSize(9.5)
  doc.setTextColor(113, 128, 150) // #718096
  doc.setFont('helvetica', 'normal')
  const dateStr = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Ho_Chi_Minh' })
  doc.text(removeAccents(`Nguoi lap bao cao: ${dateStr} - Nguoi xuat: ${adminName || 'Admin'}`), marginX, currentY)

  currentY += 5
  doc.setDrawColor(91, 33, 182) // #5b21b6
  doc.setLineWidth(1)
  doc.line(marginX, currentY, pageWidth - marginX, currentY)
  currentY += 10

  // Helper cho thẻ h2
  const addH2 = (text: string, y: number) => {
    doc.setFillColor(91, 33, 182) // #5b21b6
    doc.rect(marginX, y - 4.5, 1.5, 5.5, 'F')
    doc.setFontSize(13)
    doc.setTextColor(76, 29, 149) // #4c1d95
    doc.setFont('helvetica', 'bold')
    doc.text(removeAccents(text), marginX + 3, y)
    return y + 8
  }

  currentY = addH2('CHI TIET DON HANG', currentY)

  const mapStatus = (status: string) => {
    switch (status) {
      case 'pending': return 'Cho xac nhan'
      case 'confirmed': return 'Da xac nhan'
      case 'processing': return 'Dang xu ly'
      case 'shipped': return 'Da giao'
      case 'completed': return 'Thanh cong'
      case 'cancelled': return 'Da huy'
      case 'refunded': return 'Hoan tien'
      default: return removeAccents(status)
    }
  }

  const orderData = orders.map((row) => {
    const placedDate = new Date(row.placed_at).toLocaleString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).replace(',', '') // Loại bỏ dấu phẩy nếu có

    const itemsText = row.all_item_titles ? row.all_item_titles : `${row.first_item_title}\n+${row.item_count > 1 ? row.item_count - 1 : 0} SP khac`

    return [
      row.order_number,
      `${removeAccents(row.customer_name)}\n(${placedDate})`,
      removeAccents(itemsText),
      formatPDFCurrency(row.total),
      mapStatus(row.status),
    ]
  })

  autoTable(doc, {
    startY: currentY,
    margin: { left: marginX, right: marginX },
    head: [[removeAccents('Ma don'), removeAccents('Khach hang'), removeAccents('San pham'), removeAccents('Tong tien'), removeAccents('Trang thai')]],
    body: orderData,
    theme: 'striped',
    headStyles: { fillColor: [91, 33, 182], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] }, // #f9fafb
    styles: { fontSize: 9.5, lineColor: [226, 232, 240], lineWidth: 0.1 },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold' },
      1: { halign: 'left' },
      2: { halign: 'left' },
      3: { halign: 'right', fontStyle: 'bold', textColor: [47, 133, 90] }, // #2f855a (Thực thu)
      4: { halign: 'center' },
    },
  })

  // 5. Thêm Footer cho tất cả các trang
  const pageCount = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8.5)
    doc.setTextColor(160, 174, 192) // #a0aec0
    doc.setFont('helvetica', 'italic')
    doc.text(removeAccents('Moi truong thu nghiem He thong E-Commerce C2C'), marginX, pageHeight - 10)
    
    doc.setTextColor(113, 128, 150) // #718096
    doc.setFont('helvetica', 'normal')
    doc.text(`Trang ${i} / ${pageCount}`, pageWidth - marginX - 15, pageHeight - 10)
  }

  // Lưu file
  doc.save('bao-cao-don-hang-gan-day.pdf')
}
