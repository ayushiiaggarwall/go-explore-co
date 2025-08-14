import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PersonaData {
  seed: string;
}

export interface QuestionnaireData {
  interests: string[];
  budget: 'shoestring' | 'modest' | 'comfortable' | 'luxury';
  anonymityIdea: string;
  energy: number;
  timeWindows: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
  dietary?: string;
  mobility?: string;
  primaryCity?: string;
  // New persona-specific fields
  secretDesire?: string;
  personalityShift?: string;
  socialRole?: string;
  fearToOvercome?: string;
  hiddenTalent?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface GeneratedImage {
  url: string;
  prompt: string;
}

export interface Itinerary {
  title: string;
  overview?: string;
  dayByDayItinerary?: Array<{
    day: number;
    theme: string;
    morning?: {
      time: string;
      activity: string;
      location: string;
      description: string;
      transportTip: string;
    };
    afternoon?: {
      time: string;
      activity: string;
      location: string;
      description: string;
      lunchRecommendation?: {
        restaurant: string;
        location: string;
        dish: string;
      };
    };
    evening?: {
      time: string;
      activity: string;
      location: string;
      description: string;
      dinnerRecommendation?: {
        restaurant: string;
        location: string;
        speciality: string;
      };
    };
    dailyNotes?: string;
  }>;
  localInsiderTips?: string[];
  budgetEstimate?: {
    dailyFoodBudget: string;
    attractionsCost: string;
    transportationCost: string;
    totalEstimate: string;
  };
}

interface ParallelUniverseStore {
  // Current state
  currentStep: string;
  userId?: string;
  
  // Data
  personaData?: PersonaData;
  questionnaireData?: QuestionnaireData;
  dateRange?: DateRange;
  generatedImage?: GeneratedImage;
  itinerary?: Itinerary;
  
  // Rate limiting
  imageGenerations: number;
  itineraryGenerations: number;
  lastImageGen?: number;
  lastItineraryGen?: number;
  
  // Actions
  setCurrentStep: (step: string) => void;
  setPersonaData: (data: PersonaData) => void;
  setQuestionnaireData: (data: QuestionnaireData) => void;
  setDateRange: (range: DateRange) => void;
  setGeneratedImage: (image: GeneratedImage) => void;
  setItinerary: (itinerary: Itinerary) => void;
  incrementImageGenerations: () => void;
  incrementItineraryGenerations: () => void;
  resetStore: () => void;
  
  // Computed
  canProceed: boolean;
  personaSummary?: {
    seed: string;
    interests: string[];
    budget?: string;
    dates?: string;
  };
}

export const useParallelUniverseStore = create<ParallelUniverseStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStep: 'persona',
      imageGenerations: 0,
      itineraryGenerations: 0,
      
      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setPersonaData: (data) => set({ personaData: data }),
      
      setQuestionnaireData: (data) => set({ questionnaireData: data }),
      
      setDateRange: (range) => set({ dateRange: range }),
      
      setGeneratedImage: (image) => set({ generatedImage: image }),
      
      setItinerary: (itinerary) => set({ itinerary: itinerary }),
      
      incrementImageGenerations: () => {
        const now = Date.now();
        set({ 
          imageGenerations: get().imageGenerations + 1,
          lastImageGen: now
        });
      },
      
      incrementItineraryGenerations: () => {
        const now = Date.now();
        set({ 
          itineraryGenerations: get().itineraryGenerations + 1,
          lastItineraryGen: now
        });
      },
      
      resetStore: () => set({
        currentStep: 'persona',
        personaData: undefined,
        questionnaireData: undefined,
        dateRange: undefined,
        generatedImage: undefined,
        itinerary: undefined,
      }),
      
      // Computed properties
      get canProceed() {
        const state = get();
        switch (state.currentStep) {
          case 'persona':
            return !!state.personaData?.seed && state.personaData.seed.length >= 10;
          case 'questions':
            return !!state.questionnaireData?.interests.length && 
                   !!state.questionnaireData?.budget &&
                   !!state.questionnaireData?.anonymityIdea;
          case 'dates':
            return !!state.dateRange?.start && !!state.dateRange?.end;
          case 'image':
            return !!state.generatedImage;
          case 'itinerary':
            return !!state.itinerary;
          default:
            return false;
        }
      },
      
      get personaSummary() {
        const state = get();
        if (!state.personaData?.seed) return undefined;
        
        return {
          seed: state.personaData.seed,
          interests: state.questionnaireData?.interests || [],
          budget: state.questionnaireData?.budget,
          dates: state.dateRange ? 
            `${state.dateRange.start.toLocaleDateString()} - ${state.dateRange.end.toLocaleDateString()}` : 
            undefined
        };
      },
    }),
    {
      name: 'parallel-universe-store',
    }
  )
);

// Rate limiting helpers
export const useGenerationCredits = () => {
  const { imageGenerations, itineraryGenerations, lastImageGen, lastItineraryGen } = useParallelUniverseStore();
  
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * oneHour;
  
  // Reset counters if enough time has passed
  const canGenerateImage = !lastImageGen || (now - lastImageGen > oneHour) || imageGenerations < 10;
  const canGenerateItinerary = !lastItineraryGen || (now - lastItineraryGen > oneDay) || itineraryGenerations < 5;
  
  return {
    canGenerateImage,
    canGenerateItinerary,
    imageCreditsRemaining: Math.max(0, 10 - imageGenerations),
    itineraryCreditsRemaining: Math.max(0, 5 - itineraryGenerations),
  };
};