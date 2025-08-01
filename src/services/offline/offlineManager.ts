import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { VoteSubmission } from '@/services/api/votingService'

const OFFLINE_VOTES_KEY = '@offline_votes'
const OFFLINE_IMAGES_KEY = '@offline_images'
const SYNC_STATUS_KEY = '@sync_status'

export interface OfflineVote extends VoteSubmission {
  id: string
  timestamp: string
  synced: boolean
}

export interface SyncStatus {
  lastSync: string | null
  pendingVotes: number
  isOnline: boolean
}

class OfflineManager {
  private isOnline: boolean = true
  private syncInProgress: boolean = false
  private listeners: Set<(status: SyncStatus) => void> = new Set()

  async init() {
    // Monitor network status
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false
      if (this.isOnline && !this.syncInProgress) {
        this.syncPendingVotes()
      }
      this.notifyListeners()
    })

    // Check initial network state
    const state = await NetInfo.fetch()
    this.isOnline = state.isConnected ?? false
  }

  async saveVoteOffline(vote: VoteSubmission): Promise<void> {
    try {
      const offlineVote: OfflineVote = {
        ...vote,
        id: `offline_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toISOString(),
        synced: false,
      }

      const existingVotes = await this.getOfflineVotes()
      existingVotes.push(offlineVote)
      
      await AsyncStorage.setItem(OFFLINE_VOTES_KEY, JSON.stringify(existingVotes))
      this.notifyListeners()
    } catch (error) {
      console.error('Error saving offline vote:', error)
      throw error
    }
  }

  async getOfflineVotes(): Promise<OfflineVote[]> {
    try {
      const votesJson = await AsyncStorage.getItem(OFFLINE_VOTES_KEY)
      return votesJson ? JSON.parse(votesJson) : []
    } catch (error) {
      console.error('Error getting offline votes:', error)
      return []
    }
  }

  async syncPendingVotes(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return

    this.syncInProgress = true

    try {
      const pendingVotes = await this.getOfflineVotes()
      const unsyncedVotes = pendingVotes.filter(v => !v.synced)

      if (unsyncedVotes.length === 0) {
        this.syncInProgress = false
        return
      }

      console.log(`Syncing ${unsyncedVotes.length} offline votes...`)

      // Import voting service dynamically to avoid circular dependencies
      const { votingService } = await import('@/services/api/votingService')

      for (const vote of unsyncedVotes) {
        try {
          await votingService.submitVote({
            winnerId: vote.winnerId,
            loserId: vote.loserId,
            category: vote.category,
            sessionId: vote.sessionId,
          })

          // Mark as synced
          vote.synced = true
        } catch (error) {
          console.error('Error syncing vote:', error)
          // Continue with next vote
        }
      }

      // Update storage with sync status
      await AsyncStorage.setItem(OFFLINE_VOTES_KEY, JSON.stringify(pendingVotes))
      
      // Update last sync time
      await AsyncStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
        lastSync: new Date().toISOString(),
      }))

      this.notifyListeners()
    } catch (error) {
      console.error('Error during sync:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  async cacheImages(images: Array<{ url: string; thumbnailUrl: string }>): Promise<void> {
    try {
      const existingCache = await this.getCachedImages()
      const newCache = [...existingCache]

      for (const image of images) {
        if (!newCache.some(cached => cached.url === image.url)) {
          newCache.push({
            url: image.url,
            thumbnailUrl: image.thumbnailUrl,
            cachedAt: new Date().toISOString(),
          })
        }
      }

      // Keep only the most recent 100 images
      const trimmedCache = newCache.slice(-100)
      
      await AsyncStorage.setItem(OFFLINE_IMAGES_KEY, JSON.stringify(trimmedCache))
    } catch (error) {
      console.error('Error caching images:', error)
    }
  }

  async getCachedImages(): Promise<any[]> {
    try {
      const cacheJson = await AsyncStorage.getItem(OFFLINE_IMAGES_KEY)
      return cacheJson ? JSON.parse(cacheJson) : []
    } catch (error) {
      console.error('Error getting cached images:', error)
      return []
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const pendingVotes = await this.getOfflineVotes()
    const statusJson = await AsyncStorage.getItem(SYNC_STATUS_KEY)
    const status = statusJson ? JSON.parse(statusJson) : { lastSync: null }

    return {
      lastSync: status.lastSync,
      pendingVotes: pendingVotes.filter(v => !v.synced).length,
      isOnline: this.isOnline,
    }
  }

  subscribeToStatus(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener)
    // Send initial status
    this.getSyncStatus().then(status => listener(status))
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus()
    this.listeners.forEach(listener => listener(status))
  }

  async clearOfflineData(): Promise<void> {
    await AsyncStorage.multiRemove([
      OFFLINE_VOTES_KEY,
      OFFLINE_IMAGES_KEY,
      SYNC_STATUS_KEY,
    ])
    this.notifyListeners()
  }

  getOnlineStatus(): boolean {
    return this.isOnline
  }
}

export const offlineManager = new OfflineManager()