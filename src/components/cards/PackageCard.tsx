import React from 'react';
import { Star, Clock, Check } from 'lucide-react';
import { Package } from '../../types';
import { formatPrice } from '../../utils/validation';
import Button from '../ui/Button';

interface PackageCardProps {
  package: Package;
  onBook: (pkg: Package) => void;
}

export default function PackageCard({ package: pkg, onBook }: PackageCardProps) {
  const savings = pkg.originalPrice - pkg.price;
  const savingsPercent = Math.round((savings / pkg.originalPrice) * 100);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative">
        <img
          src={pkg.image}
          alt={pkg.name}
          className="w-full h-48 object-cover"
        />
        {savings > 0 && (
          <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
            Save {savingsPercent}%
          </div>
        )}
        <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-semibold">
          {formatPrice(pkg.price)}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{pkg.name}</h3>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{pkg.rating}</span>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-2">
          <Clock className="w-4 h-4 mr-1" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{pkg.duration}</span>
        </div>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">{pkg.description}</p>
        
        {savings > 0 && (
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatPrice(pkg.price)}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">{formatPrice(pkg.originalPrice)}</span>
          </div>
        )}
        
        <div className="space-y-2 mb-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Includes:</h4>
          {pkg.includes.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
            </div>
          ))}
        </div>
        
        <Button
          onClick={() => onBook(pkg)}
          className="w-full"
          size="lg"
        >
          Book Package
        </Button>
      </div>
    </div>
  );
}