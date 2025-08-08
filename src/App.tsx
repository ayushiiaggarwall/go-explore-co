import React from 'react';
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
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;