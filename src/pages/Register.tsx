import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateEmail, validateRequired, validatePassword } from '../utils/validation';
import Button from '../components/ui/Button';
import Input from '../components/ui/input';
import { BauhausCard } from '../components/ui/bauhaus-card';

export default function Register() {
  const { register, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!validateRequired(formData.name)) {
      newErrors.name = 'Name is required';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const result = await register(formData.name, formData.email, formData.password);
    
    if (result.success) {
      // Redirect to email confirmation page
      window.location.href = '/email-confirmation';
    } else {
      setErrors({ email: result.error || 'Registration failed. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Or{' '}
          <Link
            to="/login"
            className="font-medium text-primary hover:text-primary/80"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <BauhausCard 
          accentColor="hsl(var(--primary))"
          backgroundColor="hsl(var(--card))"
          borderRadius="1rem"
        >
          <form className="space-y-6 w-full text-black dark:text-foreground flex flex-col items-center" onSubmit={handleSubmit}>
            <Input
              label="Full name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              icon={<User className="w-5 h-5 text-gray-400" />}
              required
            />

            <Input
              label="Email address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              icon={<Mail className="w-5 h-5 text-gray-400" />}
              required
            />

            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              rightIcon={showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              onRightIconClick={() => setShowPassword(!showPassword)}
              required
            />

            <Input
              label="Confirm password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              icon={<Lock className="w-5 h-5 text-gray-400" />}
              rightIcon={showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              onRightIconClick={() => setShowConfirmPassword(!showConfirmPassword)}
              required
            />

            <div className="flex items-center">
              <input
                id="agree-terms"
                name="agree-terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded bg-background"
              />
              <label htmlFor="agree-terms" className="ml-2 block text-sm text-foreground">
                I agree to the{' '}
                <a href="#" className="text-primary hover:text-primary/80">
                  Terms and Conditions
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary hover:text-primary/80">
                  Privacy Policy
                </a>
              </label>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              Create account
            </Button>
          </form>

        </BauhausCard>
      </div>
    </div>
  );
}