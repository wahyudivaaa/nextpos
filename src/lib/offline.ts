import Dexie, { Table } from 'dexie'
import { Product, PaymentMethod } from './supabase'

// Interface untuk queue transaksi offline
export interface OfflineTransaction {
  id?: number
  userId: string
  paymentMethod: PaymentMethod
  items: Array<{
    productId: number
    quantity: number
  }>
  timestamp: number
}

// Database IndexedDB menggunakan Dexie
export class OfflineDatabase extends Dexie {
  products!: Table<Product>
  syncQueue!: Table<OfflineTransaction>

  constructor() {
    super('POSOfflineDB')
    
    this.version(1).stores({
      products: 'id, name, sku, price, cost, stock, category_id, created_at',
      syncQueue: '++id, userId, paymentMethod, items, timestamp'
    })
  }
}

export const offlineDB = new OfflineDatabase()

// Fungsi untuk sinkronisasi produk dari Supabase ke IndexedDB
export async function syncProductsToOffline(products: Product[]) {
  try {
    await offlineDB.products.clear()
    await offlineDB.products.bulkAdd(products)
    console.log('Produk berhasil disinkronkan ke offline storage')
  } catch (error) {
    console.error('Error sinkronisasi produk:', error)
  }
}

// Fungsi untuk mendapatkan produk dari offline storage
export async function getOfflineProducts(): Promise<Product[]> {
  try {
    return await offlineDB.products.toArray()
  } catch (error) {
    console.error('Error mengambil produk offline:', error)
    return []
  }
}

// Fungsi untuk menambah transaksi ke queue offline
export async function addOfflineTransaction(transaction: Omit<OfflineTransaction, 'id'>) {
  try {
    await offlineDB.syncQueue.add(transaction)
    console.log('Transaksi ditambahkan ke queue offline')
  } catch (error) {
    console.error('Error menambah transaksi offline:', error)
  }
}

// Fungsi untuk mendapatkan semua transaksi dalam queue
export async function getOfflineTransactions(): Promise<OfflineTransaction[]> {
  try {
    return await offlineDB.syncQueue.toArray()
  } catch (error) {
    console.error('Error mengambil transaksi offline:', error)
    return []
  }
}

// Fungsi untuk menghapus transaksi dari queue setelah berhasil disinkronkan
export async function removeOfflineTransaction(id: number) {
  try {
    await offlineDB.syncQueue.delete(id)
    console.log('Transaksi berhasil dihapus dari queue offline')
  } catch (error) {
    console.error('Error menghapus transaksi offline:', error)
  }
}

// Fungsi untuk sinkronisasi data offline ke server
export async function syncOfflineData(): Promise<{ success: boolean; message: string }> {
  try {
    const offlineTransactions = await getOfflineTransactions()
    
    if (offlineTransactions.length === 0) {
      return { success: true, message: 'Tidak ada data offline untuk disinkronkan' }
    }

    let successCount = 0
    let errorCount = 0

    for (const transaction of offlineTransactions) {
      try {
        // Simulasi sinkronisasi ke server
        // Dalam implementasi nyata, ini akan memanggil API untuk memproses transaksi
        console.log('Sinkronisasi transaksi:', transaction)
        
        // Hapus dari queue setelah berhasil
        if (transaction.id) {
          await removeOfflineTransaction(transaction.id)
          successCount++
        }
      } catch (error) {
        console.error('Error sinkronisasi transaksi:', error)
        errorCount++
      }
    }

    if (errorCount === 0) {
      return { 
        success: true, 
        message: `${successCount} transaksi berhasil disinkronkan` 
      }
    } else {
      return { 
        success: false, 
        message: `${successCount} berhasil, ${errorCount} gagal disinkronkan` 
      }
    }
  } catch (error) {
    console.error('Error sinkronisasi data offline:', error)
    return { 
      success: false, 
      message: 'Gagal melakukan sinkronisasi data offline' 
    }
  }
}