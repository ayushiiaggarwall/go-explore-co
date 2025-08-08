import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Calendar, MapPin, Mail, Phone, User, Download } from 'lucide-react';
import { Booking } from '../types';
import { formatPrice, formatDate } from '../utils/validation';
import Button from '../components/ui/Button';

export default function Confirmation() {
  const location = useLocation();
  const { booking }: { booking: Booking } = location.state || {};

  if (!booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Booking not found</h1>
          <p className="text-muted-foreground mt-2">Please check your booking reference.</p>
          <Link to="/" className="text-sky-600 hover:text-sky-500 mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const renderBookingDetails = () => {
    if (booking.type === 'hotel') {
      const hotel = booking.item as any;
      return (
        <div className="flex items-start space-x-4">
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div>
            <h3 className="text-lg font-semibold">{hotel.name}</h3>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{hotel.location}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {formatPrice(hotel.pricePerNight)} per night
            </p>
          </div>
        </div>
      );
    }

    if (booking.type === 'flight') {
      const flight = booking.item as any;
      return (
        <div>
          <h3 className="text-lg font-semibold mb-2">{flight.airline}</h3>
          <div className="flex items-center space-x-4">
            <div>
              <div className="font-medium">{flight.departure.time}</div>
              <div className="text-sm text-gray-600">{flight.departure.city}</div>
            </div>
            <div className="text-gray-400">→</div>
            <div>
              <div className="font-medium">{flight.arrival.time}</div>
              <div className="text-sm text-gray-600">{flight.arrival.city}</div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Duration: {flight.duration} • {flight.stops === 0 ? 'Direct' : `${flight.stops} stops`}
          </p>
        </div>
      );
    }

    if (booking.type === 'package') {
      const pkg = booking.item as any;
      return (
        <div className="flex items-start space-x-4">
          <img
            src={pkg.image}
            alt={pkg.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <div>
            <h3 className="text-lg font-semibold">{pkg.name}</h3>
            <div className="flex items-center text-gray-600 mt-1">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{pkg.destination}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">{pkg.duration}</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground">
            Your booking has been successfully processed. You'll receive a confirmation email shortly.
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden mb-8 border border-border">
          <div className="bg-sky-500 text-white px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Booking Reference</h2>
                <p className="text-sky-100">{booking.referenceNumber}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatPrice(booking.totalPrice)}</div>
                <div className="text-sky-100">Total Amount</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Booking Item Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {booking.type === 'hotel' ? 'Hotel' : 
                 booking.type === 'flight' ? 'Flight' : 'Package'} Details
              </h3>
              {renderBookingDetails()}
            </div>

            {/* Guest Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Guest Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-muted-foreground mr-3" />
                  <span className="text-foreground">{booking.guestInfo.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-muted-foreground mr-3" />
                  <span className="text-foreground">{booking.guestInfo.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-muted-foreground mr-3" />
                  <span className="text-foreground">{booking.guestInfo.phone}</span>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Booking Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground mr-3" />
                    <span className="font-medium text-foreground">Booking Date</span>
                  </div>
                  <p className="text-muted-foreground ml-7">{formatDate(booking.bookingDate)}</p>
                </div>
                <div>
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                    <span className="font-medium text-foreground">Status</span>
                  </div>
                  <p className="text-green-600 ml-7 capitalize">{booking.status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" className="flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Download Receipt
          </Button>
          <Link to="/dashboard">
            <Button className="w-full sm:w-auto">
              View All Bookings
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Important Information */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">Important Information</h3>
          <ul className="text-blue-800 dark:text-blue-200 space-y-2">
            <li>• A confirmation email has been sent to {booking.guestInfo.email}</li>
            <li>• Please keep your booking reference number for future reference</li>
            <li>• Check-in instructions will be provided separately</li>
            <li>• For any changes or cancellations, please contact our support team</li>
          </ul>
        </div>
      </div>
    </div>
  );
}