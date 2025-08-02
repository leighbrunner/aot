import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export interface AdminStats {
  totalUsers: number;
  totalVotes: number;
  totalImages: number;
  pendingImages: number;
  activeUsers24h: number;
  votesToday: number;
}

export interface PendingImage {
  imageId: string;
  url: string;
  thumbnailUrl: string;
  characterName: string;
  categories: string[];
  metadata: any;
  createdAt: string;
  source: 'ai' | 'user';
}

export interface AdminAction {
  actionId: string;
  adminId: string;
  action: 'approve' | 'reject' | 'delete' | 'promote' | 'edit' | 'create';
  targetType: 'image' | 'user' | 'category';
  targetId: string;
  metadata?: any;
  timestamp: string;
}

export interface AnalyticsData {
  totalVotes: number;
  votesChange: number;
  activeUsers: number;
  usersChange: number;
  avgSessionDuration: number;
  sessionChange: number;
  engagementRate: number;
  engagementChange: number;
  votingActivity: {
    labels: string[];
    data: number[];
  };
  categoryPerformance: {
    labels: string[];
    data: number[];
  };
  demographics: Array<{
    label: string;
    value: number;
  }>;
  topContent: Array<{
    name: string;
    votes: number;
    winRate: number;
  }>;
  newUsers: number;
  returningUsers: number;
  avgVotesPerUser: number;
}

class AdminAPI {
  /**
   * Get admin dashboard statistics
   */
  async getAdminStats(): Promise<AdminStats> {
    try {
      // In production, this would be a custom Lambda function
      // For now, we'll aggregate from existing data
      
      // Get total users
      const users = await client.models.User.list({ limit: 1000 });
      const totalUsers = users.data.length;
      
      // Get active users (simplified - in production would check sessions)
      const activeUsers24h = users.data.filter(u => {
        const lastVote = u.stats?.lastVoteDate;
        if (!lastVote) return false;
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(lastVote) > dayAgo;
      }).length;
      
      // Get vote counts
      const votes = await client.models.Vote.list({ limit: 1000 });
      const totalVotes = votes.data.length;
      
      const today = new Date().toISOString().split('T')[0];
      const votesToday = votes.data.filter(v => 
        v.createdAt.startsWith(today)
      ).length;
      
      // Get image counts
      const images = await client.models.Image.list({ limit: 1000 });
      const totalImages = images.data.length;
      const pendingImages = images.data.filter(i => i.status === 'pending').length;
      
      return {
        totalUsers,
        totalVotes,
        totalImages,
        pendingImages,
        activeUsers24h,
        votesToday,
      };
    } catch (error) {
      console.error('Failed to get admin stats:', error);
      throw error;
    }
  }

  /**
   * Get pending images for approval
   */
  async getPendingImages(limit: number = 20): Promise<PendingImage[]> {
    try {
      const response = await client.models.Image.list({
        filter: { status: { eq: 'pending' } },
        limit,
        sortDirection: 'DESC',
      });
      
      return response.data.map(img => ({
        imageId: img.imageId,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        characterName: img.characterName,
        categories: img.categories || [],
        metadata: img.metadata,
        createdAt: img.createdAt,
        source: img.source || 'ai',
      }));
    } catch (error) {
      console.error('Failed to get pending images:', error);
      throw error;
    }
  }

  /**
   * Approve an image
   */
  async approveImage(imageId: string, categories?: string[]): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      
      await client.models.Image.update({
        imageId,
        status: 'approved',
        approvedAt: now,
        approvedBy: 'current-admin', // In production, get from auth
        categories: categories || [],
      });
      
      // Log admin action
      await this.logAdminAction({
        action: 'approve',
        targetType: 'image',
        targetId: imageId,
        metadata: { categories },
      });
      
      return true;
    } catch (error) {
      console.error('Failed to approve image:', error);
      throw error;
    }
  }

  /**
   * Reject an image
   */
  async rejectImage(imageId: string, reason?: string): Promise<boolean> {
    try {
      await client.models.Image.update({
        imageId,
        status: 'rejected',
      });
      
      // Log admin action
      await this.logAdminAction({
        action: 'reject',
        targetType: 'image',
        targetId: imageId,
        metadata: { reason },
      });
      
      return true;
    } catch (error) {
      console.error('Failed to reject image:', error);
      throw error;
    }
  }

  /**
   * Set image promotion weight
   */
  async setPromotionWeight(imageId: string, weight: number): Promise<boolean> {
    try {
      await client.models.Image.update({
        imageId,
        promotionWeight: weight,
      });
      
      // Log admin action
      await this.logAdminAction({
        action: 'promote',
        targetType: 'image',
        targetId: imageId,
        metadata: { weight },
      });
      
      return true;
    } catch (error) {
      console.error('Failed to set promotion weight:', error);
      throw error;
    }
  }

  /**
   * Get all categories
   */
  async getCategories() {
    try {
      const response = await client.models.Category.list({
        limit: 100,
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to get categories:', error);
      throw error;
    }
  }

  /**
   * Create a new category
   */
  async createCategory(
    displayName: string,
    type: 'physical' | 'demographic' | 'style',
    options: string[]
  ) {
    try {
      const categoryId = `${type}-${displayName.toLowerCase().replace(/\s+/g, '-')}`;
      
      const response = await client.models.Category.create({
        categoryId,
        displayName,
        type,
        options,
        isActive: true,
        createdBy: 'current-admin', // In production, get from auth
      });
      
      // Log admin action
      await this.logAdminAction({
        action: 'create',
        targetType: 'category',
        targetId: categoryId,
        metadata: { displayName, type, options },
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to create category:', error);
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    updates: Partial<{
      displayName: string;
      options: string[];
      isActive: boolean;
    }>
  ) {
    try {
      const response = await client.models.Category.update({
        categoryId,
        ...updates,
      });
      
      // Log admin action
      await this.logAdminAction({
        action: 'edit',
        targetType: 'category',
        targetId: categoryId,
        metadata: updates,
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  }

  /**
   * Get analytics data
   */
  async getAnalytics(period: 'day' | 'week' | 'month' | 'year'): Promise<AnalyticsData> {
    try {
      // Mock data - in production this would come from a Lambda function
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      
      // Generate mock data
      const labels = [];
      const votingData = [];
      const dataPoints = period === 'day' ? 24 : period === 'week' ? 7 : period === 'month' ? 30 : 12;
      
      for (let i = 0; i < dataPoints; i++) {
        if (period === 'day') {
          labels.push(`${i}:00`);
        } else if (period === 'week') {
          labels.push(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]);
        } else if (period === 'month') {
          labels.push(`${i + 1}`);
        } else {
          labels.push(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]);
        }
        votingData.push(Math.floor(Math.random() * 1000) + 500);
      }
      
      return {
        totalVotes: 15423,
        votesChange: 12.5,
        activeUsers: 3421,
        usersChange: 8.3,
        avgSessionDuration: 12.5,
        sessionChange: -2.1,
        engagementRate: 68.5,
        engagementChange: 5.2,
        votingActivity: {
          labels,
          data: votingData,
        },
        categoryPerformance: {
          labels: ['Ass', 'Tits', 'Face', 'Full Body', 'Artistic'],
          data: [3245, 2890, 1567, 987, 456],
        },
        demographics: [
          { label: '18-24', value: 35 },
          { label: '25-34', value: 42 },
          { label: '35-44', value: 15 },
          { label: '45+', value: 8 },
        ],
        topContent: [
          { name: 'Image #1234', votes: 2341, winRate: 78.5 },
          { name: 'Image #5678', votes: 2145, winRate: 72.3 },
          { name: 'Image #9012', votes: 1987, winRate: 69.8 },
        ],
        newUsers: 543,
        returningUsers: 82.3,
        avgVotesPerUser: 4.5,
      };
    } catch (error) {
      console.error('Failed to get analytics:', error);
      throw error;
    }
  }

  /**
   * Log admin action (private method)
   */
  private async logAdminAction(action: Omit<AdminAction, 'actionId' | 'adminId' | 'timestamp'>) {
    try {
      // In production, this would write to an AdminActions table
      console.log('Admin action:', {
        ...action,
        adminId: 'current-admin',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
      // Don't throw - logging failures shouldn't block operations
    }
  }
}

export const adminAPI = new AdminAPI();