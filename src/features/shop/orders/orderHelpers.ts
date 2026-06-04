import { PackageCheck, PackageOpen, Truck, XCircle, type LucideIcon } from 'lucide-react'
import type { Order, OrderItem } from '@/types/order.types'

export type OrderUiStatus = 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled'
export type OrderFilterTab = 'all' | OrderUiStatus

export type OrderStatusMeta = {
  label: string
  description: string
  icon: LucideIcon
  className: string
}

export const ORDER_TABS: { key: OrderFilterTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'processing', label: 'Đã đặt thành công' },
  { key: 'shipping', label: 'Đang giao' },
  { key: 'delivered', label: 'Giao hàng thành công' },
  { key: 'cancelled', label: 'Đã hủy' },
]

export function normalizeOrderStatus(status: string | undefined): OrderUiStatus {
  switch (status) {
    case 'shipped':
    case 'shipping':
      return 'shipping'
    case 'delivered':
    case 'completed':
      return 'delivered'
    case 'cancelled':
      return 'cancelled'
    case 'processing':
    case 'confirmed':
      return 'processing'
    case 'pending':
    default:
      return 'pending'
  }
}

export function getOrderStatusMeta(status: string | undefined): OrderStatusMeta {
  switch (normalizeOrderStatus(status)) {
    case 'processing':
      return {
        label: 'Đã đặt hàng thành công',
        description: 'Đơn hàng đã được xác nhận và đang được chuẩn bị',
        icon: PackageOpen,
        className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      }
    case 'shipping':
      return {
        label: 'Đang giao',
        description: 'Đơn hàng đang được vận chuyển',
        icon: Truck,
        className: 'bg-sky-100 text-sky-700',
      }
    case 'delivered':
      return {
        label: 'Giao hàng thành công',
        description: 'Đơn hàng đã được giao thành công',
        icon: PackageCheck,
        className: 'bg-emerald-100 text-emerald-700',
      }
    case 'cancelled':
      return {
        label: 'Đã hủy',
        description: 'Đơn hàng đã bị hủy',
        icon: XCircle,
        className: 'bg-slate-200 text-slate-600',
      }
    case 'pending':
    default:
      return {
        label: 'Chờ xác nhận',
        description: 'Đơn hàng đang chờ xác nhận',
        icon: PackageOpen,
        className: 'bg-amber-100 text-amber-700',
      }
  }
}

export function getOrderPlacedAt(order: Order) {
  return order.created_at ?? order.placed_at ?? order.updated_at
}

export function getOrderTotal(order: Order): number {
  if (order.total_payable !== undefined) return Number(order.total_payable)
  const val = order.total_amount
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const cleanStr = val.replace(/[^0-9]/g, '')
    const num = Number(cleanStr)
    return isNaN(num) ? 0 : num
  }
  return 0
}

export function getOrderItems(order: Order): OrderItem[] {
  return order.items ?? []
}

export function getOrderItemName(item: OrderItem) {
  return item.product_name ?? item.title ?? `Sản phẩm #${item.product_id}`
}

export function getOrderItemPrice(item: OrderItem) {
  return Number(item.line_subtotal ?? (item.unit_price ?? item.price ?? 0) * item.quantity)
}

export function getOrderItemMeta(item: OrderItem) {
  return item.variant_info?.trim() || item.option_values?.trim() || item.sku?.trim() || ''
}
