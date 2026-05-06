import { Link } from 'react-router-dom'
import { ROUTES } from '@/utils/constants'

export function HomePage() {
  return (
    <div className="pb-24">
      {/* Hero Promotional Banner */}
      <section className="max-w-screen-2xl mx-auto px-4 md:px-8 mb-16">
        <div className="relative w-full aspect-[16/9] lg:aspect-[21/9] overflow-hidden group rounded-3xl glow-effect bg-inverse-surface border border-outline-variant/20">
          <img 
            className="absolute top-1/2 right-0 -translate-y-1/2 w-full lg:w-2/3 h-full object-cover object-left opacity-60 lg:opacity-90 group-hover:scale-105 transition-transform duration-1000 ease-out mix-blend-luminosity" 
            alt="A clean, minimalist high-tech laptop with sleek cyan glass interfaces and floating holographic displays." 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBU0nCUfNX0DQiqTQRsXG3IxgoL9E4VF5bCaR__SP12GFEFDHrRvdCKyGzi1958J6sMueTAZpFhDaoHiWNR-r1KGBQ8tpjC7x9XZVN-lE8BIvCTd_cqKL1IVlyW6jm6lcNzmKOAB_EOX9l_AKwLq-Xcfg6yS1Y7UV5nRwtb0WEVefj9Upjnd2EanEBrMPYeWdduX4tVkb6tSK4GWD3YZSCU9rVC--ifnrxYZriVKIDydpnIzlD32FvvSKu0hRBDVz5ZFyytoHACPcmu"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-inverse-surface via-inverse-surface/90 lg:via-inverse-surface/80 to-transparent flex flex-col justify-center px-8 lg:px-16 z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[2px] w-8 bg-primary-container shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
              <span className="text-primary-container font-headline font-bold tracking-[0.2em] text-xs md:text-sm uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">THẾ HỆ MỚI 2024</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-headline leading-[1.1] mb-6 tracking-tight max-w-xl text-on-error">
              KINETIC <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-primary-fixed-dim drop-shadow-[0_0_15px_rgba(76,215,246,0.3)]">PRO ULTRA</span>
            </h1>
            <p className="text-inverse-on-surface/80 font-body max-w-md mb-10 text-base md:text-lg leading-relaxed font-light">
              Định nghĩa lại giới hạn của hiệu năng. Chipset Quantum-S thế hệ mới nhất tích hợp trong thân máy mỏng chỉ 12mm.
            </p>
            <div className="flex gap-4">
              <Link to={ROUTES.PRODUCTS} className="primary-gradient text-white px-8 py-4 font-label font-bold text-sm tracking-widest rounded-full hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 transition-all duration-300">
                KHÁM PHÁ NGAY
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed & Recommended Bento Grid */}
      <section className="max-w-screen-2xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-24">
        <div className="lg:col-span-8">
          <h2 className="text-2xl md:text-3xl font-headline font-bold mb-8">GỢI Ý RIÊNG CHO BẠN</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            {/* Item 1 */}
            <div className="bg-surface-container-lowest p-6 flex flex-col border border-transparent hover:border-primary/10 transition-all rounded-2xl shadow-sm hover:shadow-md cursor-pointer group">
              <div className="w-full aspect-square bg-surface-container flex items-center justify-center mb-6 rounded-xl group-hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined text-outline-variant text-4xl group-hover:text-primary transition-colors">tablet</span>
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">NEW ARRIVAL</span>
                <h3 className="font-headline font-bold text-lg mb-2 group-hover:text-primary transition-colors">Kinetic Pad Ultra</h3>
                <p className="text-on-surface-variant text-xs font-body mb-4 flex-1">Màn hình Liquid Crystal Pro với độ phân giải 4K+</p>
                <span className="text-primary font-headline font-bold text-lg">21.990.000₫</span>
              </div>
            </div>
            {/* Item 2 */}
            <div className="bg-surface-container-lowest p-6 flex flex-col border border-transparent hover:border-primary/10 transition-all rounded-2xl shadow-sm hover:shadow-md cursor-pointer group">
              <div className="w-full aspect-square bg-surface-container flex items-center justify-center mb-6 rounded-xl group-hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined text-outline-variant text-4xl group-hover:text-primary transition-colors">headphones</span>
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">POPULAR</span>
                <h3 className="font-headline font-bold text-lg mb-2 group-hover:text-primary transition-colors">Air Sonic Pro</h3>
                <p className="text-on-surface-variant text-xs font-body mb-4 flex-1">Chống ồn chủ động thích ứng thế hệ 3</p>
                <span className="text-primary font-headline font-bold text-lg">5.490.000₫</span>
              </div>
            </div>
            {/* Item 3 */}
            <div className="bg-surface-container-lowest p-6 flex flex-col border border-transparent hover:border-primary/10 transition-all rounded-2xl shadow-sm hover:shadow-md cursor-pointer group">
              <div className="w-full aspect-square bg-surface-container flex items-center justify-center mb-6 rounded-xl group-hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined text-outline-variant text-4xl group-hover:text-primary transition-colors">watch</span>
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">TRENDING</span>
                <h3 className="font-headline font-bold text-lg mb-2 group-hover:text-primary transition-colors">Aether Fit</h3>
                <p className="text-on-surface-variant text-xs font-body mb-4 flex-1">Theo dõi sức khỏe toàn diện 24/7</p>
                <span className="text-primary font-headline font-bold text-lg">3.290.000₫</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Item 4 */}
            <div className="bg-surface-container-lowest p-6 flex flex-col border border-transparent hover:border-primary/10 transition-all rounded-2xl shadow-sm hover:shadow-md cursor-pointer group">
              <div className="w-full aspect-square bg-surface-container flex items-center justify-center mb-6 rounded-xl group-hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined text-outline-variant text-4xl group-hover:text-primary transition-colors">laptop_mac</span>
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">PRO SERIES</span>
                <h3 className="font-headline font-bold text-lg mb-2 group-hover:text-primary transition-colors">Kinetic Book Pro</h3>
                <p className="text-on-surface-variant text-xs font-body mb-4 flex-1">Laptop đồ họa chuyên nghiệp mỏng nhẹ</p>
                <span className="text-primary font-headline font-bold text-lg">34.500.000₫</span>
              </div>
            </div>
            {/* Item 5 */}
            <div className="bg-surface-container-lowest p-6 flex flex-col border border-transparent hover:border-primary/10 transition-all rounded-2xl shadow-sm hover:shadow-md cursor-pointer group">
              <div className="w-full aspect-square bg-surface-container flex items-center justify-center mb-6 rounded-xl group-hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined text-outline-variant text-4xl group-hover:text-primary transition-colors">router</span>
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">SMART HOME</span>
                <h3 className="font-headline font-bold text-lg mb-2 group-hover:text-primary transition-colors">Mesh Router X</h3>
                <p className="text-on-surface-variant text-xs font-body mb-4 flex-1">Phủ sóng Wifi 6E toàn bộ ngôi nhà</p>
                <span className="text-primary font-headline font-bold text-lg">2.890.000₫</span>
              </div>
            </div>
            {/* Item 6 */}
            <div className="bg-surface-container-lowest p-6 flex flex-col border border-transparent hover:border-primary/10 transition-all rounded-2xl shadow-sm hover:shadow-md cursor-pointer group">
              <div className="w-full aspect-square bg-surface-container flex items-center justify-center mb-6 rounded-xl group-hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined text-outline-variant text-4xl group-hover:text-primary transition-colors">speaker</span>
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest block mb-2">AUDIO</span>
                <h3 className="font-headline font-bold text-lg mb-2 group-hover:text-primary transition-colors">Sonic Studio</h3>
                <p className="text-on-surface-variant text-xs font-body mb-4 flex-1">Loa thông minh âm thanh vòm 360 độ</p>
                <span className="text-primary font-headline font-bold text-lg">4.150.000₫</span>
              </div>
            </div>
          </div>

          <div className="col-span-1 sm:col-span-3 bg-primary-container/5 p-8 border border-primary-container/20 flex justify-between items-center relative overflow-hidden group mt-6 rounded-3xl">
            <div className="relative z-10">
              <h3 className="text-2xl font-headline font-bold mb-2">XÂY DỰNG CẤU HÌNH CỦA RIÊNG BẠN</h3>
              <p className="text-on-surface-variant max-w-sm mb-6">Tùy chọn linh kiện cao cấp từ KINETIC Lab để tạo ra cỗ máy chiến đấu thực thụ.</p>
              <Link to={ROUTES.PRODUCTS} className="bg-primary text-white px-6 py-3 font-label font-bold text-xs rounded-full hover:shadow-lg transition-shadow inline-block">
                BẮT ĐẦU CẤU HÌNH
              </Link>
            </div>
            <span className="material-symbols-outlined text-[160px] absolute -right-8 -bottom-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">settings_suggest</span>
          </div>
        </div>

        <div className="lg:col-span-4 bg-surface-container p-8 h-full rounded-3xl">
          <h2 className="text-xl font-headline font-bold mb-8 flex justify-between items-center">
            XEM GẦN ĐÂY
            <button className="text-primary font-label text-[10px] font-bold hover:underline transition-colors">XÓA TẤT CẢ</button>
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-4 items-center group cursor-pointer">
              <div className="w-20 h-20 bg-white p-2 rounded-xl">
                <div className="w-full h-full bg-surface-variant flex items-center justify-center rounded-lg group-hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-primary/30 group-hover:text-primary/70 transition-colors">computer</span>
                </div>
              </div>
              <div>
                <h4 className="font-headline font-bold text-sm group-hover:text-primary transition-colors">Kinetic Workstation S1</h4>
                <p className="text-primary font-headline font-bold text-sm mt-1">45.000.000₫</p>
              </div>
            </div>
            
            <div className="h-[1px] bg-outline-variant/30"></div>
            
            <div className="flex gap-4 items-center group cursor-pointer">
              <div className="w-20 h-20 bg-white p-2 rounded-xl">
                <div className="w-full h-full bg-surface-variant flex items-center justify-center rounded-lg group-hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-primary/30 group-hover:text-primary/70 transition-colors">keyboard</span>
                </div>
              </div>
              <div>
                <h4 className="font-headline font-bold text-sm group-hover:text-primary transition-colors">Mechanical Key G90</h4>
                <p className="text-primary font-headline font-bold text-sm mt-1">2.150.000₫</p>
              </div>
            </div>
            
            <div className="h-[1px] bg-outline-variant/30"></div>
            
            <div className="flex gap-4 items-center group cursor-pointer">
              <div className="w-20 h-20 bg-white p-2 rounded-xl">
                <div className="w-full h-full bg-surface-variant flex items-center justify-center rounded-lg group-hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-primary/30 group-hover:text-primary/70 transition-colors">monitor</span>
                </div>
              </div>
              <div>
                <h4 className="font-headline font-bold text-sm group-hover:text-primary transition-colors">Curved Monitor 34"</h4>
                <p className="text-primary font-headline font-bold text-sm mt-1">12.800.000₫</p>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-12 py-4 bg-white border border-outline-variant text-on-surface font-label text-xs font-bold hover:bg-surface-container-high transition-colors rounded-xl">
            XEM TẤT CẢ LỊCH SỬ
          </button>
        </div>
      </section>
    </div>
  )
}
