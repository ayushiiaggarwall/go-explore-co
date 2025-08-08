import React, { useState } from 'react';
import { Import as Passport, Clock, CheckCircle, AlertCircle, FileText, DollarSign, Sparkles } from 'lucide-react';
import Input from '../components/ui/input';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { geminiApi } from '../services/geminiApi';

interface VisaRequirement {
  country: string;
  visaRequired: boolean;
  type: string;
  processingTime: string;
  validity: string;
  cost: string;
  requirements: string[];
  additionalInfo?: string;
}

const visaData: { [key: string]: VisaRequirement[] } = {
  'US': [
    {
      country: 'France',
      visaRequired: false,
      type: 'Visa Waiver (ESTA)',
      processingTime: 'Instant - 72 hours',
      validity: '90 days',
      cost: '$21',
      requirements: ['Valid passport', 'ESTA authorization', 'Return ticket'],
      additionalInfo: 'Must apply for ESTA at least 72 hours before travel'
    },
    {
      country: 'Japan',
      visaRequired: false,
      type: 'Tourist Visa Waiver',
      processingTime: 'On arrival',
      validity: '90 days',
      cost: 'Free',
      requirements: ['Valid passport', 'Return ticket', 'Proof of accommodation'],
    },
    {
      country: 'India',
      visaRequired: true,
      type: 'e-Tourist Visa',
      processingTime: '3-5 business days',
      validity: '60 days',
      cost: '$25-100',
      requirements: ['Valid passport', 'Digital photo', 'Proof of accommodation', 'Return ticket'],
      additionalInfo: 'Must apply online at least 4 days before travel'
    },
    {
      country: 'China',
      visaRequired: true,
      type: 'Tourist Visa (L)',
      processingTime: '4-10 business days',
      validity: '30-90 days',
      cost: '$140-200',
      requirements: ['Valid passport', 'Visa application form', 'Photo', 'Invitation letter', 'Hotel bookings'],
      additionalInfo: 'Must apply through Chinese consulate or visa center'
    }
  ],
  'UK': [
    {
      country: 'France',
      visaRequired: false,
      type: 'Tourist Entry',
      processingTime: 'On arrival',
      validity: '90 days in 180 days',
      cost: 'Free',
      requirements: ['Valid passport', 'Return ticket', 'Proof of accommodation'],
      additionalInfo: 'Post-Brexit rules apply'
    },
    {
      country: 'USA',
      visaRequired: true,
      type: 'ESTA Waiver',
      processingTime: 'Instant - 72 hours',
      validity: '90 days',
      cost: '$21',
      requirements: ['Valid passport', 'ESTA authorization', 'Return ticket'],
    }
  ]
};

const countries = ['US', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'India'];
const destinations = ['France', 'Japan', 'India', 'China', 'USA', 'UK', 'Thailand', 'Italy', 'Spain', 'Germany'];
const purposeOptions = ['Tourism', 'Business', 'Study', 'Work', 'Transit', 'Family Visit'];

export default function VisaInfo() {
  const [fromCountry, setFromCountry] = useState('');
  const [toCountry, setToCountry] = useState('');
  const [purposeOfVisit, setPurposeOfVisit] = useState('');
  const [visaInfo, setVisaInfo] = useState<VisaRequirement | null>(null);
  const [aiVisaTips, setAiVisaTips] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSearch = async () => {
    if (!fromCountry || !toCountry) return;
    
    setLoading(true);
    setVisaInfo(null);
    setAiVisaTips('');
    
    try {
      // Get basic visa info from local data
      const countryData = visaData[fromCountry];
      const info = countryData?.find(visa => visa.country === toCountry);
      
      if (info) {
        setVisaInfo(info);
      } else {
        // Default info for countries not in our data
        setVisaInfo({
          country: toCountry,
          visaRequired: true,
          type: 'Tourist Visa',
          processingTime: '5-15 business days',
          validity: '30-90 days',
          cost: '$50-150',
          requirements: ['Valid passport', 'Visa application form', 'Photo', 'Proof of accommodation', 'Return ticket'],
          additionalInfo: 'Please check with the embassy for the most current requirements'
        });
      }

      // Get AI-powered visa tips
      if (purposeOfVisit) {
        await getAiVisaTips();
      }
    } catch (error) {
      console.error('Error getting visa info:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAiVisaTips = async () => {
    if (!fromCountry || !toCountry || !purposeOfVisit) return;
    
    setAiLoading(true);
    try {
      console.log('🛂 Getting AI visa tips for:', fromCountry, 'to', toCountry, 'for', purposeOfVisit);
      const tips = await geminiApi.getVisaTips(fromCountry, toCountry, purposeOfVisit);
      setAiVisaTips(tips);
    } catch (error) {
      console.error('Failed to get AI visa tips:', error);
      setAiVisaTips('Unable to get AI visa tips at the moment. Please consult the embassy for detailed information.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-green-600 to-teal-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Passport className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Visa Information</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Check visa requirements, processing times, and costs for your destination.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Form */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-8 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">Check Visa Requirements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                From Country
              </label>
              <select
                value={fromCountry}
                onChange={(e) => setFromCountry(e.target.value)}
                className="w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">Select your country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                To Country
              </label>
              <select
                value={toCountry}
                onChange={(e) => setToCountry(e.target.value)}
                className="w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">Select destination</option>
                {destinations.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Purpose of Visit
              </label>
              <select
                value={purposeOfVisit}
                onChange={(e) => setPurposeOfVisit(e.target.value)}
                className="w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-green-500 focus:ring-green-500"
              >
                <option value="">Select purpose</option>
                {purposeOptions.map(purpose => (
                  <option key={purpose} value={purpose}>{purpose}</option>
                ))}
              </select>
            </div>
            
            <Button
              onClick={handleSearch}
              isLoading={loading}
              disabled={!fromCountry || !toCountry}
              size="lg"
            >
              Check Requirements
            </Button>
          </div>
        </div>

        {/* Visa Information */}
        {visaInfo && (
          <div className="bg-card rounded-lg shadow-md overflow-hidden border border-border">
            <div className={`px-6 py-4 ${visaInfo.visaRequired ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400' : 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400'}`}>
              <div className="flex items-center">
                {visaInfo.visaRequired ? (
                  <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {visaInfo.visaRequired ? 'Visa Required' : 'No Visa Required'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    For travel from {fromCountry} to {visaInfo.country}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Visa Type</h4>
                    <p className="text-muted-foreground">{visaInfo.type}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Processing Time</h4>
                    <p className="text-muted-foreground">{visaInfo.processingTime}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <DollarSign className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Cost</h4>
                    <p className="text-muted-foreground">{visaInfo.cost}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Passport className="w-5 h-5 text-muted-foreground mt-1" />
                  <div>
                    <h4 className="font-semibold text-foreground">Validity</h4>
                    <p className="text-muted-foreground">{visaInfo.validity}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-semibold text-foreground mb-3">Required Documents</h4>
                <ul className="space-y-2">
                  {visaInfo.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-foreground">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {visaInfo.additionalInfo && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Important Information</h4>
                      <p className="text-blue-800 dark:text-blue-200 text-sm mt-1">{visaInfo.additionalInfo}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Visa Tips */}
        {(aiVisaTips || aiLoading) && (
          <div className="mb-8 bg-card rounded-lg shadow-md overflow-hidden border border-border">
            <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400">
              <div className="flex items-center">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    AI Visa Tips & Advice
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Personalized guidance for your visa application
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {aiLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                  <p className="ml-4 text-muted-foreground">Getting personalized visa advice...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap text-foreground">
                    {aiVisaTips}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* General Tips */}
        <div className="mt-8 bg-card rounded-lg shadow-md p-6 border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-4">General Visa Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Before You Apply</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Check passport expiry (usually needs 6+ months validity)</li>
                <li>• Verify you have blank pages for visa stamps</li>
                <li>• Apply well in advance of travel dates</li>
                <li>• Check for any recent policy changes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Common Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Completed visa application form</li>
                <li>• Recent passport-sized photographs</li>
                <li>• Proof of accommodation bookings</li>
                <li>• Return flight tickets</li>
                <li>• Bank statements or proof of funds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}