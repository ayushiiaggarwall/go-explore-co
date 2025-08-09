import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { validatePassword } from '../utils/validation';
import Button from '../components/ui/Button';
import Input from '../components/ui/input';
import { BauhausCard } from '../components/ui/bauhaus-card';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidLink, setIsValidLink] = useState(false);

  useEffect(() => {
    const handlePasswordReset = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');
      
      console.log('=== PASSWORD RESET DEBUG ===');
      console.log('URL Params:', { 
        accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : 'MISSING',
        refreshToken: refreshToken ? `${refreshToken.substring(0, 10)}...` : 'EMPTY',
        type: type || 'MISSING'
      });
      
      if (!accessToken || type !== 'recovery') {
        console.log('❌ Invalid parameters');
        setError('Invalid reset link. Please request a new password reset.');
        setIsValidLink(false);
        return;
      }

      try {
        console.log('🔄 Verifying recovery token...');
        
        // For password reset, we need to verify the token properly
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: accessToken,
          type: 'recovery'
        });
        
        console.log('Verify OTP result:', { 
          hasSession: !!data.session,
          hasUser: !!data.user,
          error: error?.message 
        });
        
        if (error) {
          console.log('❌ Token verification failed:', error.message);
          setError('Invalid reset link. Please request a new password reset.');
          setIsValidLink(false);
        } else {
          console.log('✅ Token verified successfully');
          setIsValidLink(true);
          setError('');
        }
        
      } catch (err: any) {
        console.log('❌ Verification failed:', err.message);
        setError('Invalid reset link. Please request a new password reset.');
        setIsValidLink(false);
      }
    };

    handlePasswordReset();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidLink) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/login', { 
          state: { message: 'Password updated successfully. Please log in with your new password.' }
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Create new password
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your new password below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <BauhausCard 
          accentColor="hsl(var(--primary))"
          backgroundColor="hsl(var(--card))"
          borderRadius="1rem"
        >
          <form className="space-y-6 w-full" onSubmit={handleSubmit}>
            <div className="relative">
              <Input
                label="New Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm New Password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={error}
                icon={<Lock className="w-5 h-5 text-gray-400" />}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              Update password
            </Button>
          </form>
        </BauhausCard>
      </div>
    </div>
  );
}