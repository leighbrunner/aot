"""
Complete character creation workflow
Orchestrates training data generation, LoRA training, and final image generation
"""

import asyncio
import json
from pathlib import Path
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from generate_training_data import TrainingDataGenerator
from train_lora import LoRATrainer
from scripts.prompt_generator import PromptGenerator
from scripts.tag_extractor import TagExtractor
from scripts.s3_sync import S3Uploader
import httpx
import base64

class CharacterCreationWorkflow:
    def __init__(self, sd_api_url: str = "http://localhost:7860"):
        self.sd_api_url = sd_api_url
        self.training_generator = TrainingDataGenerator(sd_api_url)
        self.lora_trainer = LoRATrainer()
        self.prompt_generator = PromptGenerator()
        self.tag_extractor = TagExtractor()
        self.s3_uploader = S3Uploader()
        
        self.workflow_dir = Path("../models/workflows")
        self.workflow_dir.mkdir(parents=True, exist_ok=True)
    
    async def create_character(self, character_id: str, auto_approve: bool = False):
        """Complete workflow for creating a character"""
        workflow_id = f"{character_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        workflow_log = {
            'workflow_id': workflow_id,
            'character_id': character_id,
            'started_at': datetime.utcnow().isoformat(),
            'steps': []
        }
        
        try:
            # Step 1: Generate training data
            print(f"\n{'='*60}")
            print(f"Starting character creation for: {character_id}")
            print(f"{'='*60}\n")
            
            print("Step 1: Generating training data...")
            training_result = await self.training_generator.generate_for_character_batch([character_id])
            
            workflow_log['steps'].append({
                'step': 'training_data_generation',
                'status': training_result[character_id]['status'],
                'files_generated': training_result[character_id].get('count', 0),
                'timestamp': datetime.utcnow().isoformat()
            })
            
            if training_result[character_id]['status'] != 'success':
                raise Exception("Failed to generate training data")
            
            # Step 2: Manual approval (or auto-approve)
            if not auto_approve:
                print("\n" + "="*60)
                print("MANUAL APPROVAL REQUIRED")
                print("="*60)
                print(f"Training data generated in: ../models/training_data/{character_id}/")
                print("Please review the images and ensure they meet quality standards.")
                print("\nCheck for:")
                print("- Consistent facial features")
                print("- Proper anatomy")
                print("- No artifacts or deformities")
                print("- Good variety of poses")
                
                approval = input("\nApprove training data? (yes/no): ")
                if approval.lower() != 'yes':
                    workflow_log['steps'].append({
                        'step': 'manual_approval',
                        'status': 'rejected',
                        'timestamp': datetime.utcnow().isoformat()
                    })
                    raise Exception("Training data rejected by user")
            
            workflow_log['steps'].append({
                'step': 'manual_approval',
                'status': 'approved',
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # Step 3: Train LoRA
            print("\nStep 3: Training LoRA model...")
            print("This may take 30-60 minutes on Apple Silicon...")
            
            training_result = self.lora_trainer.train_character(character_id, auto_run=True)
            
            workflow_log['steps'].append({
                'step': 'lora_training',
                'status': training_result['status'],
                'lora_path': training_result.get('lora_path', ''),
                'timestamp': datetime.utcnow().isoformat()
            })
            
            if training_result['status'] != 'completed':
                raise Exception(f"LoRA training failed: {training_result.get('error', 'Unknown error')}")
            
            # Step 4: Generate final images
            print("\nStep 4: Generating final images...")
            final_images = await self.generate_final_images(character_id)
            
            workflow_log['steps'].append({
                'step': 'final_generation',
                'status': 'success' if final_images else 'failed',
                'images_generated': len(final_images),
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # Step 5: Upload to S3
            print("\nStep 5: Uploading to S3...")
            s3_results = await self.upload_to_s3(character_id, final_images, training_result['lora_path'])
            
            workflow_log['steps'].append({
                'step': 's3_upload',
                'status': 'success',
                'files_uploaded': len(s3_results),
                'timestamp': datetime.utcnow().isoformat()
            })
            
            # Complete workflow
            workflow_log['completed_at'] = datetime.utcnow().isoformat()
            workflow_log['status'] = 'completed'
            workflow_log['summary'] = {
                'training_images': training_result[character_id].get('count', 0),
                'lora_model': training_result.get('lora_path', ''),
                'final_images': len(final_images),
                's3_uploads': len(s3_results)
            }
            
            print(f"\n{'='*60}")
            print(f"Character creation completed for: {character_id}")
            print(f"- Training images: {workflow_log['summary']['training_images']}")
            print(f"- LoRA model: {workflow_log['summary']['lora_model']}")
            print(f"- Final images: {workflow_log['summary']['final_images']}")
            print(f"{'='*60}\n")
            
        except Exception as e:
            workflow_log['status'] = 'failed'
            workflow_log['error'] = str(e)
            workflow_log['failed_at'] = datetime.utcnow().isoformat()
            print(f"\nWorkflow failed: {e}")
        
        # Save workflow log
        log_path = self.workflow_dir / f"{workflow_id}.json"
        with open(log_path, 'w') as f:
            json.dump(workflow_log, f, indent=2)
        
        return workflow_log
    
    async def generate_final_images(self, character_id: str, count: int = 20):
        """Generate final images using trained LoRA"""
        # Load character data
        with open('../config/characters.json', 'r') as f:
            characters = json.load(f)['characters']
        character = next((c for c in characters if c['id'] == character_id), None)
        
        if not character:
            raise ValueError(f"Character {character_id} not found")
        
        final_images = []
        output_dir = Path(f"../models/final_images/{character_id}")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        async with httpx.AsyncClient(timeout=600) as client:
            # Generate 10 ass-focused and 10 tits-focused images
            for focus in ['ass', 'tits']:
                for i in range(count // 2):
                    try:
                        # Generate varied prompt
                        prompt, tags = self.prompt_generator.generate_prompt(
                            character_id=character_id,
                            character_lora=f"{character_id}_lora",
                            focus=focus,
                            is_nude=False  # Start with clothed variations
                        )
                        
                        # API payload
                        payload = {
                            "prompt": prompt,
                            "negative_prompt": "blurry, deformed, ugly, bad anatomy",
                            "steps": 50,
                            "sampler_name": "DPM++ 2M Karras",
                            "cfg_scale": 7.5,
                            "width": 1024,
                            "height": 1024,
                            "seed": -1  # Random seed for variety
                        }
                        
                        print(f"  Generating {focus} image {i+1}/{count//2}...")
                        
                        response = await client.post(
                            f"{self.sd_api_url}/sdapi/v1/txt2img",
                            json=payload
                        )
                        response.raise_for_status()
                        
                        result = response.json()
                        images = result.get('images', [])
                        
                        if images:
                            # Save image
                            img_data = base64.b64decode(images[0])
                            timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
                            filename = f"{character_id}_{focus}_{timestamp}_{i}.png"
                            filepath = output_dir / filename
                            
                            with open(filepath, 'wb') as f:
                                f.write(img_data)
                            
                            # Extract tags
                            extracted_tags = self.tag_extractor.extract_from_prompt(prompt, character)
                            
                            final_images.append({
                                'path': str(filepath),
                                'filename': filename,
                                'prompt': prompt,
                                'tags': extracted_tags.to_dict(),
                                'focus': focus,
                                'parameters': result.get('parameters', {})
                            })
                            
                            print(f"    ✓ Generated: {filename}")
                    
                    except Exception as e:
                        print(f"    ✗ Error generating image: {e}")
                        continue
                    
                    # Small delay
                    await asyncio.sleep(2)
        
        return final_images
    
    async def upload_to_s3(self, character_id: str, images: list, lora_path: str):
        """Upload images and LoRA to S3"""
        s3_results = []
        
        # Upload LoRA model
        if lora_path and os.path.exists(lora_path):
            print(f"  Uploading LoRA model...")
            lora_url = await self.s3_uploader.upload_file(
                lora_path,
                f"models/loras/{character_id}_lora.safetensors",
                metadata={'character_id': character_id, 'type': 'lora_model'}
            )
            s3_results.append({
                'type': 'lora',
                'url': lora_url
            })
        
        # Upload images
        for img_data in images:
            print(f"  Uploading {img_data['filename']}...")
            img_url = await self.s3_uploader.upload_file(
                img_data['path'],
                f"generated/{character_id}/{img_data['filename']}",
                metadata=self.tag_extractor.create_s3_metadata(
                    self.tag_extractor.extract_from_prompt(img_data['prompt'], {'id': character_id})
                )
            )
            s3_results.append({
                'type': 'image',
                'url': img_url,
                'tags': img_data['tags']
            })
        
        return s3_results

# CLI usage
async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Complete character creation workflow")
    parser.add_argument('character_id', help='Character ID to create')
    parser.add_argument('--auto-approve', action='store_true', help='Skip manual approval')
    parser.add_argument('--sd-url', default='http://localhost:7860', help='SD API URL')
    
    args = parser.parse_args()
    
    workflow = CharacterCreationWorkflow(sd_api_url=args.sd_url)
    result = await workflow.create_character(args.character_id, auto_approve=args.auto_approve)
    
    print(f"\nWorkflow status: {result['status']}")
    if result['status'] == 'failed':
        print(f"Error: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    asyncio.run(main())