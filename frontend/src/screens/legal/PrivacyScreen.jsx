import LegalPage, { Section, P, Ul, Li } from "./LegalPage.jsx";

const CONTACT_EMAIL = "holistic@963.co.za";

export default function PrivacyScreen({ onBack }) {
  return (
    <LegalPage title="Privacy Policy" subtitle="Last updated: January 2026" onBack={onBack}>

      <Section title="1. Information We Collect">
        <P>When you use Tessera Lumen, we collect the following information:</P>
        <Ul>
          <Li>Name and email address (provided during personalisation)</Li>
          <Li>Date of birth (used for personalisation only, not stored permanently)</Li>
          <Li>Phone number (optional, provided for reading delivery)</Li>
          <Li>Payment information (processed securely by PayFast  we do not store card details)</Li>
          <Li>Subscription status and reading history</Li>
          <Li>Language preference (stored locally on your device)</Li>
          <Li>Device type and browser information (for technical optimisation)</Li>
        </Ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <P>Your information is used to:</P>
        <Ul>
          <Li>Personalise your oracle reading experience</Li>
          <Li>Deliver your reading via email or WhatsApp if requested</Li>
          <Li>Process and manage your subscription or one-time payment</Li>
          <Li>Track your reading quota and subscription status</Li>
          <Li>Communicate important account or service updates</Li>
          <Li>Improve the platform experience</Li>
        </Ul>
        <P>We do not sell, rent, or share your personal information with third parties for marketing purposes.</P>
      </Section>

      <Section title="3. Payment Processing">
        <P>All payments are processed by PayFast, a PCI-DSS compliant payment gateway. Tessera Lumen does not store, process, or have access to your card details. PayFast&apos;s privacy policy governs the handling of your payment information.</P>
        <P>Payment confirmation notifications (ITN) are received from PayFast to activate your subscription or reading access.</P>
      </Section>

      <Section title="4. Translation Services">
        <P>If you select a language other than English, your reading content may be translated using the DeepL translation API. Translation requests are processed server-side. No personally identifiable information is included in translation requests.</P>
        <P>Translated content is cached to improve performance and reduce API usage.</P>
      </Section>

      <Section title="5. CRM and Communications">
        <P>With your consent, your name and email may be stored in our CRM system (Zoho CRM) for the purpose of follow-up communications related to your reading experience. You may opt out at any time by contacting us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#D4AF37" }}>{CONTACT_EMAIL}</a>.</P>
      </Section>

      <Section title="6. Local Storage and Cookies">
        <P>Tessera Lumen uses browser local storage to:</P>
        <Ul>
          <Li>Remember your language preference</Li>
          <Li>Maintain your session state during a reading</Li>
          <Li>Store your subscription status locally for performance</Li>
        </Ul>
        <P>We do not use tracking cookies or third-party advertising cookies. No data is shared with advertising networks.</P>
      </Section>

      <Section title="7. Data Retention">
        <P>Personal information is retained for as long as your account is active or as required to provide the service. You may request deletion of your data at any time by contacting us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#D4AF37" }}>{CONTACT_EMAIL}</a>. Payment records may be retained for legal and accounting purposes.</P>
      </Section>

      <Section title="8. Your Rights">
        <P>Under applicable data protection law, you have the right to:</P>
        <Ul>
          <Li>Access the personal information we hold about you</Li>
          <Li>Request correction of inaccurate information</Li>
          <Li>Request deletion of your personal data</Li>
          <Li>Withdraw consent for communications at any time</Li>
          <Li>Lodge a complaint with the relevant data protection authority</Li>
        </Ul>
      </Section>

      <Section title="9. Third-Party Services">
        <P>Tessera Lumen integrates with the following third-party services:</P>
        <Ul>
          <Li>PayFast  payment processing</Li>
          <Li>DeepL  translation services</Li>
          <Li>Zoho CRM  customer relationship management</Li>
          <Li>Vercel  hosting and infrastructure</Li>
          <Li>Supabase  secure database and user management</Li>
        </Ul>
        <P>Each service operates under its own privacy policy. We encourage you to review their policies.</P>
      </Section>

      <Section title="10. Contact">
        <P>For privacy-related enquiries, data requests, or to exercise your rights, please contact us directly:</P>
        <P><a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#D4AF37", fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}>{CONTACT_EMAIL}</a></P>
        <P>We aim to respond to all enquiries within 2 business days.</P>
      </Section>

    </LegalPage>
  );
}
