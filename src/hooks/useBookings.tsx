import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

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

      setFlightBookings(flights || []);
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
      const { error } = await supabase
        .from('flight_bookings')
        .insert({
          user_id: user.id,
          ...flightData
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

  return {
    flightBookings,
    hotelBookings,
    loading,
    bookFlight,
    bookHotel,
    loadBookings
  };
}