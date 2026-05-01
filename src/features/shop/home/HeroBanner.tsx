import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Truck, Shield, RotateCcw, Star } from 'lucide-react'
import { ROUTES } from '@/utils/constants'

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-slate-900 px-4 py-20 md:py-32">
      {/* Background accent */}
      <div className="absolute inset-0">
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-orange-400/10 blur-3xl" />
      </div>

      <div className="container relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="mb-4 inline-block rounded-full bg-primary/20 px-4 py-1.5 text-sm font-medium text-primary">
            🔥 Siêu sale mùa hè 2025
          </span>
          <h1 className="font-heading text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Mua sắm thông minh,
            <br />
            <span className="text-primary">tiết kiệm tối đa</span>
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            Hàng nghìn sản phẩm chính hãng, giao hàng nhanh toàn quốc.
            Miễn phí vận chuyển cho đơn từ 500.000 ₫.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to={ROUTES.PRODUCTS}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Mua sắm ngay
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
            { icon: <Truck className="h-5 w-5" />, label: 'Giao hàng nhanh' },
            { icon: <Shield className="h-5 w-5" />, label: 'Hàng chính hãng' },
            { icon: <RotateCcw className="h-5 w-5" />, label: 'Đổi trả 30 ngày' },
            { icon: <Star className="h-5 w-5" />, label: 'Đánh giá 4.8★' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 rounded-xl bg-white/5 px-3 py-4 text-slate-300"
            >
              <span className="text-primary">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
