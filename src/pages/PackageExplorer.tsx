import React, { useState } from 'react';
import { Package, Globe, Calendar, Users, MapPin, Search } from 'lucide-react';
import Input from '../components/ui/input';
import Button from '../components/ui/Button';
import { useSmoothNavigation } from '../hooks/useSmoothNavigation';
import { searchCities } from '../data/cities';

export default function PackageExplorer() {
  const { smoothNavigate } = useSmoothNavigation();
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    duration: '7',
    travelers: 2,
    packageType: 'all'
  });
  const [showDestinations, setShowDestinations] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'travelers' ? parseInt(value) : value
    }));
  };

  const handleDestinationClick = (destination: string) => {
    setFormData(prev => ({ ...prev, destination }));
    setShowDestinations(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.destination || !formData.startDate) {
      return;
    }
    
    const searchParams = new URLSearchParams({
      type: 'packages',
      destination: formData.destination,
      startDate: formData.startDate,
      duration: formData.duration,
      travelers: formData.travelers.toString(),
      packageType: formData.packageType
    });
    
    smoothNavigate(`/search?${searchParams.toString()}`);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-violet-700 to-indigo-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Package className="w-16 h-16 mx-auto mb-4 text-purple-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Travel Packages</h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Discover curated travel packages that combine flights, hotels, and experiences for the perfect vacation.
            </p>
          </div>
        </div>
      </section>

      {/* Search Panel */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-400 rounded-lg flex items-center justify-center mr-4">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Travel Packages</h3>
                  <p className="text-muted-foreground">Find your perfect travel package</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Package Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Package Type</label>
                  <select
                    name="packageType"
                    value={formData.packageType}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Packages</option>
                    <option value="adventure">Adventure</option>
                    <option value="luxury">Luxury</option>
                    <option value="family">Family</option>
                    <option value="romantic">Romantic</option>
                    <option value="cultural">Cultural</option>
                    <option value="beach">Beach</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Destination */}
                  <div className="relative">
                    <Input
                      label="Destination"
                      name="destination"
                      value={formData.destination}
                      onChange={handleInputChange}
                      onFocus={() => setShowDestinations(true)}
                      onBlur={() => setTimeout(() => setShowDestinations(false), 200)}
                      placeholder="Where do you want to go?"
                      icon={<MapPin className="w-5 h-5 text-gray-400" />}
                      required
                    />
                    
                    {showDestinations && (
                      <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                        {searchCities(formData.destination, 8).map((city, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDestinationClick(city)}
                            className="w-full text-left px-4 py-2 hover:bg-muted border-b border-border last:border-b-0 text-foreground"
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Start Date */}
                  <Input
                    label="Start Date"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    min={today}
                    icon={<Calendar className="w-5 h-5 text-gray-400" />}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Duration</label>
                    <select
                      name="duration"
                      value={formData.duration}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="3">3 Days</option>
                      <option value="5">5 Days</option>
                      <option value="7">7 Days</option>
                      <option value="10">10 Days</option>
                      <option value="14">14 Days</option>
                      <option value="21">21 Days</option>
                    </select>
                  </div>

                  {/* Travelers */}
                  <Input
                    label="Travelers"
                    name="travelers"
                    type="number"
                    value={formData.travelers}
                    onChange={handleInputChange}
                    min="1"
                    max="20"
                    icon={<Users className="w-5 h-5 text-gray-400" />}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Search className="w-5 h-5 mr-2" />
                  Explore Packages
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">Package Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">All-Inclusive</h3>
              <p className="text-muted-foreground">Flights, hotels, meals, and activities all bundled together for convenience.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Expert Planning</h3>
              <p className="text-muted-foreground">Carefully crafted itineraries by travel experts who know the destinations.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Group Discounts</h3>
              <p className="text-muted-foreground">Better prices through group bookings and exclusive partner deals.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}