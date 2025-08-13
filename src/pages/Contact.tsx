import { useState } from 'react';
import { Phone } from 'lucide-react';
import { validateRequired, validatePhone } from '../utils/validation';
import Button from '../components/ui/Button';
import Input from '../components/ui/input';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!validateRequired(formData.phone)) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Valid phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('https://pzon8n.app.n8n.cloud/webhook/0c11cdc5-8085-4cba-a119-869630504a55', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone
        })
      });
      
      if (response.ok) {
        // Reset form
        setFormData({
          name: '',
          phone: ''
        });
        alert('Request submitted successfully! We will call you back soon.');
      } else {
        alert('Something went wrong. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-sky-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Get in touch with our travel experts. We're here to help make your travel dreams come true.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-card rounded-lg shadow-md p-8 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Get in touch with us</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              required
              className="w-full"
            />
            
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
              required
              className="w-full"
            />

            <Button
              type="submit"
              isLoading={isSubmitting}
              size="lg"
              className="w-full"
            >
              <Phone className="w-4 h-4 mr-2" />
              Get a Call
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}