import BackgroundRemover from '../components/BackgroundRemover';

export default function BackgroundRemovalDemo() {
  return (
    <div className="min-h-screen bg-background py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Background Removal</h1>
          <p className="text-muted-foreground">
            Processing your uploaded character image to remove the background
          </p>
        </div>
        
        <BackgroundRemover 
          imageUrl="/lovable-uploads/5ad34a27-8598-48e0-8cf3-8c1c9a183db9.png"
          onProcessed={(processedUrl) => {
            console.log('Processed image URL:', processedUrl);
          }}
        />
      </div>
    </div>
  );
}