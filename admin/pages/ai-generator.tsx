import React, { useState } from 'react'
import { 
  Box, Typography, Paper, TextField, Button, 
  FormControl, InputLabel, Select, MenuItem, 
  Slider, Alert, Grid, Card, CardMedia,
  CircularProgress, Chip, Stack
} from '@mui/material'
import { SmartToy, CloudUpload } from '@mui/icons-material'
import { useMutation, useQuery } from '@tanstack/react-query'
import { adminApi } from '@/services/api'

export default function AIGeneratorPage() {
  const [characterName, setCharacterName] = useState('')
  const [count, setCount] = useState(5)
  const [categories, setCategories] = useState<string[]>(['general'])
  const [generatedImages, setGeneratedImages] = useState<any[]>([])
  const [error, setError] = useState('')

  const { data: generationHistory } = useQuery({
    queryKey: ['generation-history'],
    queryFn: () => adminApi.getGenerationHistory(),
  })

  const generateMutation = useMutation({
    mutationFn: adminApi.generateImages,
    onSuccess: (data) => {
      setGeneratedImages(data.images || [])
      setError('')
      // Reset form
      setCharacterName('')
      setCount(5)
      setCategories(['general'])
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to generate images')
      setGeneratedImages([])
    },
  })

  const handleGenerate = () => {
    if (!characterName) {
      setError('Character name is required')
      return
    }

    generateMutation.mutate({
      characterName,
      count,
      categories,
    })
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        AI Image Generator
      </Typography>

      <Grid container spacing={3}>
        {/* Generation Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generate New Images
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Character Name"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                fullWidth
                required
                helperText="Name or description of the character to generate"
              />

              <FormControl fullWidth>
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  value={categories}
                  onChange={(e) => setCategories(e.target.value as string[])}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="full-body">Full Body</MenuItem>
                  <MenuItem value="action">Action</MenuItem>
                  <MenuItem value="casual">Casual</MenuItem>
                  <MenuItem value="formal">Formal</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography gutterBottom>Number of Images: {count}</Typography>
                <Slider
                  value={count}
                  onChange={(e, value) => setCount(value as number)}
                  min={1}
                  max={20}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={generateMutation.isPending ? <CircularProgress size={20} /> : <SmartToy />}
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !characterName}
                fullWidth
              >
                {generateMutation.isPending ? 'Generating...' : 'Generate Images'}
              </Button>
            </Box>
          </Paper>

          {/* Generation Tips */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generation Tips
            </Typography>
            <Typography variant="body2" paragraph>
              • Use descriptive character names for better results
            </Typography>
            <Typography variant="body2" paragraph>
              • Generated images will appear in the pending approval queue
            </Typography>
            <Typography variant="body2" paragraph>
              • Each generation costs approximately $0.01 per image
            </Typography>
            <Typography variant="body2">
              • Avoid generating explicit or inappropriate content
            </Typography>
          </Paper>
        </Grid>

        {/* Recent Generations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Generations
            </Typography>
            
            {generatedImages.length > 0 ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  Successfully generated {generatedImages.length} images!
                </Alert>
                <Grid container spacing={2}>
                  {generatedImages.map((image, index) => (
                    <Grid item xs={6} key={index}>
                      <Card>
                        <CardMedia
                          component="img"
                          height="150"
                          image={image.thumbnailUrl || image.url}
                          alt={`Generated ${index + 1}`}
                        />
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ) : (
              <Stack spacing={2}>
                {generationHistory?.items?.slice(0, 5).map((generation: any) => (
                  <Box
                    key={generation.id}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="subtitle2">
                      {generation.characterName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {generation.count} images • {new Date(generation.createdAt).toLocaleString()}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {generation.categories.map((cat: string) => (
                        <Chip key={cat} label={cat} size="small" />
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}