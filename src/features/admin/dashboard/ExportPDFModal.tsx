import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, FileDown, Loader2 } from 'lucide-react'
import { adminStatsApi } from '@/api/admin/adminStats.api'
import { generateRevenuePDF } from '@/utils/pdfGenerator'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

interface ExportPDFModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ExportPDFModal({ isOpen, onClose }: ExportPDFModalProps) {
  const { user } = useAuthStore()
  const [reportType, setReportType] = useState<'month' | 'year'>('month')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const data = await adminStatsApi.getPDFReportData({
        type: reportType,
        month: selectedMonth,
        year: selectedYear,
      })
      
      generateRevenuePDF(data, reportType, selectedMonth, selectedYear, user?.name)
      toast.success('Xuất báo cáo PDF thành công!')
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Có lỗi xảy ra khi xuất báo cáo')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md bg-surface border border-border/50 rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center gap-3 text-primary">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <FileDown className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-on-surface">Xuất Báo Cáo PDF</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-surface-variant rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-on-surface">Loại báo cáo</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReportType('month')}
                    className={`px-4 py-3 rounded-xl border transition-all ${
                      reportType === 'month'
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border/50 bg-surface hover:bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    Theo Tháng
                  </button>
                  <button
                    onClick={() => setReportType('year')}
                    className={`px-4 py-3 rounded-xl border transition-all ${
                      reportType === 'year'
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-border/50 bg-surface hover:bg-surface-variant text-on-surface-variant'
                    }`}
                  >
                    Theo Năm
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {reportType === 'month' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-on-surface">Tháng</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-surface border border-border/50 rounded-xl focus:outline-none focus:border-primary text-on-surface transition-colors"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          Tháng {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Năm</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-surface border border-border/50 rounded-xl focus:outline-none focus:border-primary text-on-surface transition-colors"
                  >
                    {Array.from({ length: 5 }).map((_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <option key={year} value={year}>
                          Năm {year}
                        </option>
                      )
                    })}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 pt-2 bg-surface-variant/30">
              <button
                className="flex-1 px-4 py-2 border border-border/50 rounded-lg hover:bg-surface-variant transition-colors"
                onClick={onClose}
                disabled={isExporting}
              >
                Hủy
              </button>
              <button
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4 mr-2" />
                    Tải PDF
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
