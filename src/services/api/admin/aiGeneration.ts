/**
 * AI Generation API service for admin interface
 */

import { API_CONFIG } from '@/config/api';

const AI_API_URL = process.env.EXPO_PUBLIC_AI_API_URL || 'http://localhost:8080';
const AI_API_KEY = process.env.EXPO_PUBLIC_AI_API_KEY || 'your-api-key';

export interface GenerateImageRequest {
  character_id: string;
  focus: 'ass' | 'tits';
  is_nude?: boolean;
  scene?: string;
  pose?: string;
  lighting?: string;
  accessory?: string;
  batch_size?: number;
}

export interface GenerationJob {
  job_id: string;
  status: string;
  message: string;
}

export interface JobStatus {
  job_id: string;
  status: string;
  progress: number;
  result?: {
    images: Array<{
      url: string;
      filename: string;
      tags: Record<string, any>;
    }>;
    prompt: string;
    parameters: Record<string, any>;
  };
  error?: string;
}

class AIGenerationAPI {
  private headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AI_API_KEY}`,
  };

  async generateImage(request: GenerateImageRequest): Promise<GenerationJob> {
    try {
      const response = await fetch(`${AI_API_URL}/api/generate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Generate image error:', error);
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    try {
      const response = await fetch(`${AI_API_URL}/api/status/${jobId}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get job status error:', error);
      throw error;
    }
  }

  async getCharacters(): Promise<any> {
    try {
      const response = await fetch(`${AI_API_URL}/api/characters`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get characters error:', error);
      throw error;
    }
  }

  async getJobs(filters?: {
    character_id?: string;
    status?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.character_id) params.append('character_id', filters.character_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`${AI_API_URL}/api/jobs?${params}`, {
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get jobs error:', error);
      return [];
    }
  }

  async batchGenerate(
    characterId: string,
    count: number,
    options: {
      focus?: 'ass' | 'tits' | 'mixed';
      includeNude?: boolean;
    } = {}
  ): Promise<GenerationJob[]> {
    const jobs: GenerationJob[] = [];
    const { focus = 'mixed', includeNude = false } = options;

    // Calculate distribution
    const assCount = focus === 'ass' ? count : focus === 'mixed' ? Math.floor(count / 2) : 0;
    const titsCount = focus === 'tits' ? count : focus === 'mixed' ? Math.ceil(count / 2) : 0;

    // Generate ass-focused images
    for (let i = 0; i < assCount; i++) {
      const job = await this.generateImage({
        character_id: characterId,
        focus: 'ass',
        is_nude: includeNude && i % 4 === 0, // 25% nude if enabled
        batch_size: 1,
      });
      jobs.push(job);
    }

    // Generate tits-focused images
    for (let i = 0; i < titsCount; i++) {
      const job = await this.generateImage({
        character_id: characterId,
        focus: 'tits',
        is_nude: includeNude && i % 4 === 0, // 25% nude if enabled
        batch_size: 1,
      });
      jobs.push(job);
    }

    return jobs;
  }

  // Poll for job completion
  async waitForJob(jobId: string, timeoutMs: number = 300000): Promise<JobStatus> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getJobStatus(jobId);
      
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    throw new Error('Job timeout');
  }
}

export const aiGenerationAPI = new AIGenerationAPI();