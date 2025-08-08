import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { VerificationEmail } from "./_templates/verification-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET") || "your-webhook-secret";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  console.log("=== WEBHOOK RECEIVED ===");
  console.log("Method:", req.method);
  console.log("Headers:", Object.fromEntries(req.headers));
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    console.log("Received webhook payload:", payload);
    
    // For development, we'll skip webhook verification
    // In production, uncomment the following lines:
    // const wh = new Webhook(hookSecret);
    // const webhookData = wh.verify(payload, headers);
    
    const webhookData = JSON.parse(payload);
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url }
    } = webhookData;

    console.log("Processing verification email for:", user.email);
    console.log("Email action type:", email_action_type);

    if (email_action_type === 'signup' || email_action_type === 'email_change') {
      const confirmationUrl = `${site_url || Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || site_url}`;
      
      const html = await renderAsync(
        React.createElement(VerificationEmail, {
          confirmationUrl,
          token,
        })
      );

      const emailResponse = await resend.emails.send({
        from: "TravelEase <no-reply@resend.dev>",
        to: [user.email],
        subject: "Verify your email address for TravelEase",
        html,
      });

      console.log("Verification email sent successfully:", emailResponse);

      return new Response(JSON.stringify({ success: true, data: emailResponse }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({ message: "Email type not handled" }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);