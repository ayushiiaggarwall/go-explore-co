import { useState } from 'react';
import { useParallelUniverseStore } from '../../hooks/useParallelUniverseStore';
import Button from '../ui/Button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { ArrowLeft, Heart, DollarSign, Clock } from 'lucide-react';

interface QuestionnaireStepProps {
  onNext: () => void;
  onBack: () => void;
}

const INTERESTS = [
  { id: 'food', label: 'Food & Culinary', icon: '🍽️' },
  { id: 'nightlife', label: 'Nightlife & Entertainment', icon: '🌃' },
  { id: 'culture', label: 'Culture & History', icon: '🏛️' },
  { id: 'adventure', label: 'Adventure & Sports', icon: '🏔️' },
  { id: 'shopping', label: 'Shopping & Fashion', icon: '🛍️' },
  { id: 'wellness', label: 'Wellness & Relaxation', icon: '🧘' },
  { id: 'art', label: 'Art & Museums', icon: '🎨' },
  { id: 'nature', label: 'Nature & Wildlife', icon: '🌿' },
  { id: 'history', label: 'Historical Sites', icon: '⚱️' }
];

const BUDGET_OPTIONS = [
  { id: 'shoestring', label: 'Shoestring', description: 'Budget-conscious, local experiences' },
  { id: 'modest', label: 'Modest', description: 'Comfortable with some splurges' },
  { id: 'comfortable', label: 'Comfortable', description: 'Mid-range options, good value' },
  { id: 'luxury', label: 'Luxury', description: 'Premium experiences, no budget limits' }
];

export default function QuestionnaireStep({ onNext, onBack }: QuestionnaireStepProps) {
  const { questionnaireData, setQuestionnaireData } = useParallelUniverseStore();
  
  const [interests, setInterests] = useState<string[]>(questionnaireData?.interests || []);
  const [budget, setBudget] = useState<string>(questionnaireData?.budget || '');
  const [anonymityIdea, setAnonymityIdea] = useState(questionnaireData?.anonymityIdea || '');
  const [energy, setEnergy] = useState(questionnaireData?.energy || 5);
  const [timeWindows, setTimeWindows] = useState(questionnaireData?.timeWindows || {
    morning: true,
    afternoon: true,
    evening: true
  });
  const [dietary, setDietary] = useState(questionnaireData?.dietary || '');
  const [mobility, setMobility] = useState(questionnaireData?.mobility || '');
  const [primaryCity, setPrimaryCity] = useState(questionnaireData?.primaryCity || '');

  const handleInterestToggle = (interestId: string) => {
    setInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleTimeWindowChange = (window: keyof typeof timeWindows) => {
    setTimeWindows(prev => ({
      ...prev,
      [window]: !prev[window]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interests.length > 0 && budget && anonymityIdea.length >= 20) {
      setQuestionnaireData({
        interests,
        budget: budget as any,
        anonymityIdea,
        energy,
        timeWindows,
        dietary: dietary || undefined,
        mobility: mobility || undefined,
        primaryCity: primaryCity || undefined
      });
      onNext();
    }
  };

  const canProceed = interests.length > 0 && budget && anonymityIdea.length >= 20;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Interests */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            What interests you most?
          </h3>
          <p className="text-muted-foreground text-sm mb-4">Select all that apply</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {INTERESTS.map((interest) => (
              <button
                key={interest.id}
                type="button"
                onClick={() => handleInterestToggle(interest.id)}
                className={`p-4 rounded-lg border transition-all text-left ${
                  interests.includes(interest.id)
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-lg mb-1">{interest.icon}</div>
                <div className="text-sm font-medium">{interest.label}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Budget */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            What's your budget style?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {BUDGET_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setBudget(option.id)}
                className={`p-4 rounded-lg border transition-all text-left ${
                  budget === option.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium mb-1">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Anonymity Question */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            If nobody knew you, what would you do differently?
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Be honest and specific. This helps us understand your true desires.
          </p>
          <Textarea
            value={anonymityIdea}
            onChange={(e) => setAnonymityIdea(e.target.value)}
            placeholder="When I'm completely anonymous, I would..."
            className="min-h-24"
            minLength={20}
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground mt-2">
            {anonymityIdea.length}/500 characters (minimum 20)
          </div>
        </Card>

        {/* Energy Level */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Energy Level
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            How active do you want to be? (1 = relaxed, 10 = non-stop adventure)
          </p>
          <div className="space-y-4">
            <Slider
              value={[energy]}
              onValueChange={(value) => setEnergy(value[0])}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Relaxed (1)</span>
              <span className="font-medium">Current: {energy}</span>
              <span>High Energy (10)</span>
            </div>
          </div>
        </Card>

        {/* Time Windows */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">When do you prefer to be active?</h3>
          <div className="space-y-3">
            {Object.entries(timeWindows).map(([window, checked]) => (
              <div key={window} className="flex items-center space-x-2">
                <Checkbox
                  id={window}
                  checked={checked}
                  onCheckedChange={() => handleTimeWindowChange(window as keyof typeof timeWindows)}
                />
                <label htmlFor={window} className="text-sm font-medium capitalize">
                  {window}
                </label>
              </div>
            ))}
          </div>
        </Card>

        {/* Optional Details */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Optional Details</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="primary-city" className="block text-sm font-medium mb-2">
                Primary destination city (if known)
              </label>
              <Input
                id="primary-city"
                value={primaryCity}
                onChange={(e) => setPrimaryCity(e.target.value)}
                placeholder="e.g., Tokyo, Paris, New York..."
              />
            </div>
            
            <div>
              <label htmlFor="dietary" className="block text-sm font-medium mb-2">
                Dietary restrictions or preferences
              </label>
              <Input
                id="dietary"
                value={dietary}
                onChange={(e) => setDietary(e.target.value)}
                placeholder="e.g., vegetarian, halal, gluten-free..."
              />
            </div>
            
            <div>
              <label htmlFor="mobility" className="block text-sm font-medium mb-2">
                Mobility considerations
              </label>
              <Input
                id="mobility"
                value={mobility}
                onChange={(e) => setMobility(e.target.value)}
                placeholder="e.g., wheelchair accessible, limited walking..."
              />
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" disabled={!canProceed} className="px-8">
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}