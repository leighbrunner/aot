import { fetchAuthSession } from 'aws-amplify/auth'

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT

class AdminApi {
  private async getAuthHeaders() {
    const session = await fetchAuthSession()
    const token = session.tokens?.idToken?.toString()
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const headers = await this.getAuthHeaders()
    
    const response = await fetch(`${API_ENDPOINT}${url}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Dashboard
  async getDashboardStats() {
    return this.fetchWithAuth('/admin/analytics/overview')
  }

  async getRecentActivity() {
    return this.fetchWithAuth('/admin/analytics/activity?limit=10')
  }

  async getVotingTrends() {
    return this.fetchWithAuth('/admin/analytics/trends?days=7')
  }

  // Images
  async getPendingImages(page = 1, limit = 20) {
    return this.fetchWithAuth(`/admin/images/pending?page=${page}&limit=${limit}`)
  }

  async approveImage(imageId: string, metadata: any) {
    return this.fetchWithAuth(`/admin/images/${imageId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(metadata),
    })
  }

  async rejectImage(imageId: string, reason: string) {
    return this.fetchWithAuth(`/admin/images/${imageId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    })
  }

  async setPromotionWeight(imageId: string, weight: number) {
    return this.fetchWithAuth(`/admin/images/${imageId}/promote`, {
      method: 'PUT',
      body: JSON.stringify({ promotionWeight: weight }),
    })
  }

  // AI Generation
  async generateImages(params: {
    characterName: string
    count: number
    categories: string[]
    metadata?: any
  }) {
    return this.fetchWithAuth('/admin/images/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  async getGenerationHistory(page = 1, limit = 20) {
    return this.fetchWithAuth(`/admin/images/generation-history?page=${page}&limit=${limit}`)
  }

  // Categories
  async getCategories() {
    return this.fetchWithAuth('/admin/categories')
  }

  async createCategory(category: {
    displayName: string
    type: 'physical' | 'demographic' | 'style'
    options: string[]
  }) {
    return this.fetchWithAuth('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    })
  }

  async updateCategory(categoryId: string, updates: any) {
    return this.fetchWithAuth(`/admin/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteCategory(categoryId: string) {
    return this.fetchWithAuth(`/admin/categories/${categoryId}`, {
      method: 'DELETE',
    })
  }

  // Analytics
  async getImageAnalytics(imageId: string) {
    return this.fetchWithAuth(`/admin/analytics/images/${imageId}`)
  }

  async getCategoryAnalytics(period: 'day' | 'week' | 'month' | 'year' | 'all') {
    return this.fetchWithAuth(`/admin/analytics/categories?period=${period}`)
  }

  async getCountryAnalytics() {
    return this.fetchWithAuth('/admin/analytics/countries')
  }

  async getUserAnalytics(page = 1, limit = 20) {
    return this.fetchWithAuth(`/admin/analytics/users?page=${page}&limit=${limit}`)
  }

  async getLeaderboard(period: 'day' | 'week' | 'month' | 'year' | 'all') {
    return this.fetchWithAuth(`/leaderboards/${period}`)
  }

  // Users
  async getUsers(page = 1, limit = 20, search?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.append('search', search)
    
    return this.fetchWithAuth(`/admin/users?${params}`)
  }

  async getUserDetails(userId: string) {
    return this.fetchWithAuth(`/admin/users/${userId}`)
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended') {
    return this.fetchWithAuth(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }
}

export const adminApi = new AdminApi()