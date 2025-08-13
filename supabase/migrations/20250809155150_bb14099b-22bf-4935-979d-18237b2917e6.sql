-- Create flight bookings table
CREATE TABLE public.flight_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  flight_number TEXT NOT NULL,
  airline TEXT NOT NULL,
  departure_city TEXT NOT NULL,
  arrival_city TEXT NOT NULL,
  departure_date DATE NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  passenger_count INTEGER NOT NULL DEFAULT 1,
  booking_status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hotel bookings table
CREATE TABLE public.hotel_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hotel_name TEXT NOT NULL,
  hotel_address TEXT NOT NULL,
  city TEXT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  room_type TEXT NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  rating DECIMAL(2,1),
  booking_status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.flight_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for flight bookings
CREATE POLICY "Users can view their own flight bookings" 
ON public.flight_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flight bookings" 
ON public.flight_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flight bookings" 
ON public.flight_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flight bookings" 
ON public.flight_bookings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for hotel bookings
CREATE POLICY "Users can view their own hotel bookings" 
ON public.hotel_bookings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own hotel bookings" 
ON public.hotel_bookings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hotel bookings" 
ON public.hotel_bookings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hotel bookings" 
ON public.hotel_bookings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_flight_bookings_updated_at
BEFORE UPDATE ON public.flight_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hotel_bookings_updated_at
BEFORE UPDATE ON public.hotel_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();