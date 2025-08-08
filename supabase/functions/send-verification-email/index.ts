import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { VerificationEmail } from './_templates/verification-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    const wh = new Webhook(hookSecret)
    
    const {
      user,
      email_data: { token_hash, redirect_to, email_action_type },
    } = wh.verify(payload, headers) as {
      user: {
        email: string
        user_metadata?: {
          full_name?: string
        }
      }
      email_data: {
        token_hash: string
        redirect_to: string
        email_action_type: string
      }
    }

    // Only send custom email for signup confirmations
    if (email_action_type !== 'signup') {
      return new Response(JSON.stringify({ message: 'Not a signup confirmation' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userName = user.user_metadata?.full_name || user.email.split('@')[0]
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

    console.log('Sending verification email to:', user.email)
    console.log('User name:', userName)

    // Render the React email template
    const html = await renderAsync(
      React.createElement(VerificationEmail, {
        userName,
        confirmationUrl,
      })
    )

    // Send the email using Resend
    const { error } = await resend.emails.send({
      from: 'travelEase <onboarding@resend.dev>',
      to: [user.email],
      subject: 'Welcome to travelEase! Let\'s Get Your Adventure Started 🌍✈️',
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Verification email sent successfully to:', user.email)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in send-verification-email function:', error)
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})