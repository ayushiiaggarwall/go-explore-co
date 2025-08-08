import React from 'react';
import { Users, Award, Shield, Heart, Plane, Globe, Star, CheckCircle } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-sky-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About TravelEase</h1>
            <p className="text-xl max-w-3xl mx-auto">
              We're passionate about making travel accessible, affordable, and unforgettable for everyone. 
              Since 2020, we've been helping travelers discover the world with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-6">
                At TravelEase, we believe that travel has the power to transform lives, broaden perspectives, 
                and create lasting memories. Our mission is to make travel planning simple, secure, and 
                enjoyable for everyone.
              </p>
              <p className="text-lg text-muted-foreground">
                We combine cutting-edge technology with personalized service to provide you with the best 
                travel deals, comprehensive options, and 24/7 support for your peace of mind.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/1020016/pexels-photo-1020016.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Travel planning"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Core Values</h2>
            <p className="text-lg text-muted-foreground">
              These principles guide everything we do at TravelEase
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-sky-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trust & Security</h3>
              <p className="text-muted-foreground">
                Your safety and security are our top priorities in every transaction
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer First</h3>
              <p className="text-muted-foreground">
                We put our customers at the center of everything we do
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Excellence</h3>
              <p className="text-muted-foreground">
                We strive for excellence in service quality and user experience
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Innovation</h3>
              <p className="text-muted-foreground">
                We continuously innovate to make travel planning easier
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">TravelEase by the Numbers</h2>
            <p className="text-lg text-muted-foreground">
              Our impact in the travel industry speaks for itself
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-sky-600 mb-2">500K+</div>
              <div className="text-muted-foreground">Happy Travelers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-sky-600 mb-2">150+</div>
              <div className="text-muted-foreground">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-sky-600 mb-2">1M+</div>
              <div className="text-muted-foreground">Bookings Made</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-sky-600 mb-2">24/7</div>
              <div className="text-muted-foreground">Customer Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Meet Our Team</h2>
            <p className="text-lg text-muted-foreground">
              The passionate people behind TravelEase
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              <img
                src="https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Sarah Johnson"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1 text-foreground">Sarah Johnson</h3>
                <p className="text-sky-600 mb-3">CEO & Founder</p>
                <p className="text-muted-foreground">
                  With 15 years in the travel industry, Sarah leads our vision of making travel accessible to all.
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              <img
                src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Michael Chen"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1 text-foreground">Michael Chen</h3>
                <p className="text-sky-600 mb-3">CTO</p>
                <p className="text-muted-foreground">
                  Michael ensures our platform remains cutting-edge and user-friendly with the latest technology.
                </p>
              </div>
            </div>

            <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
              <img
                src="https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400"
                alt="Emily Rodriguez"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1 text-foreground">Emily Rodriguez</h3>
                <p className="text-sky-600 mb-3">Head of Customer Success</p>
                <p className="text-muted-foreground">
                  Emily leads our customer support team to ensure every traveler has an exceptional experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-6">Why Choose TravelEase?</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-semibold text-foreground">Best Price Guarantee</h3>
                    <p className="text-muted-foreground">Find a lower price? We'll match it and give you an extra 5% off.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-semibold text-foreground">24/7 Customer Support</h3>
                    <p className="text-muted-foreground">Our expert travel consultants are available around the clock.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-semibold text-foreground">Secure Bookings</h3>
                    <p className="text-muted-foreground">All transactions are protected with bank-level security.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-semibold text-foreground">Flexible Cancellation</h3>
                    <p className="text-muted-foreground">Free cancellation on most bookings with flexible policies.</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="https://images.pexels.com/photos/1591061/pexels-photo-1591061.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Happy travelers"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}