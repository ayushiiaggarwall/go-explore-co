import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, RefreshCw, Calculator, Sparkles } from 'lucide-react';
import Input from '../components/ui/input';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { geminiApi } from '../services/geminiApi';

interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

// Mock exchange rates (in a real app, this would come from an API)
const mockExchangeRates: { [key: string]: number } = {
  'USD-EUR': 0.85,
  'USD-GBP': 0.73,
  'USD-JPY': 110.0,
  'USD-CAD': 1.25,
  'USD-AUD': 1.35,
  'USD-CHF': 0.92,
  'USD-CNY': 6.45,
  'USD-INR': 74.5,
  'EUR-USD': 1.18,
  'EUR-GBP': 0.86,
  'EUR-JPY': 129.4,
  'GBP-USD': 1.37,
  'GBP-EUR': 1.16,
  'JPY-USD': 0.0091,
};

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

const popularConversions = [
  { from: 'USD', to: 'EUR', label: 'USD to EUR' },
  { from: 'USD', to: 'GBP', label: 'USD to GBP' },
  { from: 'USD', to: 'JPY', label: 'USD to JPY' },
  { from: 'EUR', to: 'USD', label: 'EUR to USD' },
  { from: 'GBP', to: 'USD', label: 'GBP to USD' },
  { from: 'USD', to: 'INR', label: 'USD to INR' },
];

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [aiConversionData, setAiConversionData] = useState<{
    convertedAmount: number;
    exchangeRate: number;
    additionalInfo: string;
  } | null>(null);
  const [useAiConversion, setUseAiConversion] = useState(false);

  const getExchangeRate = (from: string, to: string): number => {
    if (from === to) return 1;
    
    const key = `${from}-${to}`;
    const reverseKey = `${to}-${from}`;
    
    if (mockExchangeRates[key]) {
      return mockExchangeRates[key];
    } else if (mockExchangeRates[reverseKey]) {
      return 1 / mockExchangeRates[reverseKey];
    }
    
    // Default rate if not found
    return 1;
  };

  const handleConvert = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    setLoading(true);
    
    if (useAiConversion) {
      await handleAiConvert();
    } else {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const rate = getExchangeRate(fromCurrency, toCurrency);
      const converted = parseFloat(amount) * rate;
      
      setExchangeRate(rate);
      setConvertedAmount(converted);
      setLastUpdated(new Date().toLocaleString());
    }
    
    setLoading(false);
  };

  const handleAiConvert = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    
    setAiLoading(true);
    try {
      console.log('💱 Getting AI currency conversion for:', parseFloat(amount), fromCurrency, 'to', toCurrency);
      const conversion = await geminiApi.convertCurrency(parseFloat(amount), fromCurrency, toCurrency);
      
      setAiConversionData(conversion);
      setConvertedAmount(conversion.convertedAmount);
      setExchangeRate(conversion.exchangeRate);
      setLastUpdated(new Date().toLocaleString());
    } catch (error) {
      console.error('Failed to get AI conversion:', error);
      // Fallback to regular conversion
      const rate = getExchangeRate(fromCurrency, toCurrency);
      const converted = parseFloat(amount) * rate;
      setExchangeRate(rate);
      setConvertedAmount(converted);
      setLastUpdated(new Date().toLocaleString());
    } finally {
      setAiLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setConvertedAmount(null);
    setExchangeRate(null);
    setAiConversionData(null);
  };

  const handleQuickConversion = (from: string, to: string) => {
    setFromCurrency(from);
    setToCurrency(to);
    setConvertedAmount(null);
    setExchangeRate(null);
    setAiConversionData(null);
  };

  useEffect(() => {
    if (amount && fromCurrency && toCurrency) {
      handleConvert();
    }
  }, [amount, fromCurrency, toCurrency]);

  const getCurrencySymbol = (code: string) => {
    return currencies.find(c => c.code === code)?.symbol || code;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <DollarSign className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Currency Converter</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Get real-time exchange rates and convert currencies for your travel planning.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* AI Toggle */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-6 border border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-purple-500" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">AI-Powered Currency Conversion</h3>
                <p className="text-sm text-muted-foreground">Get real-time rates and travel tips from AI</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useAiConversion}
                onChange={(e) => {
                  setUseAiConversion(e.target.checked);
                  setAiConversionData(null);
                  setConvertedAmount(null);
                  setExchangeRate(null);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Converter */}
        <div className="bg-card rounded-lg shadow-lg p-8 mb-8 border border-border">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-end">
            <div className="lg:col-span-2">
              <Input
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                icon={<Calculator className="w-5 h-5 text-gray-400" />}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                From
              </label>
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleSwapCurrencies}
                className="p-2"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                To
              </label>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full rounded-md border-border bg-background text-foreground shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {(loading || aiLoading) && (
            <div className="mt-8 flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <p className="ml-4 text-muted-foreground">
                {useAiConversion ? 'Getting AI-powered conversion...' : 'Converting...'}
              </p>
            </div>
          )}

          {/* Result */}
          {convertedAmount !== null && exchangeRate !== null && !loading && !aiLoading && (
            <div className={`mt-8 p-6 rounded-lg ${useAiConversion && aiConversionData ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${useAiConversion && aiConversionData ? 'text-purple-900 dark:text-purple-100' : 'text-blue-900 dark:text-blue-100'}`}>
                  {getCurrencySymbol(toCurrency)} {convertedAmount.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className={useAiConversion && aiConversionData ? 'text-purple-700 dark:text-purple-300' : 'text-blue-700 dark:text-blue-300'}>
                  {getCurrencySymbol(fromCurrency)} {parseFloat(amount).toLocaleString()} {fromCurrency} = {getCurrencySymbol(toCurrency)} {convertedAmount.toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} {toCurrency}
                </div>
                <div className={`text-sm mt-2 ${useAiConversion && aiConversionData ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  1 {fromCurrency} = {exchangeRate.toFixed(4)} {toCurrency}
                  {useAiConversion && aiConversionData && (
                    <span className="ml-2 inline-flex items-center">
                      <Sparkles className="w-4 h-4 mr-1" />
                      AI-Powered
                    </span>
                  )}
                </div>
                {lastUpdated && (
                  <div className={`text-xs mt-1 ${useAiConversion && aiConversionData ? 'text-purple-500 dark:text-purple-400' : 'text-blue-500 dark:text-blue-400'}`}>
                    Last updated: {lastUpdated}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Travel Tips */}
        {useAiConversion && aiConversionData?.additionalInfo && !loading && !aiLoading && (
          <div className="mb-8 bg-card rounded-lg shadow-md overflow-hidden border border-border">
            <div className="px-6 py-4 bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-400">
              <div className="flex items-center">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    AI Travel Currency Tips
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Personalized advice for your currency conversion
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap text-foreground">
                  {aiConversionData.additionalInfo}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Conversions */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-8 border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-4">Popular Conversions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {popularConversions.map((conversion, index) => (
              <button
                key={index}
                onClick={() => handleQuickConversion(conversion.from, conversion.to)}
                className="p-3 text-left border border-border rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
              >
                <div className="font-medium text-foreground">{conversion.label}</div>
                <div className="text-sm text-muted-foreground">
                  1 {conversion.from} = {getExchangeRate(conversion.from, conversion.to).toFixed(4)} {conversion.to}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Exchange Rate Table */}
        <div className="bg-card rounded-lg shadow-md p-6 border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-4">Exchange Rates</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Currency Pair
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {popularConversions.map((conversion, index) => (
                  <tr key={index} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-foreground">
                          {conversion.from}/{conversion.to}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-foreground">
                      {getExchangeRate(conversion.from, conversion.to).toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm">+0.12%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Travel Tips */}
        <div className="mt-8 bg-card rounded-lg shadow-md p-6 border border-border">
          <h3 className="text-xl font-semibold text-foreground mb-4">Currency Exchange Tips for Travelers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Best Practices</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Exchange money at banks or official exchange counters</li>
                <li>• Avoid airport exchanges (usually poor rates)</li>
                <li>• Use ATMs for better exchange rates</li>
                <li>• Notify your bank before traveling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Money-Saving Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Compare rates from multiple sources</li>
                <li>• Consider using travel-friendly credit cards</li>
                <li>• Exchange larger amounts to reduce fees</li>
                <li>• Keep some cash in local currency for emergencies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}