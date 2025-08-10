import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import Header from './components/common/Header';
import ScrollToTop from './components/common/ScrollToTop';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import FlightSearchResults from './pages/FlightSearchResults';
import BookingDetails from './pages/BookingDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Confirmation from './pages/Confirmation';
import Contact from './pages/Contact';
import About from './pages/About';

import VisaInfo from './pages/VisaInfo';
import CurrencyConverter from './pages/CurrencyConverter';
import FlightApiTest from './pages/FlightApiTest';
import EmailConfirmation from './pages/EmailConfirmation';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import FlightBooking from './pages/FlightBooking';
import HotelBooking from './pages/HotelBooking';
import HotelSearchResults from './pages/HotelSearchResults';

import PackageExplorer from './pages/PackageExplorer';
import PlanTrip from './pages/PlanTrip';
import TripItinerary from './pages/TripItinerary';
import BackgroundRemovalDemo from './pages/BackgroundRemovalDemo';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/search-flights" element={<FlightSearchResults />} />
                <Route path="/search-hotels" element={<HotelSearchResults />} />
                <Route path="/booking" element={<BookingDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/confirmation" element={<Confirmation />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                
                <Route path="/visa-info" element={<VisaInfo />} />
                <Route path="/currency-converter" element={<CurrencyConverter />} />
                <Route path="/flight-api-test" element={<FlightApiTest />} />
                <Route path="/email-confirmation" element={<EmailConfirmation />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/book-flight" element={<ProtectedRoute><FlightBooking /></ProtectedRoute>} />
                <Route path="/book-hotel" element={<ProtectedRoute><HotelBooking /></ProtectedRoute>} />
                
        <Route path="/plan-trip" element={<ProtectedRoute><PlanTrip /></ProtectedRoute>} />
        <Route path="/trip-itinerary" element={<TripItinerary />} />
        <Route path="/explore-packages" element={<PackageExplorer />} />
        <Route path="/background-removal" element={<BackgroundRemovalDemo />} />
              </Routes>
            </main>
            <Footer />
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;