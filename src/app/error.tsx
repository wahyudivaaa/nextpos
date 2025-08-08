'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">Terjadi Kesalahan</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="text-left bg-gray-100 p-3 rounded text-sm font-mono text-red-600">
              {error.message}
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button onClick={reset} className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4" />
              <span>Coba Lagi</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
            >
              Kembali ke Beranda
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}