// Test script to call the verification email function directly
const testData = {
  user: {
    email: "test@example.com"
  },
  email_data: {
    token: "test-token-123",
    token_hash: "test-hash-456", 
    redirect_to: "https://8eb42e28-d39d-4a31-b16a-9a63d6597dd9.lovableproject.com/",
    email_action_type: "signup",
    site_url: "https://ioifldpjlfotqvtaidem.supabase.co"
  }
};

fetch('https://ioifldpjlfotqvtaidem.supabase.co/functions/v1/send-verification-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvaWZsZHBqbGZvdHF2dGFpZGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTkwODEsImV4cCI6MjA3MDIzNTA4MX0.4WgVJ79c5cDqq95FVNlsJVAGeA_CTUAe6OBY3p3MbS4'
  },
  body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));