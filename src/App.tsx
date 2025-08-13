import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import BookingDetails from './pages/BookingDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Confirmation from './pages/Confirmation';
import Contact from './pages/Contact';
import About from './pages/About';
import Recommendations from './pages/Recommendations';
import VisaInfo from './pages/VisaInfo';
import CurrencyConverter from './pages/CurrencyConverter';
import FlightApiTest from './pages/FlightApiTest';
import EmailConfirmation from './pages/EmailConfirmation';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import FlightBooking from './pages/FlightBooking';
import HotelBooking from './pages/HotelBooking';
import PackageExplorer from './pages/PackageExplorer';
import PlanTrip from './pages/PlanTrip';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/booking" element={<BookingDetails />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/confirmation" element={<Confirmation />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/visa-info" element={<VisaInfo />} />
                <Route path="/currency-converter" element={<CurrencyConverter />} />
                <Route path="/flight-api-test" element={<FlightApiTest />} />
                <Route path="/email-confirmation" element={<EmailConfirmation />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/book-flight" element={<FlightBooking />} />
                <Route path="/book-hotel" element={<HotelBooking />} />
        <Route path="/plan-trip" element={<PlanTrip />} />
        <Route path="/explore-packages" element={<PackageExplorer />} />
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