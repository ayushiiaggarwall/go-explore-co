-- Create a table for parallel universe itineraries
CREATE TABLE public.parallel_universe_itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_name TEXT NOT NULL,
  persona_description TEXT,
  persona_image_url TEXT,
  itinerary_data JSONB NOT NULL,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.parallel_universe_itineraries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own parallel universe itineraries" 
ON public.parallel_universe_itineraries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own parallel universe itineraries" 
ON public.parallel_universe_itineraries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own parallel universe itineraries" 
ON public.parallel_universe_itineraries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own parallel universe itineraries" 
ON public.parallel_universe_itineraries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_parallel_universe_itineraries_updated_at
BEFORE UPDATE ON public.parallel_universe_itineraries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();