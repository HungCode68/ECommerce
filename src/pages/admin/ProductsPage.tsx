import { ProductTable } from '@/features/admin/products/ProductTable'

export function ProductsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Quản lý sản phẩm</h1>
        <p className="text-sm text-slate-500">Danh sách tất cả sản phẩm trong hệ thống</p>
      </div>
      <ProductTable />
    </div>
  )
}
