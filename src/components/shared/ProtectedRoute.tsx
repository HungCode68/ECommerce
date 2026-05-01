import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { ROUTES } from '@/utils/constants'

interface Props {
  requireAdmin?: boolean
  children?: React.ReactNode
}

function RouteLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        <p className="text-sm font-medium tracking-wide text-white/80">
          Đang khôi phục phiên đăng nhập...
        </p>
      </div>
    </div>
  )
}

export const ProtectedRoute = ({ requireAdmin = false, children }: Props) => {
  const { isAuthenticated, user, hasHydrated } = useAuthStore()

  if (!hasHydrated) {
    return <RouteLoading />
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to={ROUTES.HOME} replace />
  }

  return <>{children || <Outlet />}</>
}
