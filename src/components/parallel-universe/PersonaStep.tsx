import { useState } from 'react';
import { useParallelUniverseStore } from '../../hooks/useParallelUniverseStore';
import Button from '../ui/Button';
import { Input } from '../ui/input';
import { Dice6, Sparkles } from 'lucide-react';

interface PersonaStepProps {
  onNext: () => void;
}

const EXAMPLE_PERSONAS = [
  "billionaire in Dubai exploring luxury scenes",
  "student in Mumbai exploring the city",
  "retired teacher in Paris discovering hidden gems",
  "digital nomad in Bangkok seeking authentic experiences",
  "artist in Tokyo immersing in creative culture",
  "adventure seeker in Iceland chasing natural wonders"
];

export default function PersonaStep({ onNext }: PersonaStepProps) {
  const { personaData, setPersonaData } = useParallelUniverseStore();
  const [seed, setSeed] = useState(personaData?.seed || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (seed.length >= 10) {
      setPersonaData({ seed });
      onNext();
    }
  };

  const handleSurpriseMe = () => {
    const randomPersona = EXAMPLE_PERSONAS[Math.floor(Math.random() * EXAMPLE_PERSONAS.length)];
    setSeed(randomPersona);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Who Are You in This Parallel Universe?</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Describe the person you become when nobody knows you. Be creative, be bold, be different.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="persona-seed" className="block text-sm font-medium mb-2">
            Your Persona Seed
          </label>
          <Input
            id="persona-seed"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="e.g., mysterious artist in Barcelona seeking inspiration..."
            className="text-base p-4 h-auto"
            minLength={10}
            maxLength={200}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">
              {seed.length}/200 characters (minimum 10)
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSurpriseMe}
              className="text-xs"
            >
              <Dice6 className="w-3 h-3 mr-1" />
              Surprise Me
            </Button>
          </div>
        </div>

        {/* Example chips */}
        <div>
          <p className="text-sm font-medium mb-3">Need inspiration? Try one of these:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {EXAMPLE_PERSONAS.slice(0, 4).map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSeed(example)}
                className="text-left p-3 rounded-lg border border-border hover:border-primary transition-colors text-sm bg-card hover:bg-accent/50"
              >
                "{example}"
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={seed.length < 10}
            className="px-8"
          >
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}