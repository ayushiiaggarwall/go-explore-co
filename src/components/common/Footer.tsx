import React from 'react';
import { Plane, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Plane className="w-8 h-8 text-sky-400" />
              <span className="text-2xl font-bold">TravelEase</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Your trusted partner for unforgettable travel experiences. We make booking flights, 
              hotels, and vacation packages simple and affordable.
            </p>
            <div className="flex space-x-4">
              <Facebook className="w-6 h-6 text-gray-400 hover:text-sky-400 dark:hover:text-sky-300 cursor-pointer transition-colors" />
              <Twitter className="w-6 h-6 text-gray-400 hover:text-sky-400 dark:hover:text-sky-300 cursor-pointer transition-colors" />
              <Instagram className="w-6 h-6 text-gray-400 hover:text-sky-400 dark:hover:text-sky-300 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-300 hover:text-sky-400 dark:hover:text-sky-300 transition-colors">Home</Link></li>
              <li><Link to="/search" className="text-gray-300 hover:text-sky-400 dark:hover:text-sky-300 transition-colors">Search</Link></li>
              <li><Link to="/about" className="text-gray-300 hover:text-sky-400 dark:hover:text-sky-300 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-300 hover:text-sky-400 dark:hover:text-sky-300 transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Travel Tools */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Travel Tools</h3>
            <ul className="space-y-2">
              <li><Link to="/recommendations" className="text-gray-300 hover:text-sky-400 dark:hover:text-sky-300 transition-colors">Books & Movies</Link></li>
              <li><Link to="/visa-info" className="text-gray-300 hover:text-sky-400 dark:hover:text-sky-300 transition-colors">Visa Information</Link></li>
              <li><Link to="/currency-converter" className="text-gray-300 hover:text-sky-400 dark:hover:text-sky-300 transition-colors">Currency Converter</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-sky-400" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-sky-400" />
                <span className="text-gray-300">info@travelease.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-sky-400" />
                <span className="text-gray-300">123 Travel St, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">Stay Updated</h3>
              <p className="text-gray-300">Get the latest travel deals and updates.</p>
            </div>
            <div className="flex w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2 rounded-l-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <button className="bg-sky-500 text-white px-6 py-2 rounded-r-md hover:bg-sky-600 dark:hover:bg-sky-400 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 dark:border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 TravelEase. All rights reserved. | Privacy Policy | Terms of Service
          </p>
        </div>
      </div>
    </footer>
  );
}