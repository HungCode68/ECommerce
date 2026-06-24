export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/dang-nhap',
  REGISTER: '/dang-ky',
  FORGOT_PASSWORD: '/forgot-password',

  // Admin Routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_PRODUCT_CREATE: '/admin/products/new',
  ADMIN_PRODUCT_EDIT: (id: string | number) => `/admin/products/edit/${id}`,
  ADMIN_PRODUCT_TRASH: '/admin/products/trash',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDER_DETAIL: (id: string | number) => `/admin/orders/${id}`,
  ADMIN_COUPONS: '/admin/coupons',
  ADMIN_USERS: '/admin/users',
  ADMIN_REVIEWS: '/admin/reviews',
  ADMIN_BANNER_SETTINGS: '/admin/banner-settings',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_CALLBACK_REQUESTS: '/admin/callback-requests',

  // Shop Routes
  PRODUCTS: '/san-pham',
  PRODUCT_DETAIL: (id: string | number) => `/san-pham/${id}`,
  CATEGORY_DETAIL: (id: string | number) => `/danh-muc/${id}`,
  BRANDS: '/thuong-hieu',
  CART: '/gio-hang',
  CHECKOUT: '/thanh-toan',
  ORDERS: '/don-hang',
  ORDER_DETAIL: (code: string) => `/don-hang/${code}`,
  ADDRESSES: '/dia-chi',
  PROFILE: '/tai-khoan',
} as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ xử lý',
  processing: 'Đã đặt hàng thành công',
  shipped: 'Đang giao hàng',
  completed: 'Giao hàng thành công',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
  returned: 'Trả hàng'
};

export const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-emerald-100 text-emerald-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-slate-100 text-slate-800',
  returned: 'bg-orange-100 text-orange-800'
};
