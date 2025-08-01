import { useState, useEffect } from 'react'
import { offlineManager, SyncStatus } from '@/services/offline/offlineManager'

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    pendingVotes: 0,
    isOnline: true,
  })

  useEffect(() => {
    // Subscribe to status updates
    const unsubscribe = offlineManager.subscribeToStatus(setSyncStatus)
    
    // Initialize offline manager
    offlineManager.init()

    return unsubscribe
  }, [])

  const syncNow = async () => {
    await offlineManager.syncPendingVotes()
  }

  const clearOfflineData = async () => {
    await offlineManager.clearOfflineData()
  }

  return {
    ...syncStatus,
    syncNow,
    clearOfflineData,
  }
}