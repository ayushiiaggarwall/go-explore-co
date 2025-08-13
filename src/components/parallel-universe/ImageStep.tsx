import { useState, useRef } from 'react';
import { useParallelUniverseStore } from '../../hooks/useParallelUniverseStore';
import { useGenerationCredits } from '../../hooks/useParallelUniverseStore';
import Button from '../ui/Button';
import { Card } from '../ui/card';
import { Camera, Upload, ArrowLeft, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { getDestinationFromPersona } from '../../utils/parseDestination';

interface ImageStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ImageStep({ onNext, onBack }: ImageStepProps) {
  const { 
    generatedImage, 
    setGeneratedImage, 
    personaData, 
    questionnaireData,
    incrementImageGenerations 
  } = useParallelUniverseStore();
  
  const { canGenerateImage, imageCreditsRemaining } = useGenerationCredits();
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 8 * 1024 * 1024) { // 8MB limit
      toast.error('Image must be smaller than 8MB');
      return;
    }

    setUploadedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateParallelUniversePortrait = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!canGenerateImage) {
      toast.error('Image generation limit reached. Try again later.');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Build the prompt based on user data
      const interests = questionnaireData?.interests.join(', ') || '';
      const budget = questionnaireData?.budget || '';
      const energy = questionnaireData?.energy || 5;
      const anonymityIdea = questionnaireData?.anonymityIdea || '';
      
      // Extract destination from persona seed
      const destinationCity = getDestinationFromPersona(personaData?.seed || '', 'Unknown destination');
      
      // Show destination info to user
      console.log('Extracted destination from persona:', destinationCity);

      const prompt = `Create a stylized, human-in-cartoon-form travel portrait using the attached reference image for facial likeness.

Persona:
- Core idea: ${personaData?.seed}
- Destination: ${destinationCity}
- Top interests: ${interests}
- Optional notes: budget=${budget}, energy=${energy}, anonymityIdea="${anonymityIdea}"

Art Direction:
- Style: clean, semi-realistic cartoon (cel-shaded), soft gradients, light outlines; NOT photorealistic
- Pose & crop: centered, 3/4 view, head-and-shoulders to mid-torso, friendly expression
- Wardrobe/props: infer tasteful items that reflect interests & destination (non-branded)
- Background: subtle, iconic cues from the destination (e.g., recognizable skyline/landmarks) without logos or text
- Color & lighting: vibrant but natural; gentle golden-hour vibe

Requirements:
- Preserve the person's key facial structure and skin tone from the reference
- Keep content PG-13, respectful, and culturally sensitive
- No text, watermarks, or brand logos
- Single subject only; no extra people
- Output: 1024×1024 PNG

${uploadedImage ? 'If the reference image is low quality or occluded, approximate respectfully while keeping the same overall vibe and attributes.' : ''}`;

      // Call the edge function to generate image with new API structure
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          personaSeed: personaData?.seed || '',
          destinationCity: destinationCity,
          destinationRegionOrCountry: destinationCity,
          interests: questionnaireData?.interests || [],
          styleNotes: `budget=${budget}, energy=${energy}, anonymityIdea="${anonymityIdea}"`,
          referenceImage: uploadedImage ? await convertFileToBase64(uploadedImage) : undefined
        }
      });

      if (error) {
        console.error('Image generation error:', error);
        toast.error('Failed to generate image. Please try again.');
        return;
      }

      if (data?.imageUrl) {
        setGeneratedImage({
          url: data.imageUrl,
          prompt: prompt
        });
        incrementImageGenerations();
        toast.success('Parallel Universe portrait generated!');
      } else {
        toast.error('No image was generated. Please try again.');
      }

    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (generatedImage) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Camera className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Create Your Parallel Universe Portrait</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Generate an AI portrait of yourself in this alternate reality. You can optionally upload a reference photo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Reference Image Upload */}
        <Card className="p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Reference Photo (Optional)
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a photo to help the AI understand your facial features (PNG/JPG, max 8MB)
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploadedImage ? 'Change Photo' : 'Upload Photo'}
            </Button>
            
            {uploadPreview && (
              <div className="flex justify-center">
                <img
                  src={uploadPreview}
                  alt="Upload preview"
                  className="max-w-xs max-h-64 rounded-lg border"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Generate Button */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h4 className="font-medium">Generate Your Portrait</h4>
            <p className="text-sm text-muted-foreground">
              Credits remaining: {imageCreditsRemaining}/10 per hour
            </p>
            
            <Button
              type="button"
              onClick={generateParallelUniversePortrait}
              disabled={!canGenerateImage || isGenerating}
              className="w-full max-w-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Portrait...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Parallel Universe Portrait
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Generated Image */}
        {generatedImage && (
          <Card className="p-6">
            <h4 className="font-medium mb-4 text-center">Your Parallel Universe Portrait</h4>
            <div className="flex justify-center mb-4">
              <img
                src={generatedImage.url}
                alt="Generated parallel universe portrait"
                className="max-w-md w-full rounded-lg shadow-lg border"
                onError={(e) => {
                  console.error('Image failed to load:', generatedImage.url);
                  e.currentTarget.style.display = 'none';
                }}
                onLoad={() => {
                  console.log('Image loaded successfully');
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center bg-muted p-3 rounded">
              <strong>Prompt used:</strong> {generatedImage.prompt.substring(0, 200)}...
            </p>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" disabled={!generatedImage} className="px-8">
            Continue to Itinerary
          </Button>
        </div>
      </form>
    </div>
  );
}