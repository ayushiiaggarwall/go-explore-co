import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
  Section,
  Row,
  Column,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface VerificationEmailProps {
  userName: string
  confirmationUrl: string
}

export const VerificationEmail = ({
  userName,
  confirmationUrl,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to travelEase! Let's Get Your Adventure Started 🌍✈️</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with gradient background */}
        <Section style={headerSection}>
          <Heading style={headerTitle}>Welcome to travelEase! 🌍✈️</Heading>
        </Section>
        
        <Section style={contentSection}>
          <Text style={greeting}>Hi {userName},</Text>
          
          <Text style={welcomeText}>
            Welcome to travelEase — we're thrilled to be a part of your travel journey! 🎉
          </Text>
          
          <Text style={instructionText}>
            To help you plan your trips, book flights, hotels, and create the perfect itinerary, 
            we just need to confirm your email address.
          </Text>
          
          <Text style={actionText}>
            👉 Click the button below to verify your email:
          </Text>
          
          {/* Verification Button */}
          <Section style={buttonSection}>
            <Button href={confirmationUrl} style={verifyButton}>
              🔵 Verify My Email
            </Button>
          </Section>
          
          <Text style={fallbackText}>
            If the button doesn't work, simply copy and paste this link into your browser:
          </Text>
          
          <Text style={linkText}>
            <Link href={confirmationUrl} style={verificationLink}>
              {confirmationUrl}
            </Link>
          </Text>
          
          {/* Features Box */}
          <Section style={featuresBox}>
            <Text style={featuresTitle}>Once verified, you'll have access to:</Text>
            <Text style={featureItem}>• Seamless flight and hotel bookings 🏨✈️</Text>
            <Text style={featureItem}>• Personalized itinerary planning 🗺️</Text>
            <Text style={featureItem}>• Stress-free travel support and guidance 🧳</Text>
            <Text style={featureItem}>• Exclusive travel deals and recommendations 🌟</Text>
          </Section>
          
          <Hr style={divider} />
          
          <Text style={disclaimerText}>
            If you didn't sign up for travelEase, feel free to ignore this message.
          </Text>
          
          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Thanks,<br />
              <strong>The travelEase Team</strong>
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default VerificationEmail

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '600px',
}

const headerSection = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '12px 12px 0 0',
  padding: '32px 24px',
  textAlign: 'center' as const,
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'center' as const,
}

const contentSection = {
  backgroundColor: '#ffffff',
  borderRadius: '0 0 12px 12px',
  padding: '32px 24px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
}

const greeting = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
}

const welcomeText = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
}

const instructionText = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
}

const actionText = {
  fontSize: '16px',
  color: '#374151',
  margin: '0 0 24px 0',
  fontWeight: '500',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const verifyButton = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '25px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '15px 30px',
  border: 'none',
  cursor: 'pointer',
}

const fallbackText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '24px 0 8px 0',
}

const linkText = {
  margin: '0 0 32px 0',
}

const verificationLink = {
  color: '#667eea',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  textDecoration: 'underline',
}

const featuresBox = {
  backgroundColor: '#f9fafb',
  borderLeft: '4px solid #667eea',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const featuresTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px 0',
}

const featureItem = {
  fontSize: '15px',
  color: '#374151',
  margin: '8px 0',
  lineHeight: '1.5',
}

const divider = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
}

const disclaimerText = {
  fontSize: '14px',
  color: '#6b7280',
  fontStyle: 'italic',
  margin: '24px 0 32px 0',
}

const footerSection = {
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
  paddingTop: '24px',
}

const footerText = {
  fontSize: '16px',
  color: '#667eea',
  margin: '0',
  textAlign: 'center' as const,
}