import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const CANCEL_REASONS = [
  'Tôi muốn cập nhật địa chỉ/sĐT nhận hàng',
  'Tôi muốn thêm/thay đổi mã giảm giá',
  'Tôi muốn thay đổi sản phẩm (Màu sắc, số lượng,...)',
  'Thủ tục thanh toán quá rắc rối',
  'Tôi tìm thấy chỗ khác bán rẻ hơn',
  'Tôi không có nhu cầu mua nữa',
  'Khác',
]

type CancelOrderModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  loading?: boolean
}

export function CancelOrderModal({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [otherReason, setOtherReason] = useState('')

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Khác' ? otherReason : selectedReason
    if (!finalReason.trim()) return
    onConfirm(finalReason)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setSelectedReason('')
      setOtherReason('')
    }
    onOpenChange(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Lý do hủy đơn hàng</AlertDialogTitle>
          <AlertDialogDescription>
            Vui lòng chọn lý do bạn muốn hủy đơn hàng này. Việc hủy đơn hàng không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="space-y-3">
            {CANCEL_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  selectedReason === reason
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex h-5 items-center">
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4 text-primary focus:ring-primary"
                  />
                </div>
                <span className="text-sm text-slate-700">{reason}</span>
              </label>
            ))}

            {selectedReason === 'Khác' && (
              <div className="mt-3 pl-7">
                <textarea
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="Vui lòng nhập lý do cụ thể..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Đóng</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || !selectedReason || (selectedReason === 'Khác' && !otherReason.trim())}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận hủy'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
