-- Create email templates table to store custom templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading templates (for edge functions)
CREATE POLICY "Allow reading email templates" 
ON public.email_templates 
FOR SELECT 
USING (true);

-- Insert the custom verification email template
INSERT INTO public.email_templates (template_type, subject, html_content, text_content)
VALUES (
  'email_confirmation',
  'Welcome to travelEase! Let''s Get Your Adventure Started 🌍✈️',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to travelEase</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to travelEase! 🌍✈️</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 18px; margin-bottom: 20px;">Hi {{.Name}},</p>
    
    <p>Welcome to travelEase — we''re thrilled to be a part of your travel journey! 🎉</p>
    
    <p>To help you plan your trips, book flights, hotels, and create the perfect itinerary, we just need to confirm your email address.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{.ConfirmationURL}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">🔵 Verify My Email</a>
    </div>
    
    <p style="font-size: 14px; color: #666;">If the button doesn''t work, simply copy and paste this link into your browser:<br>
    <a href="{{.ConfirmationURL}}" style="color: #667eea; word-break: break-all;">{{.ConfirmationURL}}</a></p>
    
    <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
      <h3 style="margin: 0 0 15px 0; color: #333;">Once verified, you''ll have access to:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Seamless flight and hotel bookings 🏨✈️</li>
        <li>Personalized itinerary planning 🗺️</li>
        <li>Stress-free travel support and guidance 🧳</li>
        <li>Exclusive travel deals and recommendations 🌟</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">If you didn''t sign up for travelEase, feel free to ignore this message.</p>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="margin: 0; font-weight: bold; color: #667eea;">Thanks,<br>The travelEase Team</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{.Name}},

Welcome to travelEase — we''re thrilled to be a part of your travel journey! 

To help you plan your trips, book flights, hotels, and create the perfect itinerary, we just need to confirm your email address.

Click this link to verify your email: {{.ConfirmationURL}}

Once verified, you''ll have access to:
• Seamless flight and hotel bookings
• Personalized itinerary planning  
• Stress-free travel support and guidance
• Exclusive travel deals and recommendations

If you didn''t sign up for travelEase, feel free to ignore this message.

Thanks,
The travelEase Team'
);