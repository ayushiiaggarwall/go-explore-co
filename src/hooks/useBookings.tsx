import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// Time cleaning utility function
function cleanTimeFormat(timeString: string): string {
  if (!timeString) return '00:00';
  
  try {
    // Handle corrupted time like "19:23.04206639745962" or "22:3.606127428290847"
    const corruptedTimeMatch = timeString.match(/^(\d{1,2}):(\d{1,2})[\.\d]*$/);
    if (corruptedTimeMatch) {
      const [, hours, minutes] = corruptedTimeMatch;
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    
    // If it's already in HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(timeString)) {
      const [hours, minutes] = timeString.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    // Handle simple time with extra decimals - extract only hours and minutes
    const timeMatch = timeString.match(/^(\d{1,2})[:.](\d{1,2})/);
    if (timeMatch) {
      const [, hours, minutes] = timeMatch;
      return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    
    return timeString; // Return as-is if no issues found
  } catch (error) {
    console.warn('Error cleaning time:', timeString, error);
    return '00:00';
  }
}

export interface FlightBooking {
  id: string;
  user_id: string;
  flight_number: string;
  airline: string;
  departure_city: string;
  arrival_city: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  passenger_count: number;
  booking_status: string;
  created_at: string;
}

export interface HotelBooking {
  id: string;
  user_id: string;
  hotel_name: string;
  hotel_address: string;
  city: string;
  check_in_date: string;
  check_out_date: string;
  room_type: string;
  price_per_night: number;
  total_price: number;
  guest_count: number;
  rating?: number | null;
  booking_status: string;
  created_at: string;
}

export function useBookings() {
  const { user } = useAuth();
  const [flightBookings, setFlightBookings] = useState<FlightBooking[]>([]);
  const [hotelBookings, setHotelBookings] = useState<HotelBooking[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Load flight bookings
      const { data: flights, error: flightError } = await supabase
        .from('flight_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (flightError) throw flightError;
      
      // Load hotel bookings
      const { data: hotels, error: hotelError } = await supabase
        .from('hotel_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (hotelError) throw hotelError;

      // Clean times when loading from database
      const cleanedFlights = (flights || []).map(flight => ({
        ...flight,
        departure_time: cleanTimeFormat(flight.departure_time),
        arrival_time: cleanTimeFormat(flight.arrival_time)
      }));

      setFlightBookings(cleanedFlights);
      setHotelBookings(hotels || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const bookFlight = async (flightData: {
    flight_number: string;
    airline: string;
    departure_city: string;
    arrival_city: string;
    departure_date: string;
    departure_time: string;
    arrival_time: string;
    price: number;
    passenger_count: number;
  }) => {
    if (!user) {
      toast.error('Please log in to book flights');
      return false;
    }

    try {
      // Clean times before saving to database
      const cleanedData = {
        ...flightData,
        departure_time: cleanTimeFormat(flightData.departure_time),
        arrival_time: cleanTimeFormat(flightData.arrival_time)
      };

      const { error } = await supabase
        .from('flight_bookings')
        .insert({
          user_id: user.id,
          ...cleanedData
        });

      if (error) throw error;

      toast.success('Flight booked successfully!');
      loadBookings(); // Refresh bookings
      return true;
    } catch (error) {
      console.error('Error booking flight:', error);
      toast.error('Failed to book flight');
      return false;
    }
  };

  const bookHotel = async (hotelData: {
    hotel_name: string;
    hotel_address: string;
    city: string;
    check_in_date: string;
    check_out_date: string;
    room_type: string;
    price_per_night: number;
    total_price: number;
    guest_count: number;
    rating?: number | null;
  }) => {
    if (!user) {
      toast.error('Please log in to book hotels');
      return false;
    }

    try {
      const { error } = await supabase
        .from('hotel_bookings')
        .insert({
          user_id: user.id,
          ...hotelData
        });

      if (error) throw error;

      toast.success('Hotel booked successfully!');
      loadBookings(); // Refresh bookings
      return true;
    } catch (error) {
      console.error('Error booking hotel:', error);
      toast.error('Failed to book hotel');
      return false;
    }
  };

  useEffect(() => {
    loadBookings();
  }, [user]);

  const deleteFlight = async (flightId: string) => {
    if (!user) {
      toast.error('Please log in to delete bookings');
      return false;
    }

    try {
      const { error } = await supabase
        .from('flight_bookings')
        .delete()
        .eq('id', flightId);

      if (error) throw error;

      toast.success('Flight booking deleted successfully!');
      loadBookings(); // Refresh bookings
      return true;
    } catch (error) {
      console.error('Error deleting flight:', error);
      toast.error('Failed to delete flight booking');
      return false;
    }
  };

  const deleteHotel = async (hotelId: string) => {
    if (!user) {
      toast.error('Please log in to delete bookings');
      return false;
    }

    try {
      const { error } = await supabase
        .from('hotel_bookings')
        .delete()
        .eq('id', hotelId);

      if (error) throw error;

      toast.success('Hotel booking deleted successfully!');
      loadBookings(); // Refresh bookings
      return true;
    } catch (error) {
      console.error('Error deleting hotel:', error);
      toast.error('Failed to delete hotel booking');
      return false;
    }
  };

  return {
    flightBookings,
    hotelBookings,
    loading,
    bookFlight,
    bookHotel,
    deleteFlight,
    deleteHotel,
    loadBookings,
    cleanTimeFormat // Export the utility function
  };
}