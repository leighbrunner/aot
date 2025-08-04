#!/usr/bin/env python3
"""
Test script to verify optimal settings with RealVisXL V5.0
Generates a test image with recommended settings
"""

import httpx
import json
import base64
import asyncio
from pathlib import Path
from datetime import datetime

async def test_generation():
    """Test image generation with optimal settings"""
    
    # API endpoint and auth
    api_url = "http://localhost:7860"
    api_key = "voting-app:ZE2lAuCNIrDTP/v8lECNWliFNnRYeFXJos+TDc8z7+k="
    
    # Optimal settings for RealVisXL V5.0
    payload = {
        "prompt": "(masterpiece, photorealistic:1.3), ultra-detailed, 8k uhd, sharp focus, film grain, beautiful young woman, natural pose, soft studio lighting, detailed face and eyes, realistic skin texture, anatomically correct, professional photography",
        "negative_prompt": "(worst quality, low quality:1.4), illustration, 3d, 2d, painting, cartoons, sketch, blurry, deformed, artifacts, noise, overexposed, mutated, bad anatomy, disfigured, poorly drawn face, mutation, extra limb, ugly, disgusting, missing limb",
        "steps": 35,
        "sampler_name": "DPM++ 2M SDE Karras",
        "cfg_scale": 5.0,
        "width": 1024,
        "height": 1024,
        "seed": 42,
        "batch_size": 1,
        "enable_hr": True,
        "hr_scale": 1.5,
        "hr_upscaler": "4x-UltraSharp",
        "hr_second_pass_steps": 20,
        "denoising_strength": 0.25,
    }
    
    print("Testing Stable Diffusion with optimal settings...")
    print(f"Model: RealVisXL V5.0")
    print(f"Resolution: {payload['width']}x{payload['height']} -> {int(payload['width']*1.5)}x{int(payload['height']*1.5)}")
    print(f"Sampler: {payload['sampler_name']}")
    print(f"Steps: {payload['steps']} (+ {payload['hr_second_pass_steps']} hires)")
    print(f"CFG Scale: {payload['cfg_scale']}")
    print(f"Upscaler: {payload['hr_upscaler']}")
    print("")
    
    try:
        async with httpx.AsyncClient(timeout=300, auth=(api_key.split(':')[0], api_key.split(':')[1])) as client:
            # Check if API is running
            try:
                health = await client.get(f"{api_url}/sdapi/v1/options")
                health.raise_for_status()
            except:
                print("❌ Error: Stable Diffusion WebUI is not running!")
                print("Please start it with: cd stable-diffusion-webui && ./webui-mac.sh")
                return
            
            # Send generation request
            print("Generating image... (this may take 30-60 seconds)")
            response = await client.post(
                f"{api_url}/sdapi/v1/txt2img",
                json=payload
            )
            response.raise_for_status()
            
            result = response.json()
            images = result.get('images', [])
            
            if images:
                # Save the image
                output_dir = Path("../test_outputs")
                output_dir.mkdir(exist_ok=True)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"test_optimal_settings_{timestamp}.png"
                filepath = output_dir / filename
                
                img_data = base64.b64decode(images[0])
                with open(filepath, 'wb') as f:
                    f.write(img_data)
                
                print(f"✅ Success! Image saved to: {filepath}")
                print("")
                print("Image Quality Checklist:")
                print("- [ ] Natural skin texture (not plastic)")
                print("- [ ] Proper anatomy and proportions")
                print("- [ ] Good detail level (hair, eyes, fabric)")
                print("- [ ] Natural colors (not oversaturated)")
                print("- [ ] Sharp focus without artifacts")
                print("- [ ] Realistic lighting and shadows")
                
                # Extract generation info
                if 'info' in result:
                    info = json.loads(result['info'])
                    print(f"\nGeneration time: ~{info.get('job_timestamp', 'unknown')}s")
                
            else:
                print("❌ No images returned")
                
    except httpx.HTTPError as e:
        print(f"❌ HTTP Error: {e}")
        print("Make sure Stable Diffusion WebUI is running with --api flag")
    except Exception as e:
        print(f"❌ Error: {e}")

async def test_upscalers():
    """List available upscalers"""
    api_url = "http://localhost:7860"
    api_key = "voting-app:ZE2lAuCNIrDTP/v8lECNWliFNnRYeFXJos+TDc8z7+k="
    
    try:
        async with httpx.AsyncClient(timeout=10, auth=(api_key.split(':')[0], api_key.split(':')[1])) as client:
            response = await client.get(f"{api_url}/sdapi/v1/upscalers")
            response.raise_for_status()
            
            upscalers = response.json()
            print("\nAvailable Upscalers:")
            for upscaler in upscalers:
                name = upscaler.get('name', 'Unknown')
                if any(x in name.lower() for x in ['esrgan', 'ultrasharp', 'nmkd', 'real']):
                    print(f"  ✓ {name}")
                else:
                    print(f"    {name}")
                    
    except Exception as e:
        print(f"Could not fetch upscaler list: {e}")

if __name__ == "__main__":
    print("=== Stable Diffusion Optimal Settings Test ===\n")
    asyncio.run(test_generation())
    asyncio.run(test_upscalers())