import { useState, useRef, useEffect } from 'react'
import { Bell, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '@/api/notification.api'
import { formatDate } from '@/utils/formatters/format'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/utils/constants'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch unread count
  const { data: countData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 30000, // Poll every 30 seconds
  })
  
  const unreadCount = countData?.data?.unread_count || 0

  // Fetch notifications
  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationApi.getAll({ page: 1, limit: 10 }),
    enabled: isOpen, // Only fetch when dropdown is open
  })
  
  const notifications = notifData?.data || []

  // Mutations
  const markAsRead = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const markAllAsRead = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    }
  })

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id)
    }
    
    setIsOpen(false)

    // Redirect based on type
    if (notification.type === 'ORDER_CREATED' || notification.type === 'ORDER_CANCELED') {
      if (notification.reference_id) {
        navigate(`${ROUTES.ORDERS}/${notification.reference_id}`)
      } else {
        navigate(ROUTES.ORDERS)
      }
    } else if (notification.type === 'REVIEW_DELETED') {
      // Just stay or navigate to home
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-1 text-sm font-semibold text-[#1c1b1b] transition-colors hover:text-[#630ed4]"
        aria-label="Thông báo"
      >
        <span className="material-symbols-outlined text-[24px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-outline-variant/30 bg-white shadow-xl z-50 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50">
            <h3 className="font-bold text-slate-800">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
                disabled={markAllAsRead.isPending}
              >
                <Check className="h-3 w-3" />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px]">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-slate-500">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
                <Bell className="h-8 w-8 text-slate-300" />
                Không có thông báo nào.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "cursor-pointer p-4 transition-colors hover:bg-slate-50 flex gap-3",
                      !notif.is_read ? "bg-primary/5" : ""
                    )}
                  >
                    <div className="shrink-0 mt-1">
                      {notif.type === 'ORDER_CREATED' && <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5" />}
                      {notif.type === 'ORDER_CANCELED' && <div className="h-2 w-2 rounded-full bg-red-500 mt-1.5" />}
                      {notif.type === 'REVIEW_DELETED' && <div className="h-2 w-2 rounded-full bg-orange-500 mt-1.5" />}
                      {notif.type !== 'ORDER_CREATED' && notif.type !== 'ORDER_CANCELED' && notif.type !== 'REVIEW_DELETED' && (
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className={cn("text-sm font-semibold", !notif.is_read ? "text-slate-900" : "text-slate-700")}>
                        {notif.title}
                      </p>
                      <p className={cn("text-xs leading-relaxed", !notif.is_read ? "text-slate-700 font-medium" : "text-slate-500")}>
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {formatDate(notif.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 p-2 bg-slate-50 text-center">
              <span className="text-xs text-slate-500">Chỉ hiển thị 10 thông báo gần nhất</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
