import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types/cart.types'

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
        const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
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
        const allIds = items.map((item) => item.id)
        const allSelected = allIds.every((id) => selectedIds.includes(id))
        set({ selectedIds: allSelected ? [] : allIds })
      },

      clearSelected: () => {
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
