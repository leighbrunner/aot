import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { votingAPI } from '../api/voting';

const VOTE_QUEUE_KEY = '@voting_app_vote_queue';
const MAX_RETRY_ATTEMPTS = 3;

export interface QueuedVote {
  id: string;
  winnerId: string;
  loserId: string;
  category: string;
  sessionId: string;
  timestamp: string;
  retryCount: number;
}

class VoteQueueService {
  private queue: QueuedVote[] = [];
  private isProcessing = false;
  private unsubscribeNetInfo: (() => void) | null = null;

  async initialize() {
    // Load queue from storage
    await this.loadQueue();
    
    // Set up network listener
    this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isProcessing) {
        this.processQueue();
      }
    });
    
    // Process any pending votes
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      this.processQueue();
    }
  }

  async cleanup() {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
    }
  }

  private async loadQueue() {
    try {
      const stored = await AsyncStorage.getItem(VOTE_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load vote queue:', error);
    }
  }

  private async saveQueue() {
    try {
      await AsyncStorage.setItem(VOTE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save vote queue:', error);
    }
  }

  async addVote(vote: Omit<QueuedVote, 'id' | 'timestamp' | 'retryCount'>) {
    const queuedVote: QueuedVote = {
      ...vote,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    
    this.queue.push(queuedVote);
    await this.saveQueue();
    
    // Try to process immediately
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      this.processQueue();
    }
    
    return queuedVote.id;
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Process votes in order
      while (this.queue.length > 0) {
        const vote = this.queue[0];
        
        try {
          // Submit vote to API
          const result = await votingAPI.submitVote(
            vote.winnerId,
            vote.loserId,
            vote.category,
            vote.sessionId
          );
          
          if (result.success) {
            // Remove from queue on success
            this.queue.shift();
            await this.saveQueue();
          } else {
            // Handle specific error cases
            if (result.error === 'Duplicate vote detected') {
              // Remove duplicate votes from queue
              this.queue.shift();
              await this.saveQueue();
            } else {
              // Retry later
              throw new Error(result.error || 'Vote submission failed');
            }
          }
        } catch (error) {
          console.error('Failed to process vote:', error);
          
          // Increment retry count
          vote.retryCount++;
          
          if (vote.retryCount >= MAX_RETRY_ATTEMPTS) {
            // Remove vote after max retries
            console.error('Dropping vote after max retries:', vote);
            this.queue.shift();
          } else {
            // Move to end of queue for retry
            this.queue.shift();
            this.queue.push(vote);
          }
          
          await this.saveQueue();
          
          // Stop processing on network error
          const netState = await NetInfo.fetch();
          if (!netState.isConnected) {
            break;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * vote.retryCount));
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  getQueue(): QueuedVote[] {
    return [...this.queue];
  }

  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
  }
}

export const voteQueue = new VoteQueueService();