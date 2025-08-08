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
          <Heading style={h1}>✈️ TravelEase</Heading>
        </Section>
        
        <Section style={content}>
          <Heading style={h2}>Verify your email address</Heading>
          
          <Text style={text}>
            Welcome to TravelEase! To complete your registration and start planning your amazing trips, 
            please verify your email address by clicking the button below.
          </Text>

          <Section style={buttonContainer}>
            <Button
              style={button}
              href={confirmationUrl}
            >
              Verify Email Address
            </Button>
          </Section>

          <Text style={text}>
            If the button doesn't work, you can also click on this link:
          </Text>
          
          <Link
            href={confirmationUrl}
            style={link}
          >
            {confirmationUrl}
          </Link>

          <Text style={text}>
            Or enter this verification code manually: <strong style={code}>{token}</strong>
          </Text>

          <Text style={footerText}>
            If you didn't create an account with TravelEase, you can safely ignore this email.
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            Happy travels! 🌍<br />
            The TravelEase Team
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