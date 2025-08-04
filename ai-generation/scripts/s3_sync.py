"""
S3 synchronization for images and models
"""

import boto3
import os
from pathlib import Path
import json
from datetime import datetime
import hashlib
from typing import Dict, Optional
from botocore.exceptions import NoCredentialsError
import asyncio
import aiofiles

class S3Uploader:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            region_name=os.getenv('AWS_REGION', 'ap-southeast-2'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )
        self.images_bucket = os.getenv('S3_BUCKET_IMAGES', 'voting-app-ai-images')
        self.models_bucket = os.getenv('S3_BUCKET_MODELS', 'voting-app-ai-models')
    
    async def upload_file(self, file_path: str, s3_key: str, metadata: Dict[str, str] = None) -> str:
        """Upload a file to S3 with metadata"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Determine bucket based on file type
        if s3_key.startswith('models/'):
            bucket = self.models_bucket
        else:
            bucket = self.images_bucket
        
        # Add file hash to metadata
        file_hash = await self._calculate_file_hash(file_path)
        
        upload_metadata = {
            'file_hash': file_hash,
            'upload_timestamp': datetime.utcnow().isoformat(),
            'original_filename': file_path.name
        }
        
        if metadata:
            upload_metadata.update(metadata)
        
        try:
            # Read file
            async with aiofiles.open(file_path, 'rb') as f:
                file_data = await f.read()
            
            # Upload to S3
            self.s3_client.put_object(
                Bucket=bucket,
                Key=s3_key,
                Body=file_data,
                ContentType=self._get_content_type(file_path),
                Metadata=upload_metadata
            )
            
            # Return S3 URL
            return f"s3://{bucket}/{s3_key}"
            
        except NoCredentialsError:
            raise Exception("AWS credentials not configured")
        except Exception as e:
            raise Exception(f"S3 upload failed: {e}")
    
    async def upload_directory(self, local_dir: str, s3_prefix: str) -> list:
        """Upload entire directory to S3"""
        local_dir = Path(local_dir)
        uploaded_files = []
        
        for file_path in local_dir.rglob('*'):
            if file_path.is_file():
                # Calculate relative path
                relative_path = file_path.relative_to(local_dir)
                s3_key = f"{s3_prefix}/{relative_path}"
                
                try:
                    url = await self.upload_file(str(file_path), s3_key)
                    uploaded_files.append({
                        'local_path': str(file_path),
                        's3_url': url,
                        's3_key': s3_key
                    })
                    print(f"  ✓ Uploaded: {relative_path}")
                except Exception as e:
                    print(f"  ✗ Failed to upload {relative_path}: {e}")
        
        return uploaded_files
    
    async def sync_character_data(self, character_id: str):
        """Sync all data for a character to S3"""
        sync_results = {
            'character_id': character_id,
            'timestamp': datetime.utcnow().isoformat(),
            'training_data': [],
            'lora_model': None,
            'final_images': [],
            'metadata': []
        }
        
        # Sync training data
        training_dir = Path(f"../models/training_data/{character_id}")
        if training_dir.exists():
            print(f"Syncing training data for {character_id}...")
            sync_results['training_data'] = await self.upload_directory(
                training_dir,
                f"training_data/{character_id}"
            )
        
        # Sync LoRA model
        lora_path = Path(f"../models/loras/{character_id}_lora/{character_id}_lora.safetensors")
        if lora_path.exists():
            print(f"Syncing LoRA model for {character_id}...")
            url = await self.upload_file(
                str(lora_path),
                f"models/loras/{character_id}_lora.safetensors",
                metadata={'character_id': character_id, 'type': 'lora_model'}
            )
            sync_results['lora_model'] = url
        
        # Sync final images
        final_dir = Path(f"../models/final_images/{character_id}")
        if final_dir.exists():
            print(f"Syncing final images for {character_id}...")
            sync_results['final_images'] = await self.upload_directory(
                final_dir,
                f"generated/{character_id}"
            )
        
        # Save sync record
        record_path = Path(f"../models/sync_records/{character_id}_sync.json")
        record_path.parent.mkdir(exist_ok=True)
        
        with open(record_path, 'w') as f:
            json.dump(sync_results, f, indent=2)
        
        print(f"\nSync complete for {character_id}:")
        print(f"  - Training data: {len(sync_results['training_data'])} files")
        print(f"  - LoRA model: {'✓' if sync_results['lora_model'] else '✗'}")
        print(f"  - Final images: {len(sync_results['final_images'])} files")
        
        return sync_results
    
    async def download_lora(self, character_id: str, dest_dir: str = None):
        """Download LoRA model from S3"""
        if not dest_dir:
            dest_dir = Path("~/stable-diffusion-webui/models/Lora").expanduser()
        else:
            dest_dir = Path(dest_dir)
        
        dest_dir.mkdir(parents=True, exist_ok=True)
        
        s3_key = f"models/loras/{character_id}_lora.safetensors"
        dest_path = dest_dir / f"{character_id}_lora.safetensors"
        
        try:
            print(f"Downloading LoRA for {character_id}...")
            self.s3_client.download_file(
                self.models_bucket,
                s3_key,
                str(dest_path)
            )
            print(f"  ✓ Downloaded to: {dest_path}")
            return str(dest_path)
        except Exception as e:
            print(f"  ✗ Download failed: {e}")
            return None
    
    def list_character_files(self, character_id: str):
        """List all S3 files for a character"""
        files = {
            'training_data': [],
            'lora_models': [],
            'generated_images': []
        }
        
        # List training data
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.images_bucket,
                Prefix=f"training_data/{character_id}/"
            )
            if 'Contents' in response:
                files['training_data'] = [obj['Key'] for obj in response['Contents']]
        except:
            pass
        
        # List LoRA models
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.models_bucket,
                Prefix=f"models/loras/{character_id}"
            )
            if 'Contents' in response:
                files['lora_models'] = [obj['Key'] for obj in response['Contents']]
        except:
            pass
        
        # List generated images
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.images_bucket,
                Prefix=f"generated/{character_id}/"
            )
            if 'Contents' in response:
                files['generated_images'] = [obj['Key'] for obj in response['Contents']]
        except:
            pass
        
        return files
    
    async def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        
        async with aiofiles.open(file_path, "rb") as f:
            while chunk := await f.read(8192):
                sha256_hash.update(chunk)
        
        return sha256_hash.hexdigest()
    
    def _get_content_type(self, file_path: Path) -> str:
        """Get content type based on file extension"""
        ext = file_path.suffix.lower()
        content_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.safetensors': 'application/octet-stream',
            '.json': 'application/json',
            '.txt': 'text/plain'
        }
        return content_types.get(ext, 'application/octet-stream')

# CLI usage
async def main():
    import argparse
    parser = argparse.ArgumentParser(description="S3 sync utilities")
    parser.add_argument('action', choices=['sync', 'download', 'list'])
    parser.add_argument('character_id', help='Character ID')
    parser.add_argument('--dest-dir', help='Destination directory for downloads')
    
    args = parser.parse_args()
    
    uploader = S3Uploader()
    
    if args.action == 'sync':
        await uploader.sync_character_data(args.character_id)
    elif args.action == 'download':
        await uploader.download_lora(args.character_id, args.dest_dir)
    elif args.action == 'list':
        files = uploader.list_character_files(args.character_id)
        print(f"\nS3 files for {args.character_id}:")
        for category, file_list in files.items():
            print(f"\n{category}:")
            for f in file_list:
                print(f"  - {f}")

if __name__ == "__main__":
    asyncio.run(main())