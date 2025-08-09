'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast-provider'
import { LoadingSpinner } from '@/components/ui/loading'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  barcode: string | null
  category_id: string | null
}

interface Category {
  id: string
  name: string
}

interface EditProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product: Product | null
  categories: Category[]
}

export default function EditProductModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  product,
  categories 
}: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    barcode: '',
    category_id: ''
  })
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        barcode: product.barcode || '',
        category_id: product.category_id || ''
      })
    }
  }, [product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('EditProductModal: handleSubmit called', { product, formData })
    
    if (!product || !formData.name || !formData.price || !formData.stock) {
      addToast('Nama, harga, dan stok harus diisi', 'error')
      return
    }

    setLoading(true)

    try {
      console.log('EditProductModal: Updating product in database...', product.id)
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description || null,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          barcode: formData.barcode || null,
          category_id: formData.category_id || null
        })
        .eq('id', product.id)

      if (error) {
        console.error('EditProductModal: Database error:', error)
        throw error
      }

      console.log('EditProductModal: Product updated successfully')
      addToast('Produk berhasil diperbarui', 'success')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('EditProductModal: Error updating product:', error)
      addToast('Gagal memperbarui produk', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Produk</DialogTitle>
          <DialogDescription>
            Perbarui informasi produk di bawah ini.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('name', e.target.value)}
              placeholder="Masukkan nama produk"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
              placeholder="Deskripsi produk (opsional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Harga *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('price', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stok *</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('stock', e.target.value)}
                placeholder="0"
                min="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">Barcode</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('barcode', e.target.value)}
              placeholder="Scan atau masukkan barcode"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select value={formData.category_id} onValueChange={(value) => handleChange('category_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Memperbarui...
                </>
              ) : (
                'Perbarui Produk'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}