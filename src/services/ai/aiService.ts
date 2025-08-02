import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export interface GenerationRequest {
  prompt: string;
  style?: string;
  characterName?: string;
  quantity?: number;
  metadata?: {
    ageRange?: string;
    bodyType?: string;
    nationality?: string;
    [key: string]: any;
  };
}

export interface GenerationResult {
  generationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  images?: Array<{
    imageId: string;
    url: string;
    thumbnailUrl: string;
  }>;
  error?: string;
  cost?: number;
  createdAt: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  basePrompt: string;
  variables: Array<{
    name: string;
    type: 'text' | 'select' | 'number';
    options?: string[];
    default?: any;
  }>;
}

class AIService {
  // Mock prompt templates - in production these would be stored in the database
  private promptTemplates: PromptTemplate[] = [
    {
      id: 'portrait-natural',
      name: 'Natural Portrait',
      category: 'portrait',
      basePrompt: 'Professional portrait photo of a {age} year old {gender} {nationality} person, {expression}, natural lighting, high quality, 8k resolution',
      variables: [
        { name: 'age', type: 'number', default: 25 },
        { name: 'gender', type: 'select', options: ['female', 'male'], default: 'female' },
        { name: 'nationality', type: 'text', default: 'American' },
        { name: 'expression', type: 'select', options: ['smiling', 'neutral', 'serious', 'laughing'], default: 'smiling' },
      ],
    },
    {
      id: 'fashion-studio',
      name: 'Fashion Studio',
      category: 'fashion',
      basePrompt: 'Fashion photography, {model_type} model, {clothing_style} outfit, {pose} pose, studio lighting, {background} background',
      variables: [
        { name: 'model_type', type: 'select', options: ['professional', 'casual', 'glamour'], default: 'professional' },
        { name: 'clothing_style', type: 'text', default: 'elegant dress' },
        { name: 'pose', type: 'select', options: ['standing', 'sitting', 'dynamic', 'walking'], default: 'standing' },
        { name: 'background', type: 'select', options: ['white', 'colored', 'gradient', 'scenic'], default: 'white' },
      ],
    },
    {
      id: 'artistic-creative',
      name: 'Artistic Creative',
      category: 'artistic',
      basePrompt: 'Artistic {style} photography, creative composition, {mood} mood, {color_palette} color palette, professional quality',
      variables: [
        { name: 'style', type: 'select', options: ['abstract', 'surreal', 'minimalist', 'dramatic'], default: 'abstract' },
        { name: 'mood', type: 'select', options: ['mysterious', 'dreamy', 'energetic', 'calm'], default: 'mysterious' },
        { name: 'color_palette', type: 'select', options: ['vibrant', 'muted', 'monochrome', 'pastel'], default: 'vibrant' },
      ],
    },
  ];

  /**
   * Queue image generation request
   */
  async queueGeneration(request: GenerationRequest): Promise<GenerationResult> {
    try {
      // In production, this would call a Lambda function that queues the generation
      const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create generation record
      const generation = await client.models.Generation.create({
        generationId,
        prompt: request.prompt,
        style: request.style,
        characterName: request.characterName,
        quantity: request.quantity || 1,
        status: 'pending',
        metadata: request.metadata,
        requestedBy: 'current-admin', // In production, get from auth
      });

      // In production, this would trigger a Lambda function via SQS/EventBridge
      console.log('Generation queued:', generation);

      // Simulate async processing
      this.simulateGeneration(generationId, request);

      return {
        generationId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to queue generation:', error);
      throw error;
    }
  }

  /**
   * Get generation status
   */
  async getGenerationStatus(generationId: string): Promise<GenerationResult> {
    try {
      const generation = await client.models.Generation.get({ generationId });
      
      if (!generation.data) {
        throw new Error('Generation not found');
      }

      return {
        generationId: generation.data.generationId,
        status: generation.data.status as any,
        images: generation.data.images,
        error: generation.data.error || undefined,
        cost: generation.data.cost || undefined,
        createdAt: generation.data.createdAt,
      };
    } catch (error) {
      console.error('Failed to get generation status:', error);
      throw error;
    }
  }

  /**
   * Get generation history
   */
  async getGenerationHistory(limit: number = 20): Promise<GenerationResult[]> {
    try {
      const generations = await client.models.Generation.list({
        limit,
        sortDirection: 'DESC',
      });

      return generations.data.map(gen => ({
        generationId: gen.generationId,
        status: gen.status as any,
        images: gen.images,
        error: gen.error || undefined,
        cost: gen.cost || undefined,
        createdAt: gen.createdAt,
      }));
    } catch (error) {
      console.error('Failed to get generation history:', error);
      throw error;
    }
  }

  /**
   * Get prompt templates
   */
  getPromptTemplates(): PromptTemplate[] {
    return this.promptTemplates;
  }

  /**
   * Build prompt from template
   */
  buildPromptFromTemplate(templateId: string, variables: Record<string, any>): string {
    const template = this.promptTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let prompt = template.basePrompt;
    
    // Replace variables in the prompt
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      prompt = prompt.replace(regex, value);
    });

    return prompt;
  }

  /**
   * Estimate generation cost
   */
  estimateGenerationCost(quantity: number = 1): number {
    // Mock cost calculation - in production this would be based on actual API pricing
    const costPerImage = 0.02; // $0.02 per image
    return quantity * costPerImage;
  }

  /**
   * Cancel generation
   */
  async cancelGeneration(generationId: string): Promise<boolean> {
    try {
      await client.models.Generation.update({
        generationId,
        status: 'cancelled',
      });
      return true;
    } catch (error) {
      console.error('Failed to cancel generation:', error);
      return false;
    }
  }

  /**
   * Simulate generation process (mock implementation)
   */
  private async simulateGeneration(generationId: string, request: GenerationRequest) {
    // Simulate processing delay
    setTimeout(async () => {
      try {
        // Update status to processing
        await client.models.Generation.update({
          generationId,
          status: 'processing',
        });

        // Simulate generation time
        setTimeout(async () => {
          // Generate mock images
          const images = [];
          for (let i = 0; i < (request.quantity || 1); i++) {
            const imageId = `img_${Date.now()}_${i}`;
            images.push({
              imageId,
              url: `https://picsum.photos/600/800?random=${imageId}`,
              thumbnailUrl: `https://picsum.photos/150/200?random=${imageId}`,
            });

            // Create image record
            await client.models.Image.create({
              imageId,
              url: `https://picsum.photos/600/800?random=${imageId}`,
              thumbnailUrl: `https://picsum.photos/150/200?random=${imageId}`,
              characterId: `char_${Date.now()}`,
              characterName: request.characterName || 'AI Generated',
              categories: [],
              metadata: request.metadata,
              status: 'pending',
              source: 'ai',
              promotionWeight: 1,
              generationId,
            });
          }

          // Update generation with results
          await client.models.Generation.update({
            generationId,
            status: 'completed',
            images,
            cost: this.estimateGenerationCost(request.quantity),
          });
        }, 5000 + Math.random() * 5000); // 5-10 seconds
      } catch (error) {
        console.error('Generation simulation failed:', error);
        await client.models.Generation.update({
          generationId,
          status: 'failed',
          error: 'Generation failed: ' + (error as Error).message,
        });
      }
    }, 1000);
  }
}

export const aiService = new AIService();