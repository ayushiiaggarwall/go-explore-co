import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AuthHookPayload {
  type: string;
  event: string;
  session: any;
  user: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: AuthHookPayload = await req.json();
    console.log('Auth hook triggered:', payload);
    
    // Only handle user signup events
    if (payload.event === 'user.created' && payload.user) {
      const userEmail = payload.user.email;
      const userId = payload.user.id;
      const userName = payload.user.user_metadata?.full_name || userEmail.split('@')[0];
      
      console.log('Processing signup for:', userEmail);

      // Create a custom confirmation URL
      const confirmationToken = payload.user.confirmation_token;
      const siteUrl = Deno.env.get("SITE_URL") || "https://go-explore-co.lovable.app";
      const confirmationUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${confirmationToken}&type=signup&redirect_to=${siteUrl}/dashboard`;

      // Custom email HTML template
      const customEmailHtml = `
<!DOCTYPE html>
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
    <p style="font-size: 18px; margin-bottom: 20px;">Hi ${userName},</p>
    
    <p>Welcome to travelEase — we're thrilled to be a part of your travel journey! 🎉</p>
    
    <p>To help you plan your trips, book flights, hotels, and create the perfect itinerary, we just need to confirm your email address.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">🔵 Verify My Email</a>
    </div>
    
    <p style="font-size: 14px; color: #666;">If the button doesn't work, simply copy and paste this link into your browser:<br>
    <a href="${confirmationUrl}" style="color: #667eea; word-break: break-all;">${confirmationUrl}</a></p>
    
    <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea;">
      <h3 style="margin: 0 0 15px 0; color: #333;">Once verified, you'll have access to:</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Seamless flight and hotel bookings 🏨✈️</li>
        <li>Personalized itinerary planning 🗺️</li>
        <li>Stress-free travel support and guidance 🧳</li>
        <li>Exclusive travel deals and recommendations 🌟</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">If you didn't sign up for travelEase, feel free to ignore this message.</p>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      <p style="margin: 0; font-weight: bold; color: #667eea;">Thanks,<br>The travelEase Team</p>
    </div>
  </div>
</body>
</html>`;

      // Send custom email using Supabase's SMTP
      const emailData = {
        to: [userEmail],
        subject: "Welcome to travelEase! Let's Get Your Adventure Started 🌍✈️",
        html: customEmailHtml,
      };

      // Use Supabase's built-in SMTP to send email
      const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        console.error('Email sending failed:', await response.text());
        return new Response(
          JSON.stringify({ error: 'Failed to send email' }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('Custom verification email sent successfully to:', userEmail);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Custom verification email sent',
          email: userEmail 
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Event not handled', event: payload.event }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-custom-verification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);