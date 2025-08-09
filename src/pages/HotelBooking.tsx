import { Building2, MapPin, Star, Wifi } from 'lucide-react';
import HotelSearchPanel from '../components/sections/HotelSearchPanel';

export default function HotelBooking() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-green-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Book Your Hotel</h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto">
              Discover amazing accommodations for your stay. From luxury resorts to budget-friendly options.
            </p>
          </div>
        </div>
      </section>

      {/* Search Panel */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <HotelSearchPanel />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Hotel Booking Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Prime Locations</h3>
              <p className="text-muted-foreground">Hotels in the best locations, close to attractions and transportation.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Quality Guarantee</h3>
              <p className="text-muted-foreground">All hotels are carefully selected and reviewed for quality and service.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Modern Amenities</h3>
              <p className="text-muted-foreground">Free WiFi, breakfast, and other amenities to make your stay comfortable.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}