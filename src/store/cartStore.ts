import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types/cart.types'

function areCartItemsEqual(currentItems: CartItem[], nextItems: CartItem[]) {
  if (currentItems.length !== nextItems.length) return false

  return currentItems.every((item, index) => {
    const next = nextItems[index]
    return (
      item.item_id === next.item_id &&
      item.quantity === next.quantity &&
      item.price === next.price &&
      item.stock_quantity === next.stock_quantity &&
      item.variant_id === next.variant_id
    )
  })
}

export type BuyNowItem = {
  product_id: number
  variant_id: number
  quantity: number
  price: number
  product_name: string
  variant_name: string
  thumbnail_url: string
  stock_quantity: number
  is_preorder?: boolean
}

type CartState = {
  items: CartItem[]
  selectedIds: number[]
  buyNowItem: BuyNowItem | null
  totalCount: number
  setCart: (items: CartItem[]) => void
  selectOnly: (id: number) => void
  setBuyNow: (item: BuyNowItem) => void
  toggleSelect: (id: number) => void
  toggleSelectAll: () => void
  clearSelected: () => void
  clearBuyNow: () => void
  reset: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedIds: [],
      buyNowItem: null,
      totalCount: 0,

      setCart: (items) => {
        const { items: currentItems, totalCount: currentTotalCount } = get()
        const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)

        if (areCartItemsEqual(currentItems, items) && currentTotalCount === totalCount) {
          return
        }

        set({ items, totalCount })
      },

      selectOnly: (id) => {
        set({ selectedIds: [id] })
      },

      setBuyNow: (item) => {
        set({ buyNowItem: item })
      },

      toggleSelect: (id) => {
        const { selectedIds } = get()
        if (selectedIds.includes(id)) {
          set({ selectedIds: selectedIds.filter((i) => i !== id) })
        } else {
          set({ selectedIds: [...selectedIds, id] })
        }
      },

      toggleSelectAll: () => {
        const { items, selectedIds } = get()
        const allIds = items.map((item) => item.item_id)
        const allSelected = allIds.every((id) => selectedIds.includes(id))
        set({ selectedIds: allSelected ? [] : allIds })
      },

      clearSelected: () => {
        const { selectedIds } = get()
        if (selectedIds.length === 0) return
        set({ selectedIds: [] })
      },

      clearBuyNow: () => {
        set({ buyNowItem: null })
      },

      reset: () => {
        set({ items: [], selectedIds: [], buyNowItem: null, totalCount: 0 })
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        totalCount: state.totalCount,
        selectedIds: state.selectedIds,
        buyNowItem: state.buyNowItem,
      }),
    },
  ),
)
