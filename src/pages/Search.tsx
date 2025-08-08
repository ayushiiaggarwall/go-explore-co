import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Navigation from "@/components/ui/navigation";
import SearchBar from "@/components/ui/search-bar";
import { Star, MapPin, Wifi, Car, Coffee, Utensils, Clock, Plane, Calendar } from "lucide-react";

const Search = () => {
  const location = useLocation();
  const [searchData, setSearchData] = useState(location.state || {});
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [starRating, setStarRating] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);

  // Mock search results
  const mockHotels = [
    {
      id: 1,
      name: "Ocean View Resort & Spa",
      location: "Bali, Indonesia",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
      rating: 4.8,
      reviews: 1247,
      price: 189,
      originalPrice: 229,
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Bar"],
      description: "Luxury beachfront resort with stunning ocean views"
    },
    {
      id: 2,
      name: "Grand Palace Hotel",
      location: "Paris, France",
      image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
      rating: 4.9,
      reviews: 856,
      price: 345,
      originalPrice: 425,
      amenities: ["WiFi", "Concierge", "Restaurant", "Bar", "Gym"],
      description: "Historic luxury hotel in the heart of Paris"
    },
    {
      id: 3,
      name: "Modern City Hotel",
      location: "Tokyo, Japan",
      image: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=80",
      rating: 4.6,
      reviews: 634,
      price: 156,
      originalPrice: 195,
      amenities: ["WiFi", "Business Center", "Restaurant", "Gym"],
      description: "Contemporary hotel with modern amenities"
    },
    {
      id: 4,
      name: "Tropical Paradise Resort",
      location: "Maldives",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      rating: 4.9,
      reviews: 423,
      price: 899,
      originalPrice: 1200,
      amenities: ["WiFi", "Pool", "Spa", "Water Sports", "All Inclusive"],
      description: "Overwater villas in pristine tropical paradise"
    },
    {
      id: 5,
      name: "Downtown Business Hotel",
      location: "New York, USA",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      rating: 4.4,
      reviews: 1089,
      price: 279,
      originalPrice: 350,
      amenities: ["WiFi", "Business Center", "Gym", "Restaurant"],
      description: "Prime location in Manhattan's business district"
    },
    {
      id: 6,
      name: "Coastal Boutique Hotel",
      location: "Santorini, Greece",
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
      rating: 4.7,
      reviews: 312,
      price: 256,
      originalPrice: 320,
      amenities: ["WiFi", "Pool", "Restaurant", "Sunset Views"],
      description: "Charming hotel with breathtaking sunset views"
    }
  ];

  const mockFlights = [
    {
      id: 1,
      airline: "SkyWings Airlines",
      departure: { time: "08:30", airport: "JFK", city: "New York" },
      arrival: { time: "14:45", airport: "CDG", city: "Paris" },
      duration: "7h 15m",
      stops: "Non-stop",
      price: 589,
      originalPrice: 689,
      class: "Economy"
    },
    {
      id: 2,
      airline: "Ocean Air",
      departure: { time: "15:20", airport: "LAX", city: "Los Angeles" },
      arrival: { time: "09:30+1", airport: "NRT", city: "Tokyo" },
      duration: "11h 10m",
      stops: "Non-stop",
      price: 756,
      originalPrice: 856,
      class: "Economy"
    },
    {
      id: 3,
      airline: "Global Express",
      departure: { time: "22:15", airport: "LHR", city: "London" },
      arrival: { time: "12:40+1", airport: "DXB", city: "Dubai" },
      duration: "6h 25m",
      stops: "Non-stop",
      price: 423,
      originalPrice: 523,
      class: "Economy"
    }
  ];

  const getResults = () => {
    return searchData.type === "flights" ? mockFlights : mockHotels;
  };

  const getAmenityIcon = (amenity: string) => {
    const icons: any = {
      "WiFi": Wifi,
      "Restaurant": Utensils,
      "Bar": Coffee,
      "Pool": "🏊",
      "Spa": "💆",
      "Gym": "💪",
      "Parking": Car,
    };
    const Icon = icons[amenity];
    return Icon && typeof Icon !== "string" ? <Icon className="w-4 h-4" /> : <span>{icons[amenity]}</span>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Search Header */}
      <section className="bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SearchBar onSearch={setSearchData} />
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-6">Filters</h3>
              
              {/* Price Range */}
              <div className="mb-6">
                <Label className="text-sm font-medium mb-3 block">Price Range</Label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={1000}
                  step={10}
                  className="mb-2"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}+</span>
                </div>
              </div>

              {/* Star Rating */}
              {searchData.type !== "flights" && (
                <div className="mb-6">
                  <Label className="text-sm font-medium mb-3 block">Star Rating</Label>
                  <Select value={starRating} onValueChange={setStarRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="3">3+ Stars</SelectItem>
                      <SelectItem value="any">Any rating</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Amenities */}
              {searchData.type !== "flights" && (
                <div className="mb-6">
                  <Label className="text-sm font-medium mb-3 block">Amenities</Label>
                  <div className="space-y-2">
                    {["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Parking"].map((amenity) => (
                      <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-border"
                          checked={amenities.includes(amenity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAmenities([...amenities, amenity]);
                            } else {
                              setAmenities(amenities.filter(a => a !== amenity));
                            }
                          }}
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <Button className="w-full btn-primary">
                Apply Filters
              </Button>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {searchData.type === "flights" ? "Flight Results" : "Hotel Results"}
              </h2>
              <div className="text-sm text-muted-foreground">
                {getResults().length} results found
              </div>
            </div>

            <div className="space-y-6">
              {searchData.type === "flights" ? (
                // Flight Results
                mockFlights.map((flight) => (
                  <Card key={flight.id} className="travel-card">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-2">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <Plane className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{flight.airline}</h3>
                              <p className="text-sm text-muted-foreground">{flight.class}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-8">
                            <div className="text-center">
                              <div className="text-lg font-bold">{flight.departure.time}</div>
                              <div className="text-sm text-muted-foreground">{flight.departure.airport}</div>
                            </div>
                            <div className="flex-1 text-center">
                              <div className="text-sm text-muted-foreground">{flight.duration}</div>
                              <div className="border-t border-dashed border-border my-1"></div>
                              <div className="text-sm text-muted-foreground">{flight.stops}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold">{flight.arrival.time}</div>
                              <div className="text-sm text-muted-foreground">{flight.arrival.airport}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">${flight.price}</div>
                          <div className="text-sm text-muted-foreground line-through">${flight.originalPrice}</div>
                        </div>
                        
                        <div>
                          <Button className="w-full btn-primary">
                            Book Flight
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                // Hotel Results
                mockHotels.map((hotel) => (
                  <Card key={hotel.id} className="travel-card">
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                        <div className="relative">
                          <img 
                            src={hotel.image} 
                            alt={hotel.name}
                            className="w-full h-48 md:h-full object-cover"
                          />
                          <div className="absolute top-4 left-4 bg-accent text-white px-2 py-1 rounded-lg text-sm font-semibold">
                            Save ${hotel.originalPrice - hotel.price}
                          </div>
                        </div>
                        
                        <div className="p-6 md:col-span-2">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-xl font-bold mb-1">{hotel.name}</h3>
                              <div className="flex items-center space-x-1 text-muted-foreground mb-2">
                                <MapPin className="w-4 h-4" />
                                <span>{hotel.location}</span>
                              </div>
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`w-4 h-4 ${i < Math.floor(hotel.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-medium">{hotel.rating}</span>
                                <span className="text-sm text-muted-foreground">({hotel.reviews} reviews)</span>
                              </div>
                              <p className="text-muted-foreground mb-4">{hotel.description}</p>
                              
                              <div className="flex flex-wrap gap-2">
                                {hotel.amenities.slice(0, 4).map((amenity) => (
                                  <div key={amenity} className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-full text-xs">
                                    {getAmenityIcon(amenity)}
                                    <span>{amenity}</span>
                                  </div>
                                ))}
                                {hotel.amenities.length > 4 && (
                                  <div className="bg-muted px-2 py-1 rounded-full text-xs">
                                    +{hotel.amenities.length - 4} more
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground line-through">${hotel.originalPrice}</div>
                              <div className="text-2xl font-bold text-primary">${hotel.price}</div>
                              <div className="text-sm text-muted-foreground">per night</div>
                              <Button className="mt-4 btn-primary">
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;