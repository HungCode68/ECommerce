import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X, Upload, Loader2, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react'
import { adminProductApi } from '@/api/admin/adminProduct.api'
import { queryKeys } from '@/lib/queryKeys'
import { cn } from '@/lib/utils'

type BulkAddDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BulkAddDialog({ open, onOpenChange }: BulkAddDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [results, setResults] = useState<{ total_created: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  const { mutate: importCsv, isPending } = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Vui lòng chọn file CSV')
      return adminProductApi.importCsv(file)
    },
    onSuccess: (data) => {
      setResults(data)
      if (data.total_created > 0) {
        toast.success(`Đã thêm thành công ${data.total_created} sản phẩm`)
        qc.invalidateQueries({ queryKey: queryKeys.admin.products.all })
      }
      if (data.errors && data.errors.length > 0) {
        toast.warning(`Có ${data.errors.length} lỗi xảy ra trong quá trình thêm`)
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Thao tác thất bại')
    }
  })

  if (!open) return null

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setFile(null)
      setResults(null)
    }, 200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={handleClose} 
      />
      
      {/* Content */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Nhập sản phẩm từ CSV</h2>
            <p className="text-sm text-slate-500">Tải lên file CSV định dạng chuẩn để thêm nhiều sản phẩm</p>
          </div>
          <button 
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {results ? (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center justify-center gap-4 py-6">
                <div className="rounded-full bg-green-100 p-4 text-green-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-800">Hoàn tất xử lý</h3>
                  <p className="text-slate-500">Đã tạo thành công <span className="font-bold text-green-600">{results.total_created}</span> sản phẩm</p>
                </div>
              </div>

              {results.errors && results.errors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-red-600 uppercase tracking-wider">
                    <AlertCircle className="h-4 w-4" />
                    Lỗi phát sinh ({results.errors.length}):
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-red-100 bg-red-50/50 p-4 space-y-2 scrollbar-thin">
                    {results.errors.map((err, i) => (
                      <div key={i} className="flex gap-2 text-sm text-red-700">
                        <span className="shrink-0 text-red-400">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
               <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "flex flex-col items-center justify-center gap-4 py-12 rounded-xl border-2 border-dashed transition-all cursor-pointer",
                  file ? "border-green-400 bg-green-50" : "border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".csv"
                  className="hidden" 
                />
                <div className={cn(
                  "rounded-full p-4",
                  file ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                )}>
                  {file ? <CheckCircle2 className="h-8 w-8" /> : <Upload className="h-8 w-8" />}
                </div>
                <div className="text-center px-4">
                  <p className="font-semibold text-slate-700 break-all">
                    {file ? file.name : "Nhấp để chọn file CSV"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hỗ trợ file .csv (Tối đa 10MB)
                  </p>
                </div>
              </div>
              
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-100">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold mb-1">Cấu trúc file CSV chuẩn:</p>
                    <p className="opacity-80">Name, Slug, ThumbnailURL, MinPrice, DiscountPercent, ShortDescription, Description, Brand, Status, CategoryIDs (phân cách bởi dấu ;)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6 flex justify-end gap-3 bg-slate-50/50">
          <button
            disabled={isPending}
            onClick={handleClose}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {results ? "Đóng" : "Hủy"}
          </button>
          
          {!results && (
            <button
              disabled={isPending || !file}
              onClick={() => importCsv()}
              className={cn(
                "flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-semibold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98]",
                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200",
                "disabled:opacity-60 disabled:scale-100 disabled:shadow-none"
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Xác nhận tải lên
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
