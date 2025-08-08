import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plane, Menu, X, LogOut, Settings, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from '../ui/ThemeToggle';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isTravelToolsOpen, setIsTravelToolsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    const firstName = parts[0]?.[0] || '';
    const lastName = parts[1]?.[0] || '';
    return (firstName + lastName).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-background border-b border-border shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Plane className="w-8 h-8 text-sky-500" />
            <span className="text-xl font-bold text-foreground">TravelEase</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {user ? (
              <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <Link to="/" className="text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-2">
                <Home className="w-4 h-4" />
                Home
              </Link>
            )}
            <div className="relative">
              <button 
                onClick={() => setIsTravelToolsOpen(!isTravelToolsOpen)}
                className="text-muted-foreground hover:text-primary transition-colors font-medium flex items-center gap-1"
              >
                Travel Tools
                <svg className={`w-4 h-4 transition-transform ${isTravelToolsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isTravelToolsOpen && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-card border border-border rounded-lg shadow-xl py-2 z-50 animate-fade-in">
                  <Link
                    to="/recommendations"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setIsTravelToolsOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Books & Movies
                  </Link>
                  <Link
                    to="/visa-info"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setIsTravelToolsOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Visa Information
                  </Link>
                  <Link
                    to="/currency-converter"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setIsTravelToolsOpen(false)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Currency Converter
                  </Link>
                </div>
              )}
            </div>
            <Link to="/about" className="text-muted-foreground hover:text-sky-500 transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-sky-500 transition-colors">
              Contact
            </Link>
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 text-muted-foreground hover:text-sky-500 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                    {getInitials(user.user_metadata?.full_name || user.email || 'U')}
                  </div>
                  <span className="hidden sm:block">{user.user_metadata?.full_name || user.email}</span>
                </button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-md shadow-lg py-1 z-50">
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Link>
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      My Bookings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-muted-foreground hover:text-sky-500 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-muted-foreground hover:text-sky-500"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border">
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-sm font-medium text-foreground">Theme</span>
                <ThemeToggle />
              </div>
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              ) : (
                <Link
                  to="/"
                  className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="w-4 h-4" />
                  Home
                </Link>
              )}
              <Link
                to="/recommendations"
                className="block px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Books & Movies
              </Link>
              <Link
                to="/visa-info"
                className="block px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Visa Information
              </Link>
              <Link
                to="/currency-converter"
                className="block px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Currency Converter
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              {user ? (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-3 px-3 py-2 text-foreground font-medium">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                      {getInitials(user.user_metadata?.full_name || user.email || 'U')}
                    </div>
                    Welcome, {user.user_metadata?.full_name || user.email}
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    My Bookings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="border-t pt-4 space-y-1">
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-muted-foreground hover:text-sky-500 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors mx-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}