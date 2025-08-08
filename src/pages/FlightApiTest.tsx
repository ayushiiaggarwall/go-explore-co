import React, { useState } from 'react';
import { skyscannerApi } from '../services/skyscannerApi';

export default function FlightApiTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    from: 'Mumbai, India',
    to: 'Paris, France',
    departDate: '2025-02-15',
    returnDate: '2025-02-22',
    adults: 1
  });

  const handleTest = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('🧪 Testing Flight API with:', formData);
      const flightResults = await skyscannerApi.searchFlights(
        formData.from,
        formData.to,
        formData.departDate,
        formData.returnDate,
        formData.adults
      );
      
      console.log('✅ Flight API Results:', flightResults);
      setResults(flightResults);
    } catch (err) {
      console.error('❌ Flight API Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            Flight API Test & Data Explorer
          </h1>
          
          {/* Test Form */}
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Test Parameters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  From
                </label>
                <input
                  type="text"
                  value={formData.from}
                  onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  placeholder="Departure city"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  To
                </label>
                <input
                  type="text"
                  value={formData.to}
                  onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                  placeholder="Destination city"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={formData.departDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, departDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Return Date
                </label>
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, returnDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Adults
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.adults}
                  onChange={(e) => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                />
              </div>
            </div>
            
            <button
              onClick={handleTest}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-6 rounded-md transition-colors"
            >
              {loading ? '🔄 Testing API...' : '🧪 Test Flight API'}
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-blue-700 dark:text-blue-300">
                  Testing Flight API... This may take a few seconds.
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900 rounded-lg">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">❌ Error</h3>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-8">
              {/* Summary */}
              <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  ✅ API Response Summary
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  Found {results.length} flight options from {formData.from} to {formData.to}
                </p>
              </div>

              {/* Raw JSON Data */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  📋 Raw API Response (JSON)
                </h3>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
                  <pre className="text-sm">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Formatted Flight Cards */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  ✈️ Formatted Flight Results ({results.length} flights)
                </h3>
                <div className="grid gap-4">
                  {results.map((flight: any, index: number) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                            {flight.airline}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {flight.stops === 0 ? 'Direct Flight' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            ${flight.price}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {flight.currency}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {flight.departure.time}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {flight.departure.airport}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {flight.departure.city}
                          </p>
                        </div>
                        
                        <div className="flex-1 text-center">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {flight.duration}
                          </p>
                          <div className="w-full h-px bg-gray-300 dark:bg-gray-600 relative">
                            <div className="absolute inset-0 flex justify-center">
                              <span className="bg-white dark:bg-gray-700 px-2 text-xs text-gray-500">
                                ✈️
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {flight.arrival.time}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {flight.arrival.airport}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {flight.arrival.city}
                          </p>
                        </div>
                      </div>
                      
                      {flight.bookingUrl && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <a
                            href={flight.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            🔗 Booking URL: {flight.bookingUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Structure Explanation */}
              <div className="p-6 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
                  📊 Available Data Fields
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Flight Info:</h4>
                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• <code>airline</code> - Airline name</li>
                      <li>• <code>price</code> - Flight price (number)</li>
                      <li>• <code>currency</code> - Price currency</li>
                      <li>• <code>duration</code> - Flight duration</li>
                      <li>• <code>stops</code> - Number of stops</li>
                      <li>• <code>bookingUrl</code> - Booking link</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Departure/Arrival:</h4>
                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• <code>departure.time</code> - Departure time</li>
                      <li>• <code>departure.date</code> - Departure date</li>
                      <li>• <code>departure.airport</code> - Airport code</li>
                      <li>• <code>departure.city</code> - City name</li>
                      <li>• <code>arrival.*</code> - Same fields for arrival</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}