import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Users, MapPin, Star, CreditCard, Shield } from 'lucide-react';
import { Hotel, Flight, Package } from '../types';
import { formatPrice, validateEmail, validatePhone, validateRequired } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import Input from '../components/ui/input';

export default function BookingDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { type, item, searchParams } = location.state || {};
  
  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    zipCode: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isProcessing, setIsProcessing] = useState(false);

  if (!type || !item) {
    navigate('/');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!validateRequired(formData.firstName)) {
      newErrors.firstName = 'First name is required';
    }
    if (!validateRequired(formData.lastName)) {
      newErrors.lastName = 'Last name is required';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Valid phone number is required';
    }
    if (!validateRequired(formData.cardNumber) || formData.cardNumber.length < 16) {
      newErrors.cardNumber = 'Valid card number is required';
    }
    if (!validateRequired(formData.expiryDate)) {
      newErrors.expiryDate = 'Expiry date is required';
    }
    if (!validateRequired(formData.cvv) || formData.cvv.length < 3) {
      newErrors.cvv = 'Valid CVV is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create booking
    const booking = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      item,
      guestInfo: {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone
      },
      bookingDate: new Date().toISOString(),
      totalPrice: getTotalPrice(),
      status: 'confirmed' as const,
      referenceNumber: 'TRV' + Math.random().toString(36).substr(2, 8).toUpperCase()
    };
    
    // Save booking to localStorage
    const existingBookings = JSON.parse(localStorage.getItem('userBookings') || '[]');
    existingBookings.push(booking);
    localStorage.setItem('userBookings', JSON.stringify(existingBookings));
    
    navigate('/confirmation', { state: { booking } });
  };

  const getTotalPrice = () => {
    if (type === 'hotel') {
      const hotel = item as Hotel;
      const nights = searchParams?.checkIn && searchParams?.checkOut 
        ? Math.ceil((new Date(searchParams.checkOut).getTime() - new Date(searchParams.checkIn).getTime()) / (1000 * 60 * 60 * 24))
        : 1;
      return hotel.pricePerNight * nights * (searchParams?.guests || 1);
    }
    if (type === 'flight') {
      const flight = item as Flight;
      return flight.price * (searchParams?.guests || 1);
    }
    if (type === 'package') {
      const pkg = item as Package;
      return pkg.price * (searchParams?.guests || 1);
    }
    return 0;
  };

  const renderItemDetails = () => {
    if (type === 'hotel') {
      const hotel = item as Hotel;
      return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start space-x-4">
            <img
              src={hotel.image}
              alt={hotel.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{hotel.name}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{hotel.location}</span>
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{hotel.rating}</span>
                <span className="text-gray-500">({hotel.reviewCount} reviews)</span>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>
                    {searchParams?.checkIn} to {searchParams?.checkOut}
                  </span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  <span>{searchParams?.guests} guest{searchParams?.guests > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatPrice(hotel.pricePerNight)}</div>
              <div className="text-sm text-gray-500">per night</div>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'flight') {
      const flight = item as Flight;
      return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold mb-2">{flight.airline}</h3>
              <div className="flex items-center space-x-4">
                <div>
                  <div className="font-semibold">{flight.departure.time}</div>
                  <div className="text-sm text-gray-600">{flight.departure.city}</div>
                </div>
                <div className="text-gray-400">→</div>
                <div>
                  <div className="font-semibold">{flight.arrival.time}</div>
                  <div className="text-sm text-gray-600">{flight.arrival.city}</div>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Duration: {flight.duration} • {flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatPrice(flight.price)}</div>
              <div className="text-sm text-gray-500">per person</div>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'package') {
      const pkg = item as Package;
      return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start space-x-4">
            <img
              src={pkg.image}
              alt={pkg.name}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{pkg.destination}</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">{pkg.duration}</div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{pkg.rating}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatPrice(pkg.price)}</div>
              <div className="text-sm text-gray-500">per person</div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Booking Details</h1>
          <p className="text-muted-foreground">Complete your booking by providing the required information.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Item Details */}
            <div className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
              {renderItemDetails()}
            </div>

            {/* Guest Information */}
            <div className="bg-card rounded-lg shadow-md p-6 border border-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Guest Information</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    error={errors.firstName}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    error={errors.lastName}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    error={errors.email}
                    required
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    error={errors.phone}
                    required
                  />
                </div>
              </form>
            </div>

            {/* Payment Information */}
            <div className="bg-card rounded-lg shadow-md p-6 border border-border">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 mr-2" />
                <h3 className="text-lg font-semibold text-foreground">Payment Information</h3>
                <Shield className="w-5 h-5 ml-2 text-green-500" />
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Card Number"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  error={errors.cardNumber}
                  placeholder="1234 5678 9012 3456"
                  maxLength={16}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Expiry Date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    error={errors.expiryDate}
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                  />
                  <Input
                    label="CVV"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleInputChange}
                    error={errors.cvv}
                    placeholder="123"
                    maxLength={4}
                    required
                  />
                </div>
                
                <Input
                  label="Billing Address"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleInputChange}
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    label="ZIP Code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-md p-6 sticky top-8 border border-border">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Booking Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-foreground">Base Price</span>
                  <span className="text-foreground">{formatPrice(getTotalPrice() * 0.85)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Taxes & Fees</span>
                  <span className="text-foreground">{formatPrice(getTotalPrice() * 0.15)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleSubmit}
                isLoading={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? 'Processing Payment...' : `Pay ${formatPrice(getTotalPrice())}`}
              </Button>
              
              <div className="mt-4 text-xs text-muted-foreground text-center">
                <Shield className="w-4 h-4 inline mr-1" />
                Secure payment protected by 256-bit SSL encryption
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}