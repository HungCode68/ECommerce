export const queryKeys = {
  // Auth
  me: ['me'] as const,

  // Products (public)
  products: {
    all: ['products'] as const,
    list: (params: Record<string, unknown>) =>
      ['products', 'list', params] as const,
    detail: (id: number) => ['products', 'detail', id] as const,
    reviews: (id: number) => ['products', 'reviews', id] as const,
  },

  // Categories (public)
  categories: {
    all: ['categories'] as const,
    list: (params?: Record<string, unknown>) =>
      ['categories', 'list', params] as const,
    detail: (id: number) => ['categories', 'detail', id] as const,
  },

  // Cart
  cart: ['cart'] as const,

  // Orders
  orders: {
    all: ['orders'] as const,
    list: (params: Record<string, unknown>) =>
      ['orders', 'list', params] as const,
    detail: (id: number) => ['orders', 'detail', id] as const,
  },

  // Addresses
  addresses: ['addresses'] as const,
  addressKeys: {
    all: ['addresses'] as const,
    detail: (id: number) => ['addresses', 'detail', id] as const,
  },

  // Coupons
  coupons: {
    available: (amount: number) => ['coupons', 'available', amount] as const,
  },

  // Admin
  admin: {
    users: {
      all: ['admin', 'users'] as const,
      list: (params: Record<string, unknown>) =>
        ['admin', 'users', 'list', params] as const,
      detail: (id: number) => ['admin', 'users', 'detail', id] as const,
    },
    products: {
      all: ['admin', 'products'] as const,
      list: (params: Record<string, unknown>) =>
        ['admin', 'products', 'list', params] as const,
      detail: (id: number) => ['admin', 'products', 'detail', id] as const,
      history: (productId?: number) =>
        ['admin', 'products', 'history', productId] as const,
      deleted: (params: Record<string, unknown>) =>
        ['admin', 'products', 'deleted', params] as const,
    },
    categories: {
      all: ['admin', 'categories'] as const,
      list: (params: Record<string, unknown>) =>
        ['admin', 'categories', 'list', params] as const,
      detail: (id: number) => ['admin', 'categories', 'detail', id] as const,
    },
    orders: {
      all: ['admin', 'orders'] as const,
      list: (params: Record<string, unknown>) =>
        ['admin', 'orders', 'list', params] as const,
      detail: (id: number) => ['admin', 'orders', 'detail', id] as const,
    },
    coupons: {
      all: ['admin', 'coupons'] as const,
      list: (params: Record<string, unknown>) =>
        ['admin', 'coupons', 'list', params] as const,
      detail: (id: number) => ['admin', 'coupons', 'detail', id] as const,
    },
    stats: {
      dashboard: ['admin', 'stats', 'dashboard'] as const,
      topProducts: (limit: number) =>
        ['admin', 'stats', 'topProducts', limit] as const,
      product: (id: number) => ['admin', 'stats', 'product', id] as const,
    },
  },
} as const
