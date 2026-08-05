import SEO from "../../components/SEO.jsx";
import LegalPage, { Section, P, Ul, Li } from "./LegalPage.jsx";

const CONTACT_EMAIL = "holistic@963.co.za";

export default function PrivacyScreen({ onBack }) {
  return (
    <>
      <SEO title="Privacy Policy" description="Learn how Tessera Lumen protects your personal data and privacy. Our commitment to keeping your spiritual journey confidential." path="/privacy" />
      <LegalPage title="Privacy Policy" subtitle="Last updated: June 2026" onBack={onBack}>

      <Section title="Application and Developer Information">
        <P><strong>Application Name:</strong> Tessera Lumen</P>
        <P><strong>Developer:</strong> Sophia Code - Tessera Lumen</P>
        <P><strong>Contact:</strong> {CONTACT_EMAIL}</P>
        <P>This privacy policy applies to the Tessera Lumen mobile application and web application (app.963.co.za), developed and operated by Sophia Code - Tessera Lumen.</P>
      </Section>

      <Section title="1. Information We Collect">
        <P>When you use Tessera Lumen, we collect the following information:</P>
        <Ul>
          <Li>Name and email address (provided during personalisation)</Li>
          <Li>Date of birth (optional, used for personalisation only)</Li>
          <Li>Payment information (processed securely by PayFast - we do not store card details)</Li>
          <Li>Subscription status and reading history</Li>
        </Ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <P>Your information is used to:</P>
        <Ul>
          <Li>Personalise your oracle reading experience</Li>
          <Li>Process and manage your subscription or one-time payment</Li>
          <Li>Track your reading quota and subscription status</Li>
          <Li>Communicate important account or service updates</Li>
          <Li>Improve the platform experience</Li>
        </Ul>
        <P>We do not sell, rent, or share your personal information with third parties for marketing purposes.</P>
      </Section>

      <Section title="3. Payment Processing">
        <P>All payments are processed by PayFast, a PCI-DSS compliant payment gateway. Tessera Lumen does not store, process, or have access to your card details.</P>
        <P>Payment confirmation notifications (ITN) are received from PayFast to activate your subscription or reading access.</P>
      </Section>

      <Section title="4. Data Storage">
        <P>Your data is stored securely using Supabase (cloud database) with industry-standard encryption. Access is restricted to authorised systems only.</P>
      </Section>

      <Section title="5. Local Storage">
        <P>Tessera Lumen uses browser local storage to:</P>
        <Ul>
          <Li>Maintain your session state during a reading</Li>
          <Li>Store your subscription status locally for performance</Li>
        </Ul>
        <P>We do not use tracking cookies or third-party advertising cookies. No data is shared with advertising networks.</P>
      </Section>

      <Section title="6. Data Retention">
        <P>Personal information is retained for as long as your account is active or as required to provide the service. You may request deletion of your data at any time by contacting us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#D4AF37" }}>{CONTACT_EMAIL}</a>.</P>
      </Section>

      <Section title="7. Your Rights">
        <P>You have the right to:</P>
        <Ul>
          <Li>Access the personal information we hold about you</Li>
          <Li>Request correction of inaccurate information</Li>
          <Li>Request deletion of your personal data</Li>
          <Li>Withdraw consent at any time</Li>
        </Ul>
      </Section>

      <Section title="8. Third-Party Services">
        <P>Tessera Lumen integrates with the following third-party services:</P>
        <Ul>
          <Li>PayFast - payment processing</Li>
          <Li>Vercel - hosting and infrastructure</Li>
          <Li>Supabase - secure database and user management</Li>
        </Ul>
        <P>Each service operates under its own privacy policy.</P>
      </Section>

      <Section title="9. Contact">
        <P>For privacy-related enquiries, data requests, or to exercise your rights:</P>
        <P><a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#D4AF37", fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}>{CONTACT_EMAIL}</a></P>
        <P>We aim to respond to all enquiries within 2 business days.</P>
      </Section>

    </LegalPage>
    </>
  );
}

