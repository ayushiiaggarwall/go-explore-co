import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Book, Film, Star, MapPin, Search, Sparkles } from 'lucide-react';
import Input from '../components/ui/input';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { geminiApi } from '../services/geminiApi';

interface Recommendation {
  id: string;
  title: string;
  type: 'book' | 'movie';
  author?: string;
  director?: string;
  year: number;
  rating: number;
  description: string;
  image: string;
  destinations: string[];
}

const mockRecommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Eat, Pray, Love',
    type: 'book',
    author: 'Elizabeth Gilbert',
    year: 2006,
    rating: 4.2,
    description: 'A memoir about finding yourself through travel across Italy, India, and Indonesia.',
    image: 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=400',
    destinations: ['Italy', 'India', 'Indonesia', 'Rome', 'Bali']
  },
  {
    id: '2',
    title: 'Lost in Translation',
    type: 'movie',
    director: 'Sofia Coppola',
    year: 2003,
    rating: 4.5,
    description: 'A lonely movie star and a neglected young woman form an unlikely bond in Tokyo.',
    image: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=400',
    destinations: ['Japan', 'Tokyo']
  },
  {
    id: '3',
    title: 'A Year in Provence',
    type: 'book',
    author: 'Peter Mayle',
    year: 1989,
    rating: 4.3,
    description: 'A delightful memoir about living in the French countryside.',
    image: 'https://images.pexels.com/photos/1308881/pexels-photo-1308881.jpeg?auto=compress&cs=tinysrgb&w=400',
    destinations: ['France', 'Provence', 'Paris']
  },
  {
    id: '4',
    title: 'The Beach',
    type: 'movie',
    director: 'Danny Boyle',
    year: 2000,
    rating: 4.1,
    description: 'A young backpacker discovers a secret beach paradise in Thailand.',
    image: 'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=400',
    destinations: ['Thailand', 'Bangkok']
  },
  {
    id: '5',
    title: 'Midnight in Paris',
    type: 'movie',
    director: 'Woody Allen',
    year: 2011,
    rating: 4.6,
    description: 'A writer discovers he can travel back in time to 1920s Paris every night at midnight.',
    image: 'https://images.pexels.com/photos/161853/eiffel-tower-paris-france-tower-161853.jpeg?auto=compress&cs=tinysrgb&w=400',
    destinations: ['France', 'Paris']
  },
  {
    id: '6',
    title: 'Shantaram',
    type: 'book',
    author: 'Gregory David Roberts',
    year: 2003,
    rating: 4.4,
    description: 'An epic novel about an escaped convict who flees to India and finds a new life in Bombay.',
    image: 'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg?auto=compress&cs=tinysrgb&w=400',
    destinations: ['India', 'Mumbai', 'Bombay']
  }
];

export default function Recommendations() {
  const [searchParams] = useSearchParams();
  const [searchDestination, setSearchDestination] = useState('');
  const [filteredRecommendations, setFilteredRecommendations] = useState(mockRecommendations);
  const [activeFilter, setActiveFilter] = useState<'all' | 'book' | 'movie'>('all');
  const [loading, setLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<{ books: any[], movies: any[] } | null>(null);
  
  const destinationFromUrl = searchParams.get('destination') || '';
  
  useEffect(() => {
    if (destinationFromUrl) {
      setSearchDestination(destinationFromUrl);
      getAiRecommendations(destinationFromUrl);
    }
  }, [destinationFromUrl]);

  const getAiRecommendations = async (destination: string) => {
    if (!destination.trim()) return;
    
    setLoading(true);
    try {
      console.log('📚 Getting AI recommendations for:', destination);
      const recommendations = await geminiApi.getBookMovieRecommendations(destination);
      setAiRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to get AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Get AI recommendations if we have a destination
    if (searchDestination.trim()) {
      getAiRecommendations(searchDestination);
    }
    
    // Also filter existing mock recommendations
    let filtered = mockRecommendations;
    
    if (searchDestination) {
      filtered = filtered.filter(rec =>
        rec.destinations.some(dest =>
          dest.toLowerCase().includes(searchDestination.toLowerCase())
        )
      );
    }
    
    if (activeFilter !== 'all') {
      filtered = filtered.filter(rec => rec.type === activeFilter);
    }
    
    setFilteredRecommendations(filtered);
  };

  const handleFilterChange = (filter: 'all' | 'book' | 'movie') => {
    setActiveFilter(filter);
    let filtered = mockRecommendations;
    
    if (searchDestination) {
      filtered = filtered.filter(rec =>
        rec.destinations.some(dest =>
          dest.toLowerCase().includes(searchDestination.toLowerCase())
        )
      );
    }
    
    if (filter !== 'all') {
      filtered = filtered.filter(rec => rec.type === filter);
    }
    
    setFilteredRecommendations(filtered);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Travel Recommendations</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Discover books and movies that will inspire your next adventure and help you connect with your destination.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <div className="bg-card rounded-lg shadow-md p-6 mb-8 border border-border">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <Input
                label="Search by Destination"
                value={searchDestination}
                onChange={(e) => setSearchDestination(e.target.value)}
                placeholder="Enter a destination (e.g., Paris, Tokyo, Italy)"
                icon={<MapPin className="w-5 h-5 text-gray-400" />}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
          
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-purple-500 text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              All ({filteredRecommendations.length})
            </button>
            <button
              onClick={() => handleFilterChange('book')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'book'
                  ? 'bg-purple-500 text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Books ({filteredRecommendations.filter(r => r.type === 'book').length})
            </button>
            <button
              onClick={() => handleFilterChange('movie')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeFilter === 'movie'
                  ? 'bg-purple-500 text-white'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              Movies ({filteredRecommendations.filter(r => r.type === 'movie').length})
            </button>
          </div>
        </div>

        {/* AI Recommendations Section */}
        {destinationFromUrl && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <Sparkles className="w-6 h-6 text-purple-500 mr-2" />
              <h2 className="text-2xl font-bold text-foreground">
                AI Recommendations for {destinationFromUrl}
              </h2>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="ml-4 text-muted-foreground">Getting personalized recommendations...</p>
              </div>
            ) : aiRecommendations ? (
              <div className="space-y-8">
                {/* AI Books */}
                {aiRecommendations.books && aiRecommendations.books.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Book className="w-5 h-5 text-purple-500 mr-2" />
                      Recommended Books
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {aiRecommendations.books.map((book, index) => (
                        <div key={index} className="bg-card border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-3">
                            <Book className="w-6 h-6 text-purple-500 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-1">{book.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">by {book.author}</p>
                              <p className="text-sm text-foreground mb-2">{book.description}</p>
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-xs text-purple-700 dark:text-purple-300">
                                <strong>Why relevant:</strong> {book.relevance}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* AI Movies */}
                {aiRecommendations.movies && aiRecommendations.movies.length > 0 && (
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Film className="w-5 h-5 text-indigo-500 mr-2" />
                      Recommended Movies
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {aiRecommendations.movies.map((movie, index) => (
                        <div key={index} className="bg-card border border-indigo-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start space-x-3">
                            <Film className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground mb-1">{movie.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">directed by {movie.director}</p>
                              <p className="text-sm text-foreground mb-2">{movie.description}</p>
                              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded text-xs text-indigo-700 dark:text-indigo-300">
                                <strong>Why relevant:</strong> {movie.relevance}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : destinationFromUrl && (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Click "Get AI Recommendations" to discover books and movies for {destinationFromUrl}
                </p>
                <Button 
                  onClick={() => getAiRecommendations(destinationFromUrl)} 
                  className="mt-4"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get AI Recommendations
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Regular Recommendations Grid */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Browse All Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecommendations.map(recommendation => (
            <div key={recommendation.id} className="bg-card rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-border">
              <img
                src={recommendation.image}
                alt={recommendation.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {recommendation.type === 'book' ? (
                      <Book className="w-5 h-5 text-purple-500" />
                    ) : (
                      <Film className="w-5 h-5 text-indigo-500" />
                    )}
                    <span className="text-sm font-medium text-muted-foreground capitalize">
                      {recommendation.type}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{recommendation.rating}</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {recommendation.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {recommendation.type === 'book' ? `by ${recommendation.author}` : `directed by ${recommendation.director}`} • {recommendation.year}
                </p>
                
                <p className="text-muted-foreground mb-4 text-sm">
                  {recommendation.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  {recommendation.destinations.map((destination, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      {destination}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          </div>

          {filteredRecommendations.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Book className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No recommendations found</h3>
              <p className="text-muted-foreground">
                Try searching for a different destination or adjust your filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}