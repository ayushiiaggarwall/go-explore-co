import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

export default function EmailConfirmation() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="bg-card p-8 rounded-lg border border-border shadow-lg">
          <div className="mb-6">
            <Mail className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground">Check Your Email</h2>
            <p className="text-muted-foreground mt-2">
              We've sent a verification link to your email address
            </p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => window.location.href = 'mailto:'}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-md hover:bg-primary/90 transition-colors"
            >
              Open Email App
            </button>
            
            <Link
              to="/login"
              className="block w-full border border-border py-3 px-4 rounded-md text-foreground hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p>Check your spam folder if you don't see the email</p>
            <p className="mt-2">
              Didn't receive the email?{' '}
              <Link to="/register" className="text-primary hover:underline">
                Try registering again
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <div className="absolute top-8 left-8">
        <Link 
          to="/register" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registration
        </Link>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
          <Mail className="w-4 h-4" />
          <span className="text-sm">Check your spam folder if you don't see the email</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Didn't receive the email? Check your spam folder or{' '}
          <Link to="/register" className="text-primary hover:underline">
            try registering again
          </Link>
        </p>
      </div>
    </div>
  );
}