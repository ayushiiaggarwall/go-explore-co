import { useLocation, Navigate } from 'react-router-dom';
import TravelItinerary from '../components/TravelItinerary';
import { TripFormData } from '../services/geminiApi';

export default function TripItinerary() {
  const location = useLocation();
  const tripData = location.state?.tripData as TripFormData;

  if (!tripData) {
    // Redirect to plan trip if no data
    return <Navigate to="/plan-trip" replace />;
  }

  return <TravelItinerary tripData={tripData} />;
}