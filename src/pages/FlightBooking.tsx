import { Plane, Shield, Clock, CreditCard } from 'lucide-react';
import FlightSearchPanel from '../components/sections/FlightSearchPanel';

export default function FlightBooking() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-sky-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Plane className="w-16 h-16 mx-auto mb-4 text-blue-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Book Your Flight</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Find and book the perfect flight for your journey. Compare prices, airlines, and schedules.
            </p>
          </div>
        </div>
      </section>

      {/* Search Panel */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <FlightSearchPanel />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Why Book With Us?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Secure Booking</h3>
              <p className="text-muted-foreground">Your personal and payment information is always protected with bank-level security.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">24/7 Support</h3>
              <p className="text-muted-foreground">Our customer service team is available around the clock to assist you.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Best Prices</h3>
              <p className="text-muted-foreground">We compare prices across multiple airlines to find you the best deals.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}