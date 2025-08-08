import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface VerificationEmailProps {
  confirmationUrl: string;
  token: string;
}

export const VerificationEmail = ({
  confirmationUrl,
  token,
}: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for TravelEase</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={h1}>
            <span style={logoIcon}>✈️</span> TravelEase
          </Heading>
          <Text style={headerSubtext}>Your Journey Begins Here</Text>
        </Section>
        
        <Section style={content}>
          <Section style={welcomeSection}>
            <Heading style={h2}>Welcome aboard! 🎉</Heading>
            <Text style={welcomeText}>
              We're excited to have you join the TravelEase community! You're just one step away from 
              discovering amazing destinations, planning unforgettable trips, and creating memories that will last a lifetime.
            </Text>
          </Section>

          <Section style={verificationSection}>
            <Heading style={h3}>Verify your email address</Heading>
            <Text style={text}>
              To unlock all the features of TravelEase and start your travel journey, please verify your email address.
            </Text>

            <Section style={buttonContainer}>
              <Button
                style={button}
                href={confirmationUrl}
              >
                🔓 Verify My Email
              </Button>
            </Section>

            <Text style={alternativeText}>
              Having trouble with the button? Copy and paste this link into your browser:
            </Text>
            
            <Link
              href={confirmationUrl}
              style={link}
            >
              {confirmationUrl}
            </Link>

            <Section style={codeSection}>
              <Text style={codeLabel}>Or enter this verification code manually:</Text>
              <Text style={code}>{token}</Text>
            </Section>
          </Section>

          <Section style={featuresSection}>
            <Heading style={featuresTitle}>What awaits you:</Heading>
            <Text style={featureItem}>🏨 Discover amazing hotels and accommodations</Text>
            <Text style={featureItem}>✈️ Find the best flight deals</Text>
            <Text style={featureItem}>🎯 Get personalized travel recommendations</Text>
            <Text style={featureItem}>💱 Access our currency converter tool</Text>
            <Text style={featureItem}>📋 Plan and organize your complete itinerary</Text>
          </Section>

          <Section style={securitySection}>
            <Text style={securityText}>
              🔒 <strong>Security Notice:</strong> If you didn't create a TravelEase account, please ignore this email. 
              Your security is our priority.
            </Text>
          </Section>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Ready to explore the world? 🌍<br />
            <strong>The TravelEase Team</strong>
          </Text>
          <Text style={footerSubtext}>
            Making travel planning effortless, one trip at a time.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default VerificationEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const header = {
  padding: "32px 20px",
  textAlign: "center" as const,
  borderBottom: "1px solid #f0f0f0",
};

const content = {
  padding: "20px",
};

const h1 = {
  color: "#1a73e8",
  fontSize: "32px",
  fontWeight: "600",
  lineHeight: "40px",
  margin: "0",
};

const h2 = {
  color: "#333333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "16px 0",
  textAlign: "center" as const,
};

const text = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "16px 0",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#1a73e8",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "0 auto",
  maxWidth: "200px",
};

const link = {
  color: "#1a73e8",
  fontSize: "14px",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
};

const code = {
  backgroundColor: "#f4f4f4",
  border: "1px solid #ddd",
  borderRadius: "4px",
  color: "#333333",
  fontFamily: "monospace",
  fontSize: "14px",
  padding: "2px 4px",
};

const footer = {
  borderTop: "1px solid #f0f0f0",
  padding: "20px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
  textAlign: "center" as const,
};

const logoIcon = {
  fontSize: "36px",
  marginRight: "8px",
};

const headerSubtext = {
  color: "#666666",
  fontSize: "16px",
  margin: "8px 0 0 0",
  textAlign: "center" as const,
  fontStyle: "italic",
};

const welcomeSection = {
  backgroundColor: "#f8fbff",
  padding: "24px",
  borderRadius: "12px",
  margin: "24px 0",
  border: "1px solid #e3f2fd",
};

const welcomeText = {
  color: "#333333",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "16px 0 0 0",
  textAlign: "center" as const,
};

const verificationSection = {
  margin: "32px 0",
};

const h3 = {
  color: "#333333",
  fontSize: "20px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const alternativeText = {
  color: "#666666",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "24px 0 12px 0",
  textAlign: "center" as const,
};

const codeSection = {
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  textAlign: "center" as const,
  border: "1px solid #e9ecef",
};

const codeLabel = {
  color: "#666666",
  fontSize: "14px",
  margin: "0 0 8px 0",
  textAlign: "center" as const,
};

const featuresSection = {
  backgroundColor: "#fff8e1",
  padding: "24px",
  borderRadius: "12px",
  margin: "32px 0",
  border: "1px solid #fff3c4",
};

const featuresTitle = {
  color: "#e65100",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 16px 0",
  textAlign: "center" as const,
};

const featureItem = {
  color: "#333333",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "8px 0",
  paddingLeft: "8px",
};

const securitySection = {
  backgroundColor: "#f3e5f5",
  padding: "20px",
  borderRadius: "8px",
  margin: "32px 0",
  border: "1px solid #e1bee7",
};

const securityText = {
  color: "#4a148c",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
  textAlign: "center" as const,
};

const footerSubtext = {
  color: "#999999",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "8px 0 0 0",
  textAlign: "center" as const,
  fontStyle: "italic",
};