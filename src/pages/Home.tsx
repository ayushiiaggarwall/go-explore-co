import { Link, Navigate } from 'react-router-dom';
import { Plane, Hotel, MapPin, Star, Shield, Clock } from 'lucide-react';
import PackageCard from '../components/cards/PackageCard';
import { mockPackages } from '../services/mockData';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, isLoading } = useAuth();

  // Redirect authenticated users to dashboard
  if (!isLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handlePackageBook = (pkg: any) => {
    // In a real app, this would navigate to booking page
    console.log('Booking package:', pkg);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-sky-500">
        <div className="absolute inset-0 bg-black bg-opacity-30 dark:bg-opacity-50"></div>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/hero-background.jpg)'
          }}
        ></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white drop-shadow-strong">
              Your Journey Begins Here
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white drop-shadow-medium-plus">
              Discover amazing destinations, book the perfect accommodations, and create unforgettable memories with TravelEase.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Hotels Button */}
            <Link 
              to="/book-hotel" 
              className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-yellow-500/20"></div>
              <div className="relative p-8 h-64 flex flex-col items-center justify-center text-center">
                <Hotel className="w-16 h-16 text-white mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">HOTELS</h2>
                <p className="text-white/90 text-lg">Find perfect accommodations</p>
              </div>
            </Link>

            {/* Flights Button */}
            <Link 
              to="/flight-booking" 
              className="group relative overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-sky-500/20"></div>
              <div className="relative p-8 h-64 flex flex-col items-center justify-center text-center">
                <Plane className="w-16 h-16 text-white mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">Flights</h2>
                <p className="text-white/90 text-lg">Book your next adventure</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose TravelEase?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make travel planning simple, secure, and affordable with our comprehensive booking platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-card rounded-lg shadow-md border border-border">
              <Shield className="w-12 h-12 text-sky-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure Booking</h3>
              <p className="text-muted-foreground">Your payments and personal information are protected with bank-level security.</p>
            </div>
            
            <div className="text-center p-6 bg-card rounded-lg shadow-md border border-border">
              <Clock className="w-12 h-12 text-sky-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">Get assistance whenever you need it with our round-the-clock customer support.</p>
            </div>
            
            <div className="text-center p-6 bg-card rounded-lg shadow-md border border-border">
              <Star className="w-12 h-12 text-sky-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
              <p className="text-muted-foreground">Compare prices from multiple providers to ensure you get the best deals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Packages */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Popular Vacation Packages</h2>
            <p className="text-lg text-muted-foreground">Discover our handpicked travel packages for the perfect getaway.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockPackages.map(pkg => (
              <PackageCard
                key={pkg.id}
                package={pkg}
                onBook={handlePackageBook}
              />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link
              to="/search"
              className="inline-flex items-center px-6 py-3 bg-sky-500 text-white font-medium rounded-md hover:bg-sky-600 transition-colors"
            >
              View All Packages
            </Link>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Book Everything You Need</h2>
            <p className="text-lg text-muted-foreground">From flights to accommodations, we've got your travel needs covered.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center">
                <Plane className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-center">Flights</h3>
                <p className="text-muted-foreground mb-4 text-center">Compare and book flights from hundreds of airlines worldwide.</p>
                <Link to="/search" className="text-sky-500 hover:text-sky-600 font-medium block text-center">
                  Search Flights →
                </Link>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              <div className="h-48 bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
                <Hotel className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-center">Hotels</h3>
                <p className="text-muted-foreground mb-4 text-center">Find and book the perfect accommodation for your stay.</p>
                <Link to="/search" className="text-sky-500 hover:text-sky-600 font-medium block text-center">
                  Search Hotels →
                </Link>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-indigo-400 flex items-center justify-center">
                <MapPin className="w-16 h-16 text-white" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2 text-center">Packages</h3>
                <p className="text-muted-foreground mb-4 text-center">Save with our curated vacation packages and deals.</p>
                <Link to="/search" className="text-sky-500 hover:text-sky-600 font-medium block text-center">
                  View Packages →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}