"""
Generate training data for character LoRA models
Creates 5-10 nude base images per character for training
"""

import asyncio
import httpx
import json
import base64
import os
from datetime import datetime
from pathlib import Path
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.prompt_generator import PromptGenerator
from typing import List, Dict

class TrainingDataGenerator:
    def __init__(self, sd_api_url: str = "http://localhost:7860"):
        self.sd_api_url = sd_api_url
        self.prompt_generator = PromptGenerator()
        self.output_dir = Path("../models/training_data")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Training image variations for diverse angles/poses
        self.training_variations = [
            "frontal view, neutral standing pose, arms at sides",
            "side profile, standing straight, looking ahead",
            "back view, standing relaxed, head turned slightly",
            "three quarter angle, weight on one leg, natural pose",
            "sitting on stool, upright posture, hands on knees",
            "lying on back, relaxed pose, arms at sides",
            "kneeling position, upright torso, hands on thighs",
            "standing with arms raised, stretching pose",
            "reclining on side, propped on elbow",
            "standing twist, looking over shoulder"
        ]
    
    async def generate_base_images(self, character: Dict) -> List[str]:
        """Generate nude base images for a character"""
        character_dir = self.output_dir / character['id']
        character_dir.mkdir(exist_ok=True)
        
        generated_files = []
        
        print(f"\nGenerating training data for {character['name']}...")
        
        # Build base description from character data
        base_description = f"""beautiful young woman, {character['age_range']} years old, 
        {character['ethnicity']} ethnicity, {character['hair']} hair, 
        {character['body_type']} body type, {character['breast_size']} breasts, 
        {character['ass_size']} ass"""
        
        # Add distinctive features
        if 'distinctive_features' in character:
            features = ', '.join(character['distinctive_features'])
            base_description += f", {features}"
        
        # Read API key
        api_key_path = Path("../setup/stable-diffusion-webui/api_key.txt")
        if api_key_path.exists():
            api_key = api_key_path.read_text().strip()
            auth = (api_key.split(':')[0], api_key.split(':')[1])
        else:
            auth = None
            
        async with httpx.AsyncClient(timeout=600, auth=auth) as client:
            for idx, variation in enumerate(self.training_variations):
                try:
                    # Generate training prompt
                    prompt = self.prompt_generator.generate_training_prompt(
                        base_description=base_description,
                        variation=variation,
                        is_nude=True
                    )
                    
                    # Negative prompt for quality and ensure nudity
                    negative_prompt = """blurry, deformed, ugly, bad anatomy, disfigured, 
                    poorly drawn face, mutation, mutated, extra limb, ugly, poorly drawn hands, 
                    missing limb, floating limbs, disconnected limbs, malformed hands, 
                    out of focus, long neck, long body, childish, child-like, underage,
                    clothing, clothes, underwear, bra, panties, bikini, swimsuit, fabric, textile"""
                    
                    # API payload with optimal settings for RealVisXL V5.0
                    payload = {
                        "prompt": prompt,
                        "negative_prompt": negative_prompt,
                        "steps": 35,
                        "sampler_name": "DPM++ 2M SDE Karras",
                        "cfg_scale": 5.0,  # Lower for SDXL models
                        "width": 1024,
                        "height": 1024,
                        "seed": 42 + idx,  # Consistent seeds for reproducibility
                    }
                    
                    print(f"  Generating image {idx + 1}/10: {variation[:30]}...")
                    
                    # Generate image
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
                        filename = f"{character['id']}_training_{idx:03d}.png"
                        filepath = character_dir / filename
                        
                        with open(filepath, 'wb') as f:
                            f.write(img_data)
                        
                        generated_files.append(str(filepath))
                        
                        # Save metadata
                        metadata = {
                            "character_id": character['id'],
                            "character_name": character['name'],
                            "image_index": idx,
                            "variation": variation,
                            "prompt": prompt,
                            "negative_prompt": negative_prompt,
                            "parameters": payload,
                            "generated_at": datetime.utcnow().isoformat()
                        }
                        
                        meta_filepath = character_dir / f"{character['id']}_training_{idx:03d}_meta.json"
                        with open(meta_filepath, 'w') as f:
                            json.dump(metadata, f, indent=2)
                        
                        print(f"    ✓ Saved: {filename}")
                    
                except Exception as e:
                    print(f"    ✗ Error generating image {idx + 1}: {e}")
                    continue
                
                # Small delay between generations
                await asyncio.sleep(2)
        
        print(f"  Generated {len(generated_files)} training images for {character['name']}")
        
        # Create summary file
        summary = {
            "character_id": character['id'],
            "character_name": character['name'],
            "total_images": len(generated_files),
            "image_files": [os.path.basename(f) for f in generated_files],
            "generated_at": datetime.utcnow().isoformat(),
            "ready_for_training": len(generated_files) >= 5
        }
        
        summary_path = character_dir / f"{character['id']}_training_summary.json"
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        return generated_files
    
    async def generate_for_character_batch(self, character_ids: List[str]):
        """Generate training data for a batch of characters"""
        # Load character data
        with open('../config/characters.json', 'r') as f:
            all_characters = json.load(f)['characters']
        
        # Filter to requested characters
        characters = [c for c in all_characters if c['id'] in character_ids]
        
        if not characters:
            print(f"No characters found with IDs: {character_ids}")
            return
        
        print(f"Generating training data for {len(characters)} characters...")
        
        results = {}
        for character in characters:
            try:
                files = await self.generate_base_images(character)
                results[character['id']] = {
                    'status': 'success',
                    'files': files,
                    'count': len(files)
                }
            except Exception as e:
                print(f"Failed to generate data for {character['name']}: {e}")
                results[character['id']] = {
                    'status': 'failed',
                    'error': str(e)
                }
        
        # Save batch results
        batch_summary = {
            "batch_id": datetime.utcnow().strftime("%Y%m%d_%H%M%S"),
            "characters_processed": len(results),
            "results": results,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        batch_path = self.output_dir / f"batch_summary_{batch_summary['batch_id']}.json"
        with open(batch_path, 'w') as f:
            json.dump(batch_summary, f, indent=2)
        
        print(f"\nBatch generation complete. Summary saved to: {batch_path}")
        return results

# CLI usage
async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate training data for characters")
    parser.add_argument('--characters', nargs='+', help='Character IDs to process')
    parser.add_argument('--sd-url', default='http://localhost:7860', help='Stable Diffusion API URL')
    parser.add_argument('--test', action='store_true', help='Test with first character only')
    
    args = parser.parse_args()
    
    generator = TrainingDataGenerator(sd_api_url=args.sd_url)
    
    if args.test:
        # Test with Emma Riley
        await generator.generate_for_character_batch(['emma_riley'])
    elif args.characters:
        # Generate for specified characters
        await generator.generate_for_character_batch(args.characters)
    else:
        # Interactive mode
        print("Available characters:")
        with open('../config/characters.json', 'r') as f:
            characters = json.load(f)['characters']
        
        for i, char in enumerate(characters):
            print(f"{i+1}. {char['name']} ({char['id']}) - {char['ethnicity']}")
        
        selection = input("\nEnter character numbers (comma-separated) or 'all' for all: ")
        
        if selection.lower() == 'all':
            character_ids = [c['id'] for c in characters]
        else:
            indices = [int(x.strip()) - 1 for x in selection.split(',')]
            character_ids = [characters[i]['id'] for i in indices if 0 <= i < len(characters)]
        
        if character_ids:
            await generator.generate_for_character_batch(character_ids)
        else:
            print("No valid characters selected.")

if __name__ == "__main__":
    asyncio.run(main())