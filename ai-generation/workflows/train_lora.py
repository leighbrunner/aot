"""
LoRA training workflow for character models
Uses Kohya_ss scripts for training
"""

import os
import json
import subprocess
from pathlib import Path
from datetime import datetime
import shutil
from typing import Dict, Optional

class LoRATrainer:
    def __init__(self, kohya_path: str = None):
        self.kohya_path = kohya_path or os.path.expanduser("~/kohya_ss")
        self.base_model_path = os.path.expanduser("~/stable-diffusion-webui/models/Stable-diffusion/RealVisXL_V5.0_BakedVAE.safetensors")
        self.output_dir = Path("../models/loras")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Training parameters optimized for SDXL and Mac
        self.default_params = {
            "pretrained_model_name_or_path": self.base_model_path,
            "learning_rate": "1e-5",
            "lr_scheduler": "cosine",
            "lr_warmup_steps": "100",
            "train_batch_size": "1",
            "max_train_steps": "2000",
            "save_every_n_epochs": "5",
            "mixed_precision": "fp16",
            "save_precision": "fp16",
            "network_module": "networks.lora",
            "network_dim": "64",  # Increased for SDXL
            "network_alpha": "32",  # Increased for SDXL
            "optimizer_type": "AdamW8bit",
            "max_data_loader_n_workers": "0",
            "persistent_data_loader_workers": "False",
            "gradient_checkpointing": "True",
            "gradient_accumulation_steps": "1",
            "mem_eff_attn": "True",
            "caption_extension": ".txt",
            "resolution": "1024,1024",  # SDXL native resolution
            "cache_latents": "True",
            "enable_bucket": "True",
            "min_bucket_reso": "768",  # Higher for SDXL
            "max_bucket_reso": "1536",  # Higher for SDXL
            "bucket_reso_steps": "64",
            # VAE is baked into the model, no separate VAE needed
        }
    
    def prepare_training_data(self, character_id: str) -> Optional[str]:
        """Prepare training data for LoRA training"""
        training_data_dir = Path(f"../models/training_data/{character_id}")
        
        if not training_data_dir.exists():
            print(f"Training data not found for {character_id}")
            return None
        
        # Create training directory structure
        train_dir = Path(f"../models/training_prepared/{character_id}")
        train_dir.mkdir(parents=True, exist_ok=True)
        
        # Create image directory with repeats prefix
        img_dir = train_dir / "10_character"  # 10 repeats per image
        img_dir.mkdir(exist_ok=True)
        
        # Copy images and create captions
        image_count = 0
        for img_path in training_data_dir.glob("*_training_*.png"):
            if "_meta.json" not in str(img_path):
                # Copy image
                dest_path = img_dir / img_path.name
                shutil.copy2(img_path, dest_path)
                
                # Create caption file
                caption = f"a photo of {character_id.replace('_', ' ')}, detailed anatomy"
                caption_path = dest_path.with_suffix('.txt')
                with open(caption_path, 'w') as f:
                    f.write(caption)
                
                image_count += 1
        
        print(f"Prepared {image_count} images for training")
        
        if image_count < 5:
            print(f"Warning: Only {image_count} images found. Minimum 5 recommended.")
        
        return str(train_dir)
    
    def create_training_script(self, character_id: str, train_dir: str) -> str:
        """Create training script for character"""
        script_path = Path(f"../models/training_scripts/{character_id}_train.sh")
        script_path.parent.mkdir(exist_ok=True)
        
        output_name = f"{character_id}_lora"
        output_path = self.output_dir / output_name
        
        # Create accelerate config for Mac
        accelerate_config = f"""compute_environment: LOCAL_MACHINE
deepspeed_config: {{}}
distributed_type: 'NO'
downcast_bf16: 'no'
fsdp_config: {{}}
gpu_ids: all
machine_rank: 0
main_process_ip: null
main_process_port: null
main_training_function: main
mixed_precision: fp16
num_machines: 1
num_processes: 1
use_cpu: false"""
        
        config_path = Path(f"../models/training_scripts/{character_id}_accelerate.yaml")
        with open(config_path, 'w') as f:
            f.write(accelerate_config)
        
        # Build training command
        script_content = f"""#!/bin/bash
# LoRA training script for {character_id}
# Generated on {datetime.utcnow().isoformat()}

cd {self.kohya_path}
source venv/bin/activate

export PYTORCH_ENABLE_MPS_FALLBACK=1
export ACCELERATE_CONFIG_FILE={os.path.abspath(config_path)}

accelerate launch --config_file {os.path.abspath(config_path)} \\
    train_network.py \\
    --pretrained_model_name_or_path="{self.default_params['pretrained_model_name_or_path']}" \\
    --train_data_dir="{os.path.abspath(train_dir)}" \\
    --output_dir="{os.path.abspath(output_path)}" \\
    --output_name="{output_name}" \\
    --learning_rate={self.default_params['learning_rate']} \\
    --lr_scheduler={self.default_params['lr_scheduler']} \\
    --lr_warmup_steps={self.default_params['lr_warmup_steps']} \\
    --train_batch_size={self.default_params['train_batch_size']} \\
    --max_train_steps={self.default_params['max_train_steps']} \\
    --save_every_n_epochs={self.default_params['save_every_n_epochs']} \\
    --mixed_precision={self.default_params['mixed_precision']} \\
    --save_precision={self.default_params['save_precision']} \\
    --network_module={self.default_params['network_module']} \\
    --network_dim={self.default_params['network_dim']} \\
    --network_alpha={self.default_params['network_alpha']} \\
    --optimizer_type={self.default_params['optimizer_type']} \\
    --caption_extension={self.default_params['caption_extension']} \\
    --resolution={self.default_params['resolution']} \\
    --cache_latents \\
    --enable_bucket \\
    --min_bucket_reso={self.default_params['min_bucket_reso']} \\
    --max_bucket_reso={self.default_params['max_bucket_reso']} \\
    --bucket_reso_steps={self.default_params['bucket_reso_steps']} \\
    --gradient_checkpointing \\
    --mem_eff_attn \\
    --logging_dir="{os.path.abspath(output_path)}/logs" \\
    --log_prefix={character_id} \\
    --save_model_as=safetensors

echo "Training complete for {character_id}"
"""
        
        with open(script_path, 'w') as f:
            f.write(script_content)
        
        # Make executable
        os.chmod(script_path, 0o755)
        
        return str(script_path)
    
    def train_character(self, character_id: str, auto_run: bool = False) -> Dict:
        """Train LoRA for a character"""
        print(f"\nPreparing LoRA training for {character_id}...")
        
        # Prepare data
        train_dir = self.prepare_training_data(character_id)
        if not train_dir:
            return {
                'status': 'failed',
                'error': 'No training data found'
            }
        
        # Create training script
        script_path = self.create_training_script(character_id, train_dir)
        
        result = {
            'character_id': character_id,
            'train_dir': train_dir,
            'script_path': script_path,
            'output_dir': str(self.output_dir / f"{character_id}_lora"),
            'status': 'prepared'
        }
        
        if auto_run:
            print(f"Starting training for {character_id}...")
            try:
                # Run training
                process = subprocess.run(
                    ['bash', script_path],
                    capture_output=True,
                    text=True
                )
                
                if process.returncode == 0:
                    result['status'] = 'completed'
                    result['output'] = process.stdout
                    
                    # Copy final LoRA to WebUI models
                    lora_files = list(Path(result['output_dir']).glob("*.safetensors"))
                    if lora_files:
                        webui_lora_dir = Path("~/stable-diffusion-webui/models/Lora").expanduser()
                        webui_lora_dir.mkdir(exist_ok=True)
                        
                        for lora_file in lora_files:
                            dest = webui_lora_dir / f"{character_id}_lora.safetensors"
                            shutil.copy2(lora_file, dest)
                            result['lora_path'] = str(dest)
                            print(f"LoRA saved to: {dest}")
                else:
                    result['status'] = 'failed'
                    result['error'] = process.stderr
                    
            except Exception as e:
                result['status'] = 'failed'
                result['error'] = str(e)
        else:
            print(f"\nTraining script created: {script_path}")
            print("To start training, run:")
            print(f"  bash {script_path}")
        
        # Save training record
        record_path = self.output_dir / f"{character_id}_training_record.json"
        with open(record_path, 'w') as f:
            json.dump(result, f, indent=2)
        
        return result

# CLI usage
def main():
    import argparse
    parser = argparse.ArgumentParser(description="Train LoRA models for characters")
    parser.add_argument('character_id', help='Character ID to train')
    parser.add_argument('--kohya-path', help='Path to kohya_ss installation')
    parser.add_argument('--auto-run', action='store_true', help='Automatically run training')
    
    args = parser.parse_args()
    
    trainer = LoRATrainer(kohya_path=args.kohya_path)
    result = trainer.train_character(args.character_id, auto_run=args.auto_run)
    
    print(f"\nTraining result: {result['status']}")
    if result['status'] == 'failed':
        print(f"Error: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()