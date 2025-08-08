import { Star, Clock, Check } from 'lucide-react';
import { Package } from '../../types';
import { formatPrice } from '../../utils/validation';
import Button from '../ui/Button';
import { GlareCard } from '../ui/glare-card';
import { useTheme } from '../../hooks/useTheme';

interface PackageCardProps {
  package: Package;
  onBook: (pkg: Package) => void;
}

export default function PackageCard({ package: pkg, onBook }: PackageCardProps) {
  const savings = pkg.originalPrice - pkg.price;
  const savingsPercent = Math.round((savings / pkg.originalPrice) * 100);
  const { actualTheme } = useTheme();

  // Check if this package should have the glare effect
  const hasGlareEffect = ['Romantic Paris Getaway', 'Tokyo Adventure', 'Tropical Bali Escape'].includes(pkg.name);
  
  // Define colors based on theme for glare cards
  const getGlareTextColor = (baseColor: string) => {
    if (!hasGlareEffect) return baseColor;
    return actualTheme === 'light' ? 'text-black' : 'text-white';
  };
  
  const getGlareSecondaryColor = (baseColor: string) => {
    if (!hasGlareEffect) return baseColor;
    return actualTheme === 'light' ? 'text-gray-700' : 'text-gray-300';
  };
  
  const getGlareMutedColor = (baseColor: string) => {
    if (!hasGlareEffect) return baseColor;
    return actualTheme === 'light' ? 'text-gray-600' : 'text-gray-400';
  };

  const cardContent = (
    <>
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
          <h3 className={`text-xl font-semibold ${getGlareTextColor('text-gray-900 dark:text-gray-100')}`}>{pkg.name}</h3>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className={`text-sm font-medium ${getGlareTextColor('text-gray-900 dark:text-gray-100')}`}>{pkg.rating}</span>
          </div>
        </div>
        
        <div className={`flex items-center mb-2 ${getGlareSecondaryColor('text-gray-600 dark:text-gray-400')}`}>
          <Clock className="w-4 h-4 mr-1" />
          <span className="text-sm">{pkg.duration}</span>
        </div>
        
        <p className={`mb-4 text-sm ${getGlareSecondaryColor('text-gray-700 dark:text-gray-300')}`}>{pkg.description}</p>
        
        {savings > 0 && (
          <div className="flex items-center space-x-2 mb-3">
            <span className={`text-lg font-bold ${getGlareTextColor('text-gray-900 dark:text-gray-100')}`}>{formatPrice(pkg.price)}</span>
            <span className={`text-sm line-through ${getGlareMutedColor('text-gray-500 dark:text-gray-400')}`}>{formatPrice(pkg.originalPrice)}</span>
          </div>
        )}
        
        <div className="space-y-2 mb-4">
          <h4 className={`font-medium ${getGlareTextColor('text-gray-900 dark:text-gray-100')}`}>Includes:</h4>
          {pkg.includes.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Check className={`w-4 h-4 ${hasGlareEffect ? 'text-green-500' : 'text-green-500'}`} />
              <span className={`text-sm ${getGlareSecondaryColor('text-gray-700 dark:text-gray-300')}`}>{item}</span>
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
    </>
  );

  if (hasGlareEffect) {
    return (
      <GlareCard className="bg-transparent">
        {cardContent}
      </GlareCard>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {cardContent}
    </div>
  );
}