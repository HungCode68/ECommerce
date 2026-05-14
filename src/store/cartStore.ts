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

type CartState = {
  items: CartItem[]
  selectedIds: number[]
  totalCount: number
  setCart: (items: CartItem[]) => void
  toggleSelect: (id: number) => void
  toggleSelectAll: () => void
  clearSelected: () => void
  reset: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      selectedIds: [],
      totalCount: 0,

      setCart: (items) => {
        const { items: currentItems, totalCount: currentTotalCount } = get()
        const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)

        if (areCartItemsEqual(currentItems, items) && currentTotalCount === totalCount) {
          return
        }

        set({ items, totalCount })
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
        const allIds = items.map((item) => item.variant_id)
        const allSelected = allIds.every((id) => selectedIds.includes(id))
        set({ selectedIds: allSelected ? [] : allIds })
      },

      clearSelected: () => {
        const { selectedIds } = get()
        if (selectedIds.length === 0) return
        set({ selectedIds: [] })
      },

      reset: () => {
        set({ items: [], selectedIds: [], totalCount: 0 })
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        totalCount: state.totalCount,
      }),
    },
  ),
)
