# Character Creation Guidelines

## Character Distribution

Total: 40 characters
- 15 Caucasian-inspired (Groups 1, 7, 8)
- 5 Asian-inspired (Group 2)
- 5 Latina-inspired (Group 3)
- 5 African-inspired (Group 4)
- 5 Mixed/European (Group 5)
- 5 Middle Eastern (Group 6)

## Character Attributes

Each character has:
- **Name**: Realistic first and last name
- **Ethnicity**: Primary ethnic background
- **Age Range**: 18-22, 23-26, or 27-30
- **Hair**: Color and style
- **Body Type**: petite, slim, athletic, curvy, hourglass
- **Breast Size**: small, medium, large
- **Ass Size**: small, medium, large
- **Personality**: 3 traits for future prompt variations
- **Distinctive Features**: 2 unique visual markers

## Training Data Requirements

### Base Images (5-10 per character)
1. **Frontal view** - neutral standing pose
2. **Side profile** - standing straight
3. **Back view** - standing relaxed
4. **3/4 angle** - weight on one leg
5. **Sitting** - upright on stool
6. **Lying** - on back, relaxed
7. **Kneeling** - upright torso
8. **Arms raised** - stretching pose
9. **Reclining** - on side
10. **Twist** - looking over shoulder

### Quality Standards
- **Resolution**: 1024x1024
- **Lighting**: Natural, consistent
- **Background**: Simple, non-distracting
- **Focus**: Clear facial features and full body
- **Anatomy**: Accurate proportions
- **Consistency**: Same character across all poses

## Prompt Templates

### Training Prompts
```
photorealistic full-body portrait of a beautiful young woman, 
[age] years old, [ethnicity] ethnicity, [hair] hair, 
[body_type] body type, [breast_size] breasts, [ass_size] ass,
[distinctive_features], nude, detailed anatomy, realistic skin texture, 
[pose_variation], high resolution, natural lighting
```

### Generation Prompts

#### Ass Focus
```
photorealistic young woman, Instagram model aesthetic, [scene],
[ass_pose], emphasizing curvaceous lower body, perfect rounded buttocks,
[clothing], [lighting], [camera_angle], [skin_detail],
high resolution, detailed anatomy, <lora:[character]_lora:1.0>
```

#### Tits Focus
```
photorealistic young woman, Instagram model aesthetic, [scene],
[tits_pose], emphasizing voluptuous upper curves, ample cleavage,
[clothing], [lighting], [camera_angle], [skin_detail],
high resolution, detailed anatomy, <lora:[character]_lora:1.0>
```

## Pose Variations

### Ass Focus Poses
1. Arching back looking over shoulder
2. Bending forward touching toes
3. Side profile hip thrust
4. On all fours looking back
5. Standing twist emphasizing curves
6. Lying on stomach legs up
7. Squatting position
8. Walking away glance back

### Tits Focus Poses
1. Leaning forward arms pressed together
2. Arms above head stretching
3. Lying on back arched
4. Side lying pose
5. Hands behind head elbows out
6. Pressing against glass
7. Emerging from water
8. Adjusting clothing suggestively

## Scene Variety

1. **Poolside** - Lounge chairs, water reflections
2. **Gym** - Equipment, mirrors, athletic setting
3. **Beach** - Sand, ocean, natural lighting
4. **Bedroom** - Intimate, soft lighting
5. **Yoga Studio** - Mirrors, mats, zen atmosphere
6. **Shower** - Steam, water, tiles
7. **Office** - Professional contrast
8. **Forest Trail** - Natural, outdoor
9. **City Rooftop** - Urban, sunset views
10. **Luxury Spa** - Relaxation, towels
11. **Sauna** - Wood, steam, heat
12. **Dance Studio** - Mirrors, bars
13. **Locker Room** - Athletic, benches
14. **Balcony Sunset** - Golden hour, city views
15. **Private Jet** - Luxury, exclusive

## Clothing Options

1. **Micro Bikini** - Minimal coverage
2. **Sports Bra and Shorts** - Athletic
3. **Sheer Lingerie** - Semi-transparent
4. **Wet T-shirt** - Clingy, revealing
5. **Silk Robe** - Partially open
6. **Yoga Pants and Crop Top** - Form-fitting
7. **Bodysuit** - One piece, tight
8. **Mini Dress** - Short, revealing
9. **Nude** - Full anatomy visible

## Quality Control Checklist

### Training Data Review
- [ ] Consistent facial features across all images
- [ ] Proper anatomy and proportions
- [ ] Good variety of poses and angles
- [ ] Clear, well-lit images
- [ ] No artifacts or distortions
- [ ] Matches character description

### Generated Images Review
- [ ] Character consistency with training data
- [ ] Appropriate focus (ass/tits) as specified
- [ ] Scene and clothing match prompt
- [ ] High quality, no artifacts
- [ ] Proper tagging and metadata
- [ ] NSFW content appropriately flagged

## Ethical Guidelines

1. **Age Verification**: All characters explicitly 18+
2. **Consent Simulation**: Fictional characters only
3. **No Real People**: Never use real person's likeness
4. **Content Warnings**: Properly tag NSFW content
5. **Storage Security**: Encrypt sensitive content
6. **Access Control**: Admin-only generation
7. **Legal Compliance**: Follow local laws

## Batch Processing Tips

1. **Group by Ethnicity**: Train similar characters together
2. **Stagger Training**: 5 characters at a time max
3. **Overnight Runs**: Use for LoRA training
4. **Quality First**: Better to have fewer high-quality images
5. **Regular Backups**: S3 sync after each batch

## Common Issues and Solutions

### Inconsistent Features
- **Problem**: Face changes between images
- **Solution**: Add more weight to face in prompts, use face restoration

### Body Proportion Issues
- **Problem**: Unrealistic anatomy
- **Solution**: Use ADetailer extension, adjust prompts

### Clothing Artifacts
- **Problem**: Weird clothing merging
- **Solution**: Simplify clothing descriptions, use reference images

### Lighting Inconsistency
- **Problem**: Different lighting affects skin tone
- **Solution**: Standardize lighting terms, use same seed for batches

### Background Distractions
- **Problem**: Complex backgrounds draw focus
- **Solution**: Use simple backgrounds, add blur in post