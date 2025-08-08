import { create } from 'zustand'
import { Product } from './supabase'

interface CartItem {
  product: Product
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  getTotalAmount: () => number
  getTotalItems: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  
  addItem: (product: Product) => {
    const items = get().items
    const existingItem = items.find(item => item.product.id === product.id)
    
    if (existingItem) {
      set({
        items: items.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      })
    } else {
      set({
        items: [...items, { product, quantity: 1 }]
      })
    }
  },
  
  removeItem: (productId: number) => {
    set({
      items: get().items.filter(item => item.product.id !== productId)
    })
  },
  
  updateQuantity: (productId: number, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    
    set({
      items: get().items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    })
  },
  
  clearCart: () => {
    set({ items: [] })
  },
  
  getTotalAmount: () => {
    return get().items.reduce((total, item) => {
      return total + (item.product.price * item.quantity)
    }, 0)
  },
  
  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  }
}))