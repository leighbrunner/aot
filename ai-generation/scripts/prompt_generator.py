"""
Modular prompt generator for creating varied image prompts
Ensures uniqueness and proper tagging
"""

import random
import json
from typing import Dict, Tuple, Optional, List

class PromptGenerator:
    def __init__(self):
        # Scene variations
        self.scenes = [
            'poolside', 'gym', 'beach', 'bedroom', 'yoga studio', 
            'shower', 'office', 'forest trail', 'city rooftop', 'luxury spa',
            'sauna', 'dance studio', 'locker room', 'balcony sunset', 'private jet'
        ]
        
        # Pose variations by focus
        self.poses_ass_focus = [
            'arching back looking over shoulder',
            'bending forward touching toes',
            'side profile hip thrust',
            'on all fours looking back',
            'standing twist emphasizing curves',
            'lying on stomach legs up',
            'squatting position',
            'walking away glance back'
        ]
        
        self.poses_tits_focus = [
            'leaning forward arms pressed together',
            'arms above head stretching',
            'lying on back arched',
            'side lying pose',
            'hands behind head elbows out',
            'pressing against glass',
            'emerging from water',
            'adjusting clothing suggestively'
        ]
        
        # Lighting options
        self.lightings = [
            'soft natural sunlight',
            'golden hour warm glow',
            'dramatic studio lighting',
            'moody shadows',
            'neon accent lights',
            'candlelit ambiance',
            'morning window light',
            'sunset backlight'
        ]
        
        # Accessories
        self.accessories = [
            'none',
            'delicate jewelry',
            'sunglasses',
            'body chain',
            'anklet',
            'temporary tattoo',
            'flower in hair',
            'silk scarf'
        ]
        
        # Clothing options
        self.clothing_items = [
            'micro bikini',
            'sports bra and shorts',
            'sheer lingerie',
            'wet t-shirt',
            'silk robe partially open',
            'yoga pants and crop top',
            'bodysuit',
            'mini dress'
        ]
        
        # Camera angles
        self.camera_angles = [
            'eye level',
            'low angle',
            'high angle',
            'dutch angle',
            'close-up',
            'wide shot',
            'over the shoulder',
            'profile view'
        ]
        
        # Additional details
        self.skin_details = [
            'glistening skin',
            'sun-kissed glow',
            'dewy complexion',
            'light perspiration',
            'soft skin texture',
            'natural skin tone',
            'radiant complexion',
            'silky smooth skin'
        ]

    def generate_prompt(
        self,
        character_id: str,
        character_lora: str,
        focus: str = 'ass',
        is_nude: bool = False,
        scene: Optional[str] = None,
        pose: Optional[str] = None,
        lighting: Optional[str] = None,
        accessory: Optional[str] = None,
        camera_angle: Optional[str] = None,
        custom_elements: Optional[List[str]] = None
    ) -> Tuple[str, Dict[str, any]]:
        """
        Generate a unique prompt with proper tagging
        Returns: (prompt, tags)
        """
        
        # Select random elements if not specified
        scene = scene or random.choice(self.scenes)
        pose = pose or random.choice(self.poses_ass_focus if focus == 'ass' else self.poses_tits_focus)
        lighting = lighting or random.choice(self.lightings)
        accessory = accessory or random.choice(self.accessories)
        camera_angle = camera_angle or random.choice(self.camera_angles)
        skin_detail = random.choice(self.skin_details)
        
        # Determine clothing
        if is_nude:
            clothing = 'nude'
            clothing_desc = 'completely nude, bare skin'
        else:
            clothing = random.choice(self.clothing_items)
            clothing_desc = f'wearing {clothing}'
        
        # Build focus emphasis
        if focus == 'ass':
            emphasis = 'emphasizing curvaceous lower body, perfect rounded buttocks'
        else:
            emphasis = 'emphasizing voluptuous upper curves, ample cleavage'
        
        # Construct base prompt - optimized for SDXL
        base_elements = [
            'photorealistic',
            'ultra detailed',
            'masterpiece quality',
            'Instagram model aesthetic',
            'young woman',
            scene,
            pose,
            emphasis,
            clothing_desc,
            lighting,
            camera_angle,
            skin_detail,
            '8k uhd',
            'film grain'
        ]
        
        # Add accessory if not none
        if accessory != 'none':
            base_elements.append(f'wearing {accessory}')
        
        # Add custom elements
        if custom_elements:
            base_elements.extend(custom_elements)
        
        # Add technical quality markers
        quality_markers = [
            '8k resolution',
            'professional photography',
            'sharp focus',
            'detailed anatomy',
            'perfect proportions'
        ]
        base_elements.extend(quality_markers)
        
        # Combine into prompt
        prompt = ', '.join(base_elements)
        prompt = f"{prompt}, <lora:{character_lora}:1.0>"
        
        # Create tags
        tags = {
            'character_id': character_id,
            'focus': focus,
            'scene': scene,
            'pose': pose,
            'lighting': lighting,
            'accessory': accessory,
            'clothing': clothing,
            'camera_angle': camera_angle,
            'nsfw': is_nude,
            'skin_detail': skin_detail,
            'timestamp': random.randint(1000000, 9999999)  # For uniqueness
        }
        
        return prompt, tags

    def generate_training_prompt(
        self,
        base_description: str,
        variation: str,
        is_nude: bool = True
    ) -> str:
        """Generate prompts for training data"""
        
        if is_nude:
            clothing_state = "(fully nude:1.5), (completely naked:1.3), no clothing, no underwear, no bikini, bare skin, detailed anatomy visible"
        else:
            clothing_state = "wearing minimal clothing"
        
        prompt = f"photorealistic full-body portrait, {base_description}, {clothing_state}, {variation}, high resolution, natural lighting, detailed skin texture, anatomically correct, 8k uhd, film grain"
        
        return prompt

    def extract_tags_from_prompt(self, prompt: str) -> Dict[str, any]:
        """Extract tags from an existing prompt"""
        tags = {}
        
        # Check for nudity
        tags['nsfw'] = 'nude' in prompt.lower()
        
        # Extract scene
        for scene in self.scenes:
            if scene in prompt.lower():
                tags['scene'] = scene
                break
        
        # Extract focus
        if 'lower body' in prompt or 'buttocks' in prompt:
            tags['focus'] = 'ass'
        elif 'upper curves' in prompt or 'cleavage' in prompt:
            tags['focus'] = 'tits'
        
        # Extract other elements
        prompt_lower = prompt.lower()
        
        # Lighting
        for lighting in self.lightings:
            if lighting in prompt_lower:
                tags['lighting'] = lighting
                break
        
        # Clothing
        if 'nude' in prompt_lower:
            tags['clothing'] = 'nude'
        else:
            for clothing in self.clothing_items:
                if clothing in prompt_lower:
                    tags['clothing'] = clothing
                    break
        
        return tags

# Standalone usage example
if __name__ == "__main__":
    generator = PromptGenerator()
    
    # Generate varied prompts
    for i in range(5):
        prompt, tags = generator.generate_prompt(
            character_id="emma_riley",
            character_lora="emma_riley_lora",
            focus="ass" if i % 2 == 0 else "tits",
            is_nude=i > 2
        )
        print(f"\nPrompt {i+1}:")
        print(f"Prompt: {prompt}")
        print(f"Tags: {json.dumps(tags, indent=2)}")