import { useState, useEffect } from 'react';
import { removeBackground, loadImageFromUrl } from '../utils/backgroundRemoval';
import Button from './ui/Button';

interface BackgroundRemoverProps {
  imageUrl: string;
  onProcessed?: (processedImageUrl: string) => void;
}

export default function BackgroundRemover({ imageUrl, onProcessed }: BackgroundRemoverProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      console.log('Loading image from URL:', imageUrl);
      const imageElement = await loadImageFromUrl(imageUrl);
      
      console.log('Removing background...');
      const processedBlob = await removeBackground(imageElement);
      
      const processedUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(processedUrl);
      
      if (onProcessed) {
        onProcessed(processedUrl);
      }
      
      console.log('Background removal completed successfully!');
    } catch (err) {
      console.error('Error processing image:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Auto-process when component mounts
    processImage();
  }, [imageUrl]);

  return (
    <div className="space-y-4 p-6 border border-border rounded-lg bg-card">
      <h3 className="text-lg font-semibold text-foreground">Background Removal</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Image */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Original</h4>
          <img 
            src={imageUrl} 
            alt="Original" 
            className="w-full h-48 object-contain border border-border rounded"
          />
        </div>
        
        {/* Processed Image */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Processed</h4>
          <div className="w-full h-48 border border-border rounded flex items-center justify-center bg-gray-100">
            {isProcessing ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Removing background...</p>
              </div>
            ) : processedImageUrl ? (
              <img 
                src={processedImageUrl} 
                alt="Background removed" 
                className="w-full h-full object-contain"
              />
            ) : error ? (
              <div className="text-center text-red-500">
                <p className="text-sm">Error: {error}</p>
                <Button 
                  onClick={processImage} 
                  size="sm" 
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Processed image will appear here</p>
            )}
          </div>
        </div>
      </div>
      
      {processedImageUrl && (
        <div className="space-y-2">
          <Button 
            onClick={() => {
              const link = document.createElement('a');
              link.href = processedImageUrl;
              link.download = 'background-removed.png';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="w-full"
          >
            Download Processed Image
          </Button>
        </div>
      )}
    </div>
  );
}