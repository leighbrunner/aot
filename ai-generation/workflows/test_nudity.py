#!/usr/bin/env python3
"""
Quick test to verify nude generation is working
"""

import httpx
import asyncio
import base64
from pathlib import Path
import json

async def test_nude_generation():
    """Test single nude image generation"""
    
    # Read API key
    api_key_path = Path("../setup/stable-diffusion-webui/api_key.txt")
    if api_key_path.exists():
        api_key = api_key_path.read_text().strip()
        auth = (api_key.split(':')[0], api_key.split(':')[1])
    else:
        print("No API key found")
        return
    
    # Strong nudity prompt
    prompt = """(masterpiece, photorealistic:1.3), ultra-detailed, 8k uhd, sharp focus,
    beautiful young woman, 20 years old, caucasian, blonde hair, athletic body,
    (fully nude:1.5), (completely naked:1.3), (no clothing:1.4), bare skin,
    full body portrait, frontal view, standing pose, studio lighting,
    detailed anatomy, natural skin texture, anatomically correct"""
    
    negative_prompt = """(worst quality, low quality:1.4), blurry, deformed, ugly,
    (clothing:1.5), (underwear:1.5), (bra:1.5), (panties:1.5), (bikini:1.5),
    (fabric:1.4), (textile:1.4), covered, censored, child, underage"""
    
    payload = {
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "steps": 35,
        "sampler_name": "DPM++ 2M SDE Karras",
        "cfg_scale": 5.0,
        "width": 1024,
        "height": 1024,
        "seed": 42,
    }
    
    print("Testing nude generation with strong prompts...")
    print(f"Prompt emphasis: (fully nude:1.5), (completely naked:1.3)")
    print(f"Negative emphasis: (clothing:1.5), (underwear:1.5)")
    
    async with httpx.AsyncClient(timeout=300, auth=auth) as client:
        try:
            response = await client.post(
                "http://localhost:7860/sdapi/v1/txt2img",
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            images = result.get('images', [])
            
            if images:
                # Save test image
                img_data = base64.b64decode(images[0])
                output_dir = Path("../test_outputs")
                output_dir.mkdir(exist_ok=True)
                
                filename = "nude_test_strong_prompt.png"
                filepath = output_dir / filename
                
                with open(filepath, 'wb') as f:
                    f.write(img_data)
                
                print(f"✓ Image saved to: {filepath}")
                print("\nPlease check the image to verify nudity.")
                
                # Save metadata
                meta = {
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "parameters": payload
                }
                
                meta_path = output_dir / "nude_test_strong_prompt_meta.json"
                with open(meta_path, 'w') as f:
                    json.dump(meta, f, indent=2)
                
            else:
                print("✗ No images returned")
                
        except Exception as e:
            print(f"✗ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_nude_generation())