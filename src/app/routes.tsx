import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AuthInitializer } from '@/components/shared/AuthInitializer'
import { ProtectedRoute } from '@/components/shared/ProtectedRoute'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { ShopLayout } from '@/components/layout/ShopLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { ROUTES } from '@/utils/constants'

const LoginPage = lazy(() =>
  import('@/pages/shop/LoginPage').then((module) => ({ default: module.LoginPage })),
)

const HomePage = lazy(() =>
  import('@/pages/shop/HomePage').then((module) => ({ default: module.HomePage })),
)
const ProductsPage = lazy(() =>
  import('@/pages/shop/ProductsPage').then((module) => ({ default: module.ProductsPage })),
)
const ProductDetailPage = lazy(() =>
  import('@/pages/shop/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })),
)
const CartPage = lazy(() =>
  import('@/pages/shop/CartPage').then((module) => ({ default: module.CartPage })),
)
const CheckoutPage = lazy(() =>
  import('@/pages/shop/CheckoutPage').then((module) => ({ default: module.CheckoutPage })),
)
const ShopOrdersPage = lazy(() =>
  import('@/pages/shop/OrdersPage').then((module) => ({ default: module.OrdersPage })),
)
const ShopOrderDetailPage = lazy(() =>
  import('@/pages/shop/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })),
)
const AddressesPage = lazy(() =>
  import('@/pages/shop/AddressesPage').then((module) => ({ default: module.AddressesPage })),
)
const ProfilePage = lazy(() =>
  import('@/pages/shop/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)

const AdminDashboard = lazy(() =>
  import('@/pages/admin/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)

const AdminProductsPage = lazy(() =>
  import('@/pages/admin/ProductsPage').then((module) => ({ default: module.ProductsPage })),
)
const ProductFormPage = lazy(() =>
  import('@/pages/admin/ProductFormPage').then((module) => ({ default: module.ProductFormPage })),
)
const ProductTrashPage = lazy(() =>
  import('@/pages/admin/ProductTrashPage').then((module) => ({ default: module.ProductTrashPage })),
)
const AdminOrdersPage = lazy(() =>
  import('@/pages/admin/OrdersPage').then((module) => ({ default: module.OrdersPage })),
)
const AdminOrderDetailPage = lazy(() =>
  import('@/pages/admin/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })),
)
const CategoriesPage = lazy(() =>
  import('@/pages/admin/CategoriesPage').then((module) => ({ default: module.CategoriesPage })),
)
const CouponsPage = lazy(() =>
  import('@/pages/admin/CouponsPage').then((module) => ({ default: module.CouponsPage })),
)
const UsersPage = lazy(() =>
  import('@/pages/admin/UsersPage').then((module) => ({ default: module.UsersPage })),
)
const ReviewsPage = lazy(() =>
  import('@/pages/admin/ReviewsPage').then((module) => ({ default: module.ReviewsPage })),
)
const SettingsPage = lazy(() =>
  import('@/pages/admin/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)

function PageLoader() {
  return (
    <div className="p-8">
      <TableSkeleton rows={6} cols={4} />
    </div>
  )
}

function SuspensePage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

function LegacyProductEditRedirect() {
  const { id } = useParams()
  const productId = Number(id)
  if (!id || Number.isNaN(productId)) {
    return <Navigate to={ROUTES.ADMIN_PRODUCTS} replace />
  }
  return <Navigate to={ROUTES.ADMIN_PRODUCT_EDIT(productId)} replace />
}

function LegacyOrderDetailRedirect() {
  const { id } = useParams()
  const orderId = Number(id)
  if (!id || Number.isNaN(orderId)) {
    return <Navigate to={ROUTES.ADMIN_ORDERS} replace />
  }
  return <Navigate to={ROUTES.ADMIN_ORDER_DETAIL(orderId)} replace />
}

function LegacyRedirect({ to }: { to: string }) {
  return <Navigate to={to} replace />
}

export function AppRoutes() {
  return (
    <AuthInitializer>
      <Routes>
        <Route
          path={ROUTES.LOGIN}
          element={
            <SuspensePage>
              <LoginPage />
            </SuspensePage>
          }
        />
        <Route path="/dang-ky" element={<Navigate to="/dang-nhap" replace />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route
            path="products"
            element={
              <SuspensePage>
                <AdminProductsPage />
              </SuspensePage>
            }
          />
          <Route
            path="products/new"
            element={
              <SuspensePage>
                <ProductFormPage />
              </SuspensePage>
            }
          />
          <Route
            path="products/edit/:id"
            element={
              <SuspensePage>
                <ProductFormPage />
              </SuspensePage>
            }
          />
          <Route
            path="products/trash"
            element={
              <SuspensePage>
                <ProductTrashPage />
              </SuspensePage>
            }
          />
          <Route
            path="orders"
            element={
              <SuspensePage>
                <AdminOrdersPage />
              </SuspensePage>
            }
          />
          <Route
            path="orders/:id"
            element={
              <SuspensePage>
                <AdminOrderDetailPage />
              </SuspensePage>
            }
          />
          <Route
            path="categories"
            element={
              <SuspensePage>
                <CategoriesPage />
              </SuspensePage>
            }
          />
          <Route
            path="coupons"
            element={
              <SuspensePage>
                <CouponsPage />
              </SuspensePage>
            }
          />
          <Route
            path="users"
            element={
              <SuspensePage>
                <UsersPage />
              </SuspensePage>
            }
          />
          <Route
            path="reviews"
            element={
              <SuspensePage>
                <ReviewsPage />
              </SuspensePage>
            }
          />
          <Route
            path="settings"
            element={
              <SuspensePage>
                <SettingsPage />
              </SuspensePage>
            }
          />
        </Route>

        <Route path="/admin/san-pham" element={<LegacyRedirect to={ROUTES.ADMIN_PRODUCTS} />} />
        <Route path="/admin/san-pham/tao-moi" element={<LegacyRedirect to={ROUTES.ADMIN_PRODUCT_CREATE} />} />
        <Route path="/admin/san-pham/chinh-sua/:id" element={<LegacyProductEditRedirect />} />
        <Route path="/admin/san-pham/thung-rac" element={<LegacyRedirect to={ROUTES.ADMIN_PRODUCT_TRASH} />} />
        <Route path="/admin/danh-muc" element={<LegacyRedirect to={ROUTES.ADMIN_CATEGORIES} />} />
        <Route path="/admin/don-hang" element={<LegacyRedirect to={ROUTES.ADMIN_ORDERS} />} />
        <Route path="/admin/don-hang/:id" element={<LegacyOrderDetailRedirect />} />
        <Route path="/admin/ma-giam-gia" element={<LegacyRedirect to={ROUTES.ADMIN_COUPONS} />} />
        <Route path="/admin/nguoi-dung" element={<LegacyRedirect to={ROUTES.ADMIN_USERS} />} />

        <Route path="/" element={<ShopLayout />}>
          <Route
            index
            element={
              <SuspensePage>
                <HomePage />
              </SuspensePage>
            }
          />
          <Route
            path="san-pham"
            element={
              <SuspensePage>
                <ProductsPage />
              </SuspensePage>
            }
          />
          <Route
            path="san-pham/:id"
            element={
              <SuspensePage>
                <ProductDetailPage />
              </SuspensePage>
            }
          />
          <Route
            path="gio-hang"
            element={
              <SuspensePage>
                <CartPage />
              </SuspensePage>
            }
          />
          <Route
            path="thanh-toan"
            element={
              <ProtectedRoute>
                <SuspensePage>
                  <CheckoutPage />
                </SuspensePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="don-hang"
            element={
              <ProtectedRoute>
                <SuspensePage>
                  <ShopOrdersPage />
                </SuspensePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="don-hang/:id"
            element={
              <ProtectedRoute>
                <SuspensePage>
                  <ShopOrderDetailPage />
                </SuspensePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="dia-chi"
            element={
              <ProtectedRoute>
                <SuspensePage>
                  <AddressesPage />
                </SuspensePage>
              </ProtectedRoute>
            }
          />
          <Route
            path="tai-khoan"
            element={
              <ProtectedRoute>
                <SuspensePage>
                  <ProfilePage />
                </SuspensePage>
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthInitializer>
  )
}
