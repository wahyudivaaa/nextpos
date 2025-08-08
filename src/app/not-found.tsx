import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileQuestion className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">Halaman Tidak Ditemukan</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Maaf, halaman yang Anda cari tidak dapat ditemukan.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button asChild>
              <Link href="/" className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Kembali ke Beranda</span>
              </Link>
            </Button>
            
            <Button variant="outline" asChild>
              <Link href="/cashier">
                Ke Halaman Kasir
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}