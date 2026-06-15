import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, MessageCircle, ArrowLeft, Send, CheckCircle2, X } from 'lucide-react'
import { toast } from 'sonner'
import { settingApi } from '@/api/setting.api'
import { callbackApi } from '@/api/callback.api'

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [screen, setScreen] = useState<'menu' | 'callback' | 'success'>('menu')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Fetch settings dynamically
  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: settingApi.getSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })

  // Submit callback request
  const submitCallback = useMutation({
    mutationFn: callbackApi.create,
    onSuccess: () => {
      setScreen('success')
      setPhoneNumber('')
      toast.success('Gửi yêu cầu gọi lại thành công!')
    },
    onError: () => {
      toast.error('Gửi yêu cầu thất bại. Vui lòng thử lại sau.')
    },
  })

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanPhone = phoneNumber.trim()
    if (!/^\d{8,15}$/.test(cleanPhone)) {
      toast.error('Số điện thoại không hợp lệ. Vui lòng nhập từ 8 đến 15 chữ số.')
      return
    }
    submitCallback.mutate(cleanPhone)
  }

  const zaloLink = settings?.zalo_link || 'https://zalo.me'
  const hotline = settings?.hotline || '19006680'

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Popover content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 w-80 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white">Hỗ trợ trực tuyến</h3>
                  <p className="text-xs text-cyan-100">Chúng tôi sẵn sàng giúp đỡ bạn 24/7</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Screens content */}
            <div className="p-4">
              <AnimatePresence mode="wait">
                {screen === 'menu' && (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-3"
                  >
                    {/* Zalo button */}
                    <a
                      href={zaloLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-full rounded-xl bg-slate-50 hover:bg-slate-100 p-3.5 border border-slate-100 transition-all group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-500/20">
                        <MessageCircle size={20} className="fill-blue-500/10" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-800 text-sm">Chat Zalo</p>
                        <p className="text-xs text-slate-500">Tư vấn qua ứng dụng Zalo</p>
                      </div>
                    </a>

                    {/* Callback Request Trigger */}
                    <button
                      onClick={() => setScreen('callback')}
                      className="flex items-center gap-3 w-full rounded-xl bg-slate-50 hover:bg-slate-100 p-3.5 border border-slate-100 transition-all group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-500/20">
                        <Phone size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-800 text-sm">Yêu cầu gọi lại</p>
                        <p className="text-xs text-slate-500">Để lại số điện thoại shop gọi lại</p>
                      </div>
                    </button>

                    {/* Hotline link */}
                    <a
                      href={`tel:${hotline}`}
                      className="flex items-center gap-3 w-full rounded-xl bg-slate-50 hover:bg-slate-100 p-3.5 border border-slate-100 transition-all group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 transition-colors group-hover:bg-cyan-500/20">
                        <Phone size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-slate-800 text-sm">Gọi hotline: {hotline}</p>
                        <p className="text-xs text-slate-500">Gọi điện trực tiếp tư vấn nhanh</p>
                      </div>
                    </a>
                  </motion.div>
                )}

                {screen === 'callback' && (
                  <motion.div
                    key="callback"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <button
                      onClick={() => setScreen('menu')}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-3 transition-colors"
                    >
                      <ArrowLeft size={14} /> Quay lại
                    </button>

                    <h4 className="font-medium text-slate-800 text-sm mb-1">Yêu cầu gọi lại</h4>
                    <p className="text-xs text-slate-500 mb-4">
                      Vui lòng nhập số điện thoại của bạn dưới đây. Nhân viên sẽ liên hệ lại ngay!
                    </p>

                    <form onSubmit={handleCallbackSubmit} className="space-y-3">
                      <div>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Nhập số điện thoại (ví dụ: 0987xxxxxx)"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitCallback.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 py-2.5 px-4 font-medium text-white text-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                      >
                        <Send size={14} />
                        {submitCallback.isPending ? 'Đang gửi...' : 'Gửi yêu cầu'}
                      </button>
                    </form>
                  </motion.div>
                )}

                {screen === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center justify-center py-6 text-center"
                  >
                    <div className="mb-3 rounded-full bg-emerald-50 p-2 text-emerald-500">
                      <CheckCircle2 size={40} />
                    </div>
                    <h4 className="font-medium text-slate-800 mb-1">Đã nhận thông tin!</h4>
                    <p className="text-xs text-slate-500 max-w-[200px] mb-4">
                      Cảm ơn bạn. Shop sẽ liên hệ tư vấn qua số điện thoại này sớm nhất.
                    </p>
                    <button
                      onClick={() => {
                        setScreen('menu')
                        setIsOpen(false)
                      }}
                      className="rounded-lg border border-slate-200 hover:bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600 transition-all active:scale-[0.98]"
                    >
                      Đóng
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main floating button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) setScreen('menu')
        }}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bg-slate-700 shadow-slate-700/20'
            : 'bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-cyan-600/30'
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="support"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center"
            >
              <MessageCircle size={24} className="fill-white/10" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulsing ring indicator when closed */}
        {!isOpen && (
          <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-cyan-600/30 duration-1000" />
        )}
      </button>
    </div>
  )
}
