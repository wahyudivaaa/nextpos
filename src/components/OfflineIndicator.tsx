'use client'

import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/toast-provider'
import { syncOfflineData } from '@/lib/offline'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const { addToast } = useToast()

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      addToast('Koneksi internet tersambung kembali', 'success')
      // Auto sync when coming back online
      handleSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      addToast('Koneksi internet terputus. Mode offline aktif.', 'error')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check pending transactions count
    checkPendingTransactions()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [addToast, handleSync])

  const checkPendingTransactions = async () => {
    try {
      const { getOfflineTransactions } = await import('@/lib/offline')
      const transactions = await getOfflineTransactions()
      setPendingCount(transactions.length)
    } catch (error) {
      console.error('Error checking pending transactions:', error)
    }
  }

  const handleSync = useCallback(async () => {
    if (!isOnline || isSyncing) return

    setIsSyncing(true)
    try {
      const result = await syncOfflineData()
      if (result.success) {
        addToast(`${result.message}`, 'success')
        setPendingCount(0)
      } else {
        addToast('Gagal menyinkronkan data', 'error')
      }
    } catch (error) {
      console.error('Sync error:', error)
      addToast('Terjadi kesalahan saat sinkronisasi', 'error')
    } finally {
      setIsSyncing(false)
    }
  }, [isOnline, isSyncing, addToast])

  return (
    <div className="flex items-center space-x-2">
      <Badge 
        variant={isOnline ? "default" : "destructive"}
        className="flex items-center space-x-1"
      >
        {isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span>{isOnline ? 'Online' : 'Offline'}</span>
      </Badge>

      {pendingCount > 0 && (
        <>
          <Badge variant="outline" className="text-orange-600">
            {pendingCount} pending
          </Badge>
          
          {isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
              className="h-6 px-2"
            >
              {isSyncing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              <span className="ml-1 text-xs">Sync</span>
            </Button>
          )}
        </>
      )}
    </div>
  )
}