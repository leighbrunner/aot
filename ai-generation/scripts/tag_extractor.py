"""
Tag extraction and metadata management for generated images
"""

import re
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

class BodyType(str, Enum):
    PETITE = "petite"
    SLIM = "slim"
    ATHLETIC = "athletic"
    CURVY = "curvy"
    HOURGLASS = "hourglass"

class Size(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"

@dataclass
class ImageTags:
    """Structured tags for an image"""
    character_id: str
    character_name: str
    
    # Physical attributes
    ethnicity: str
    age_range: str
    hair: str
    body_type: BodyType
    breast_size: Size
    ass_size: Size
    
    # Image specifics
    focus: str  # ass or tits
    scene: str
    pose: str
    lighting: str
    clothing: str
    accessories: List[str]
    camera_angle: str
    
    # Metadata
    nsfw: bool
    quality_score: Optional[float] = None
    generation_params: Optional[Dict[str, Any]] = None
    
    def to_dict(self):
        return asdict(self)
    
    def to_dynamo_format(self):
        """Convert to DynamoDB-friendly format"""
        data = self.to_dict()
        # Convert lists to sets for DynamoDB
        data['accessories'] = set(data['accessories']) if data['accessories'] else set()
        return data

class TagExtractor:
    def __init__(self):
        # Regex patterns for extraction
        self.patterns = {
            'ethnicity': r'\b(caucasian|asian|latina|african|middle[- ]?eastern|mixed)\b',
            'body_type': r'\b(petite|slim|athletic|curvy|hourglass)\b',
            'breast_size': r'\b(small|medium|large)\s+(?:breasts?|bust|chest)\b',
            'ass_size': r'\b(small|medium|large)\s+(?:ass|butt|buttocks|bottom)\b',
            'hair': r'\b(blonde|brunette|black|red|auburn|platinum)\s+(?:hair|locks)\b',
            'scene': r'\b(poolside|gym|beach|bedroom|yoga studio|shower|office|forest|rooftop|spa)\b',
            'clothing': r'\b(nude|bikini|lingerie|sports bra|yoga pants|dress|robe|bodysuit)\b',
            'lighting': r'\b(natural|golden hour|dramatic|moody|neon|candlelit|morning|sunset)\b',
            'camera_angle': r'\b(eye level|low angle|high angle|close-up|wide shot|profile)\b'
        }
        
        # Accessory patterns
        self.accessory_patterns = [
            r'\b(jewelry|necklace|bracelet|anklet)\b',
            r'\b(sunglasses|glasses)\b',
            r'\b(tattoo|body art)\b',
            r'\b(piercing|earrings)\b',
            r'\b(flower|scarf|chain)\b'
        ]

    def extract_from_prompt(self, prompt: str, character_data: Dict[str, Any]) -> ImageTags:
        """Extract tags from a generation prompt"""
        prompt_lower = prompt.lower()
        
        # Extract from prompt
        ethnicity = self._extract_pattern(prompt_lower, self.patterns['ethnicity']) or character_data.get('ethnicity')
        body_type = self._extract_pattern(prompt_lower, self.patterns['body_type']) or character_data.get('body_type')
        breast_size = self._extract_breast_size(prompt_lower) or character_data.get('breast_size')
        ass_size = self._extract_ass_size(prompt_lower) or character_data.get('ass_size')
        hair = self._extract_pattern(prompt_lower, self.patterns['hair']) or character_data.get('hair')
        scene = self._extract_pattern(prompt_lower, self.patterns['scene']) or 'unknown'
        clothing = self._extract_pattern(prompt_lower, self.patterns['clothing']) or 'clothed'
        lighting = self._extract_pattern(prompt_lower, self.patterns['lighting']) or 'natural'
        camera_angle = self._extract_pattern(prompt_lower, self.patterns['camera_angle']) or 'eye level'
        
        # Extract accessories
        accessories = []
        for pattern in self.accessory_patterns:
            match = re.search(pattern, prompt_lower)
            if match:
                accessories.append(match.group(1))
        
        # Determine focus
        if 'lower body' in prompt_lower or 'buttocks' in prompt_lower or 'ass' in prompt_lower:
            focus = 'ass'
        elif 'upper curves' in prompt_lower or 'cleavage' in prompt_lower or 'breasts' in prompt_lower:
            focus = 'tits'
        else:
            focus = 'unknown'
        
        # Determine NSFW
        nsfw = 'nude' in prompt_lower or 'naked' in prompt_lower
        
        return ImageTags(
            character_id=character_data['id'],
            character_name=character_data['name'],
            ethnicity=ethnicity,
            age_range=character_data.get('age_range', '18-30'),
            hair=hair,
            body_type=BodyType(body_type),
            breast_size=Size(breast_size),
            ass_size=Size(ass_size),
            focus=focus,
            scene=scene,
            pose=self._extract_pose(prompt_lower),
            lighting=lighting,
            clothing=clothing,
            accessories=accessories,
            camera_angle=camera_angle,
            nsfw=nsfw
        )
    
    def _extract_pattern(self, text: str, pattern: str) -> Optional[str]:
        """Extract first match of pattern from text"""
        match = re.search(pattern, text)
        return match.group(1) if match else None
    
    def _extract_breast_size(self, text: str) -> str:
        """Extract breast size with special handling"""
        # Direct size mentions
        match = re.search(r'\b(small|medium|large)\s+(?:breasts?|bust|chest)\b', text)
        if match:
            return match.group(1)
        
        # Descriptive terms
        if any(word in text for word in ['voluptuous', 'ample', 'generous']):
            return 'large'
        elif any(word in text for word in ['petite', 'small']):
            return 'small'
        
        return 'medium'
    
    def _extract_ass_size(self, text: str) -> str:
        """Extract ass size with special handling"""
        # Direct size mentions
        match = re.search(r'\b(small|medium|large)\s+(?:ass|butt|buttocks|bottom)\b', text)
        if match:
            return match.group(1)
        
        # Descriptive terms
        if any(word in text for word in ['curvaceous', 'voluptuous', 'thick']):
            return 'large'
        elif any(word in text for word in ['petite', 'small', 'tight']):
            return 'small'
        
        return 'medium'
    
    def _extract_pose(self, text: str) -> str:
        """Extract pose description"""
        pose_keywords = [
            'arching back', 'bending forward', 'squatting', 'lying down',
            'standing', 'sitting', 'kneeling', 'stretching', 'leaning',
            'on all fours', 'side profile', 'looking over shoulder'
        ]
        
        for pose in pose_keywords:
            if pose in text:
                return pose
        
        return 'standing'
    
    def create_s3_metadata(self, tags: ImageTags) -> Dict[str, str]:
        """Create S3-compatible metadata (strings only)"""
        return {
            'character_id': tags.character_id,
            'character_name': tags.character_name,
            'ethnicity': tags.ethnicity,
            'body_type': tags.body_type,
            'focus': tags.focus,
            'scene': tags.scene,
            'clothing': tags.clothing,
            'nsfw': str(tags.nsfw),
            'breast_size': tags.breast_size,
            'ass_size': tags.ass_size
        }
    
    def create_search_tags(self, tags: ImageTags) -> List[str]:
        """Create searchable tags for the image"""
        search_tags = [
            tags.character_id,
            tags.character_name.lower().replace(' ', '_'),
            tags.ethnicity,
            tags.body_type,
            f"breast_{tags.breast_size}",
            f"ass_{tags.ass_size}",
            tags.focus,
            tags.scene,
            tags.clothing
        ]
        
        # Add accessories
        search_tags.extend(tags.accessories)
        
        # Add combinations
        search_tags.append(f"{tags.ethnicity}_{tags.body_type}")
        search_tags.append(f"{tags.focus}_{tags.scene}")
        
        if tags.nsfw:
            search_tags.append("nsfw")
            search_tags.append("nude")
        
        # Remove duplicates
        return list(set(search_tags))

# Usage example
if __name__ == "__main__":
    extractor = TagExtractor()
    
    # Sample prompt
    prompt = """photorealistic caucasian woman, athletic build, large breasts, 
    poolside, arching back looking over shoulder, emphasizing curvaceous lower body, 
    wearing micro bikini, golden hour lighting, wearing sunglasses"""
    
    # Sample character data
    character_data = {
        'id': 'emma_riley',
        'name': 'Emma Riley',
        'ethnicity': 'caucasian',
        'body_type': 'athletic',
        'breast_size': 'medium',
        'ass_size': 'medium',
        'age_range': '18-22',
        'hair': 'blonde'
    }
    
    tags = extractor.extract_from_prompt(prompt, character_data)
    print("Extracted Tags:")
    print(json.dumps(tags.to_dict(), indent=2))
    
    print("\nS3 Metadata:")
    print(json.dumps(extractor.create_s3_metadata(tags), indent=2))
    
    print("\nSearch Tags:")
    print(extractor.create_search_tags(tags))