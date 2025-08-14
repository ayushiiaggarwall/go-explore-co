import { useState } from 'react';
import { useParallelUniverseStore } from '../../hooks/useParallelUniverseStore';
import { useGenerationCredits } from '../../hooks/useParallelUniverseStore';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { MapPin, ArrowLeft, Sparkles, RefreshCw, Download, RotateCcw, Clock, DollarSign } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { getDestinationFromPersona } from '../../utils/parseDestination';

interface ItineraryStepProps {
  onBack: () => void;
  onReset: () => void;
}

export default function ItineraryStep({ onBack, onReset }: ItineraryStepProps) {
  const { 
    itinerary, 
    setItinerary, 
    personaData, 
    questionnaireData,
    dateRange,
    incrementItineraryGenerations 
  } = useParallelUniverseStore();
  
  const { canGenerateItinerary, itineraryCreditsRemaining } = useGenerationCredits();
  const [isGenerating, setIsGenerating] = useState(false);

  const generateItinerary = async () => {
    if (!canGenerateItinerary) {
      toast.error('Itinerary generation limit reached. Try again tomorrow.');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Calculate number of days
      const days = dateRange ? 
        Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 
        1;

      // Extract destination from persona seed
      const destinationCity = getDestinationFromPersona(personaData?.seed || '', 'Unknown destination');

      // Build the request data
      const requestData = {
        personaSeed: personaData?.seed,
        interests: questionnaireData?.interests || [],
        budget: questionnaireData?.budget,
        energy: questionnaireData?.energy,
        anonymityIdea: questionnaireData?.anonymityIdea,
        dateRange: dateRange ? {
          start: dateRange.start.toISOString().split('T')[0],
          end: dateRange.end.toISOString().split('T')[0]
        } : undefined,
        timeWindows: questionnaireData?.timeWindows,
        dietary: questionnaireData?.dietary,
        mobility: questionnaireData?.mobility,
        // Include persona-specific fields
        secretDesire: questionnaireData?.secretDesire,
        personalityShift: questionnaireData?.personalityShift,
        socialRole: questionnaireData?.socialRole,
        fearToOvercome: questionnaireData?.fearToOvercome,
        hiddenTalent: questionnaireData?.hiddenTalent,
        primaryCityOrRegion: destinationCity,
        numberOfDays: days
      };

      // Call the existing generate-itinerary edge function
      const { data, error } = await supabase.functions.invoke('generate-itinerary', {
        body: requestData
      });

      if (error) {
        console.error('Itinerary generation error:', error);
        toast.error('Failed to generate itinerary. Please try again.');
        return;
      }

      if (data) {
        setItinerary(data);
        incrementItineraryGenerations();
        toast.success('Your parallel universe itinerary is ready!');
      } else {
        toast.error('No itinerary was generated. Please try again.');
      }

    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast.error('Failed to generate itinerary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadItinerary = () => {
    if (!itinerary) return;

    const content = `# ${itinerary.title}

## Overview
${itinerary.overview || 'Your personalized parallel universe travel itinerary'}

## Daily Itinerary

${itinerary.dayByDayItinerary?.map(day => `
### Day ${day.day}: ${day.theme}

**Morning (${day.morning?.time})**
${day.morning?.activity}
Location: ${day.morning?.location}
${day.morning?.description}
Transportation: ${day.morning?.transportTip}

**Afternoon (${day.afternoon?.time})**
${day.afternoon?.activity}
Location: ${day.afternoon?.location}
${day.afternoon?.description}
${day.afternoon?.lunchRecommendation ? `Lunch: ${day.afternoon.lunchRecommendation.restaurant} - ${day.afternoon.lunchRecommendation.dish}` : ''}

**Evening (${day.evening?.time})**
${day.evening?.activity}
Location: ${day.evening?.location}
${day.evening?.description}
${day.evening?.dinnerRecommendation ? `Dinner: ${day.evening.dinnerRecommendation.restaurant} - ${day.evening.dinnerRecommendation.speciality}` : ''}

${day.dailyNotes ? `**Notes:** ${day.dailyNotes}` : ''}
`).join('\n') || ''}

## Local Tips
${itinerary.localInsiderTips?.map(tip => `- ${tip}`).join('\n') || ''}

## Budget Estimate
${itinerary.budgetEstimate ? `
- Daily Food: ${itinerary.budgetEstimate.dailyFoodBudget}
- Attractions: ${itinerary.budgetEstimate.attractionsCost}
- Transportation: ${itinerary.budgetEstimate.transportationCost}
- **Total Estimate: ${itinerary.budgetEstimate.totalEstimate}**
` : ''}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parallel-universe-itinerary-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Your Parallel Universe Itinerary</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Get a personalized day-by-day travel plan designed for your alternate reality persona.
        </p>
      </div>

      {!itinerary && (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h4 className="font-medium">Generate Your Personalized Itinerary</h4>
            <p className="text-sm text-muted-foreground">
              Credits remaining: {itineraryCreditsRemaining}/5 per day
            </p>
            
            <Button
              onClick={generateItinerary}
              disabled={!canGenerateItinerary || isGenerating}
              className="w-full max-w-sm"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Itinerary...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Itinerary
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {itinerary && (
        <div className="space-y-6">
          {/* Title and Actions */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">{itinerary.title}</h2>
                {itinerary.overview && (
                  <p className="text-muted-foreground">{itinerary.overview}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={downloadItinerary}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" onClick={generateItinerary} disabled={isGenerating}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate
                </Button>
              </div>
            </div>
          </Card>

          {/* Daily Itinerary */}
          {itinerary.dayByDayItinerary?.map((day, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                    {day.day}
                  </span>
                  Day {day.day}: {day.theme}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Morning */}
                {day.morning && (
                  <div className="border-l-4 border-yellow-400 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-700">Morning - {day.morning.time}</span>
                    </div>
                    <h5 className="font-semibold mb-1">{day.morning.activity}</h5>
                    <p className="text-sm text-muted-foreground mb-1">{day.morning.location}</p>
                    <p className="text-sm mb-2">{day.morning.description}</p>
                    {day.morning.transportTip && (
                      <p className="text-xs text-muted-foreground">🚗 {day.morning.transportTip}</p>
                    )}
                  </div>
                )}

                {/* Afternoon */}
                {day.afternoon && (
                  <div className="border-l-4 border-orange-400 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-orange-700">Afternoon - {day.afternoon.time}</span>
                    </div>
                    <h5 className="font-semibold mb-1">{day.afternoon.activity}</h5>
                    <p className="text-sm text-muted-foreground mb-1">{day.afternoon.location}</p>
                    <p className="text-sm mb-2">{day.afternoon.description}</p>
                    {day.afternoon.lunchRecommendation && (
                      <div className="bg-muted p-2 rounded text-xs">
                        <strong>Lunch:</strong> {day.afternoon.lunchRecommendation.restaurant} - {day.afternoon.lunchRecommendation.dish}
                      </div>
                    )}
                  </div>
                )}

                {/* Evening */}
                {day.evening && (
                  <div className="border-l-4 border-purple-400 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-purple-700">Evening - {day.evening.time}</span>
                    </div>
                    <h5 className="font-semibold mb-1">{day.evening.activity}</h5>
                    <p className="text-sm text-muted-foreground mb-1">{day.evening.location}</p>
                    <p className="text-sm mb-2">{day.evening.description}</p>
                    {day.evening.dinnerRecommendation && (
                      <div className="bg-muted p-2 rounded text-xs">
                        <strong>Dinner:</strong> {day.evening.dinnerRecommendation.restaurant} - {day.evening.dinnerRecommendation.speciality}
                      </div>
                    )}
                  </div>
                )}

                {day.dailyNotes && (
                  <div className="bg-primary/5 p-3 rounded border border-primary/20">
                    <p className="text-sm"><strong>Daily Notes:</strong> {day.dailyNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Best Places for Eating & Must Try */}
          {itinerary.foodAndDrinks && itinerary.foodAndDrinks.length > 0 && (
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                🍽️ Best Places for Eating & Must Try
              </h4>
              <div className="grid gap-4 md:grid-cols-2">
                {itinerary.foodAndDrinks.map((food, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-sm">{food.restaurantName}</h5>
                      <span className="text-xs text-muted-foreground">{food.priceRange}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{food.location}</p>
                    <p className="text-xs text-primary mb-2">{food.cuisine} • {food.bestTime}</p>
                    {food.mustTryDishes && food.mustTryDishes.length > 0 && (
                      <div className="mb-2">
                        <span className="text-xs font-medium">Must try: </span>
                        <span className="text-xs">{food.mustTryDishes.join(', ')}</span>
                      </div>
                    )}
                    {food.specialtyNote && (
                      <p className="text-xs text-muted-foreground italic">{food.specialtyNote}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Must Do Attractions */}
          {itinerary.mustDoAttractions && itinerary.mustDoAttractions.length > 0 && (
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                ⭐ Must-Do Attractions
              </h4>
              <div className="space-y-4">
                {itinerary.mustDoAttractions.map((attraction, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-4 bg-card">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="font-medium text-sm">{attraction.name}</h5>
                      <span className="text-xs text-muted-foreground">{attraction.estimatedTime}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{attraction.location}</p>
                    <p className="text-xs mb-2">{attraction.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-primary">Best time: {attraction.bestTimeToVisit}</span>
                      {attraction.insiderTip && (
                        <span className="text-xs text-accent">💡 {attraction.insiderTip}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Local Tips */}
          {itinerary.localInsiderTips && itinerary.localInsiderTips.length > 0 && (
            <Card className="p-6">
              <h4 className="font-semibold mb-4">Local Insider Tips</h4>
              <ul className="space-y-2">
                {itinerary.localInsiderTips.map((tip, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Budget Estimate */}
          {itinerary.budgetEstimate && (
            <Card className="p-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Budget Estimate
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Daily Food:</span>
                  <p className="font-medium">{itinerary.budgetEstimate.dailyFoodBudget}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Attractions:</span>
                  <p className="font-medium">{itinerary.budgetEstimate.attractionsCost}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Transportation:</span>
                  <p className="font-medium">{itinerary.budgetEstimate.transportationCost}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-bold text-primary">{itinerary.budgetEstimate.totalEstimate}</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    </div>
  );
}