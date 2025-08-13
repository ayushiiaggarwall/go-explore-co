import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Progress } from '../components/ui/progress';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/card';
import { Sparkles, ArrowLeft } from 'lucide-react';
import PersonaStep from '../components/parallel-universe/PersonaStep';
import QuestionnaireStep from '../components/parallel-universe/QuestionnaireStep';
import DatesStep from '../components/parallel-universe/DatesStep';
import ImageStep from '../components/parallel-universe/ImageStep';
import ItineraryStep from '../components/parallel-universe/ItineraryStep';
import { useParallelUniverseStore } from '../hooks/useParallelUniverseStore';

const STEPS = [
  { id: 'persona', title: 'Persona Seed', description: 'Define your travel persona' },
  { id: 'questions', title: 'Questionnaire', description: 'Tell us about your preferences' },
  { id: 'dates', title: 'Travel Dates', description: 'When are you traveling?' },
  { id: 'image', title: 'Portrait', description: 'Create your parallel universe image' },
  { id: 'itinerary', title: 'Itinerary', description: 'Get your personalized plan' }
];

export default function ParallelUniverse() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const isInlineMode = mode === 'inline';
  
  const { 
    currentStep, 
    setCurrentStep, 
    personaSummary,
    resetStore 
  } = useParallelUniverseStore();

  

  useEffect(() => {
    // Reset store when component mounts
    return () => {
      // Optionally reset on unmount if needed
    };
  }, []);

  const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  const handleReset = () => {
    resetStore();
    setCurrentStep('persona');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'persona':
        return <PersonaStep onNext={handleNext} />;
      case 'questions':
        return <QuestionnaireStep onNext={handleNext} onBack={handleBack} />;
      case 'dates':
        return <DatesStep onNext={handleNext} onBack={handleBack} />;
      case 'image':
        return <ImageStep onNext={handleNext} onBack={handleBack} />;
      case 'itinerary':
        return <ItineraryStep onBack={handleBack} onReset={handleReset} />;
      default:
        return <PersonaStep onNext={handleNext} />;
    }
  };

  if (isInlineMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Parallel Universe
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Step into your alternate reality and discover how you would travel if you were someone completely different.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <Card className="p-6">
                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Step {currentStepIndex + 1} of {STEPS.length}
                    </span>
                    <span className="text-sm font-medium text-muted-foreground">
                      {Math.round(progress)}% Complete
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="mt-2">
                    <h2 className="text-xl font-semibold">{STEPS[currentStepIndex].title}</h2>
                    <p className="text-muted-foreground text-sm">{STEPS[currentStepIndex].description}</p>
                  </div>
                </div>

                {/* Step Content */}
                {renderStep()}
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {personaSummary && (
                <Card className="p-6 sticky top-24">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Your Persona
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Seed:</span>
                      <p className="mt-1">{personaSummary.seed}</p>
                    </div>
                    
                    {personaSummary.interests.length > 0 && (
                      <div>
                        <span className="font-medium text-muted-foreground">Interests:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {personaSummary.interests.map((interest, idx) => (
                            <span key={idx} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {personaSummary.budget && (
                      <div>
                        <span className="font-medium text-muted-foreground">Budget:</span>
                        <p className="mt-1 capitalize">{personaSummary.budget}</p>
                      </div>
                    )}

                    {personaSummary.dates && (
                      <div>
                        <span className="font-medium text-muted-foreground">Dates:</span>
                        <p className="mt-1">{personaSummary.dates}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Parallel Universe
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Step into your alternate reality and discover how you would travel if you were someone completely different.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStepIndex + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">{STEPS[currentStepIndex].title}</h2>
            <p className="text-muted-foreground">{STEPS[currentStepIndex].description}</p>
          </div>
          
          {renderStep()}
        </Card>
      </div>
    </div>
  );
}