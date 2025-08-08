import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Star, Phone, Mail, User, Trash2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Booking } from '../types';
import { formatPrice, formatDate } from '../utils/validation';
import Button from '../components/ui/Button';

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile'>('bookings');

  useEffect(() => {
    // Load bookings from localStorage
    const savedBookings = localStorage.getItem('userBookings');
    if (savedBookings) {
      setBookings(JSON.parse(savedBookings));
    }
  }, []);

  const handleCancelBooking = (bookingId: string) => {
    const updatedBookings = bookings.map(booking =>
      booking.id === bookingId 
        ? { ...booking, status: 'cancelled' as const }
        : booking
    );
    setBookings(updatedBookings);
    localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderBookingCard = (booking: Booking) => {
    return (
      <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {booking.type === 'hotel' ? (booking.item as any).name :
               booking.type === 'flight' ? `${(booking.item as any).airline} Flight` :
               (booking.item as any).name}
            </h3>
            <p className="text-gray-600">Reference: {booking.referenceNumber}</p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}
            >
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </span>
            <div className="mt-2 text-lg font-bold">{formatPrice(booking.totalPrice)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {booking.type === 'hotel' && (
            <>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm">{(booking.item as any).location}</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="text-sm">{(booking.item as any).rating} stars</span>
              </div>
            </>
          )}
          
          {booking.type === 'flight' && (
            <>
              <div className="flex items-center">
                <span className="text-sm">
                  {(booking.item as any).departure.city} → {(booking.item as any).arrival.city}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm">{(booking.item as any).departure.date}</span>
              </div>
            </>
          )}

          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm">Booked: {formatDate(booking.bookingDate)}</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <div className="flex items-center mb-1">
                <User className="w-4 h-4 mr-2" />
                <span>{booking.guestInfo.name}</span>
              </div>
              <div className="flex items-center mb-1">
                <Mail className="w-4 h-4 mr-2" />
                <span>{booking.guestInfo.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                <span>{booking.guestInfo.phone}</span>
              </div>
            </div>
            
            {booking.status === 'confirmed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelBooking(booking.id)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}!</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              My Bookings ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              Profile Settings
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'bookings' && (
          <div>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Calendar className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start exploring and book your first trip with TravelEase.
                </p>
                <Button onClick={() => window.location.href = '/search'}>
                  Start Booking
                </Button>
              </div>
            ) : (
              <div>
                {bookings.map(renderBookingCard)}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-card rounded-lg shadow-md p-6 border border-border">
            <h3 className="text-lg font-semibold mb-6 text-foreground">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Full Name
                </label>
                <div className="text-foreground">{user?.name}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <div className="text-foreground">{user?.email}</div>
              </div>
              <div className="pt-4">
                <Button variant="outline">
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}