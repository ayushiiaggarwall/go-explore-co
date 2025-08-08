import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  type: string;
  table: string;
  record: any;
  schema: string;
  old_record: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload: WebhookPayload = await req.json();
    
    // Only handle signup events
    if (payload.record?.email_confirm_requested_at) {
      const userEmail = payload.record.email;
      const userId = payload.record.id;
      const userName = payload.record.raw_user_meta_data?.full_name || userEmail.split('@')[0];

      // Get the custom email template
      const { data: template, error: templateError } = await supabaseClient
        .from('email_templates')
        .select('*')
        .eq('template_type', 'email_confirmation')
        .single();

      if (templateError) {
        console.error('Error fetching template:', templateError);
        return new Response(
          JSON.stringify({ error: 'Template not found' }),
          { status: 500, headers: corsHeaders }
        );
      }

      // Generate confirmation URL (this will be the standard Supabase confirmation URL)
      const confirmationUrl = `${Deno.env.get("SUPABASE_URL")}/auth/v1/verify?token=${payload.record.confirmation_token}&type=signup&redirect_to=${Deno.env.get("SITE_URL") || "https://go-explore-co.lovable.app"}/dashboard`;

      // Replace template variables
      const htmlContent = template.html_content
        .replace(/\{\{\.Name\}\}/g, userName)
        .replace(/\{\{\.ConfirmationURL\}\}/g, confirmationUrl);

      const textContent = template.text_content
        .replace(/\{\{\.Name\}\}/g, userName)
        .replace(/\{\{\.ConfirmationURL\}\}/g, confirmationUrl);

      // Send email using Supabase's built-in email service
      const { error: emailError } = await supabaseClient.auth.admin.generateLink({
        type: 'signup',
        email: userEmail,
        options: {
          redirectTo: `${Deno.env.get("SITE_URL") || "https://go-explore-co.lovable.app"}/dashboard`,
          data: {
            custom_template: true,
            subject: template.subject,
            html_content: htmlContent,
            text_content: textContent
          }
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        return new Response(
          JSON.stringify({ error: emailError.message }),
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('Custom verification email sent successfully to:', userEmail);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Custom verification email sent' }),
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
      JSON.stringify({ message: 'No action needed' }),
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