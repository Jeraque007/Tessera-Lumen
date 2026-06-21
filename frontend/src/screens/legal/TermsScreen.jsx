import LegalPage, { Section, P, Ul, Li } from "./LegalPage.jsx";

const CONTACT_EMAIL = "holistic@963.co.za";

export default function TermsScreen({ onBack }) {
  return (
    <LegalPage title="Terms of Use" subtitle="Last updated: January 2026" onBack={onBack}>

      <Section title="1. Acceptance of Terms">
        <P>By accessing or using the Tessera Lumen platform, application, or any associated services, you agree to be bound by these Terms of Use. If you do not agree, please discontinue use immediately.</P>
        <P>Tessera Lumen reserves the right to update these terms at any time. Continued use of the platform constitutes acceptance of any revised terms.</P>
      </Section>

      <Section title="2. Intellectual Property Ownership">
        <P>All content on the Tessera Lumen platform is the exclusive intellectual property of Tessera Lumen and its creators, including but not limited to:</P>
        <Ul>
          <Li>All 49 original tarot card artworks and visual designs</Li>
          <Li>All written card meanings, purposes, and interpretations</Li>
          <Li>All mantras, affirmations, and oracle text</Li>
          <Li>The Tessera Lumen name, logo, branding, and visual identity</Li>
          <Li>The oracle system, reading methodology, and pillar framework</Li>
          <Li>All application code, design, and user interface elements</Li>
        </Ul>
        <P>This content is protected under applicable copyright, trademark, and intellectual property laws.</P>
      </Section>

      <Section title="3. Prohibited Reproduction and Use">
        <P>You may not, without prior written permission from Tessera Lumen:</P>
        <Ul>
          <Li>Reproduce, copy, distribute, or republish any card artwork or written content</Li>
          <Li>Use any Tessera Lumen content for commercial purposes</Li>
          <Li>Create derivative works based on the oracle system, card designs, or written content</Li>
          <Li>Scrape, extract, or systematically download platform content</Li>
          <Li>Reverse engineer, decompile, or attempt to extract source code</Li>
          <Li>Use automated tools to access or interact with the platform</Li>
          <Li>Resell, sublicense, or transfer access to any third party</Li>
        </Ul>
      </Section>

      <Section title="4. Permitted Personal Use">
        <P>You are permitted to:</P>
        <Ul>
          <Li>Access and use the platform for personal, non-commercial spiritual guidance</Li>
          <Li>Download and retain your personal reading summaries for private use</Li>
          <Li>Share your personal reading summary with individuals for personal purposes</Li>
        </Ul>
        <P>Personal reading downloads are licensed for individual use only and may not be redistributed, published, or used commercially.</P>
      </Section>

      <Section title="5. Subscription and Payment Terms">
        <P>Subscription plans are billed monthly in US Dollars ($) via HMS IAP. By subscribing you agree to:</P>
        <Ul>
          <Li>Recurring monthly charges until cancellation</Li>
          <Li>Reading quotas as defined by your selected plan</Li>
          <Li>No rollover of unused readings to the following month</Li>
          <Li>Cancellation taking effect at the end of the current billing cycle</Li>
        </Ul>
        <P>One-time reading purchases are non-refundable once the reading has been revealed. Subscription refunds are considered on a case-by-case basis within 48 hours of charge.</P>
      </Section>

      <Section title="6. Disclaimers">
        <P>Tessera Lumen provides oracle and tarot readings for entertainment, personal reflection, and spiritual exploration purposes only. Readings do not constitute:</P>
        <Ul>
          <Li>Professional medical, psychological, or psychiatric advice</Li>
          <Li>Legal, financial, or investment guidance</Li>
          <Li>Predictive or guaranteed outcomes of any kind</Li>
        </Ul>
        <P>Users are solely responsible for decisions made based on platform content. Tessera Lumen accepts no liability for outcomes resulting from use of the service.</P>
      </Section>

      <Section title="7. User Responsibilities">
        <P>You agree to provide accurate information during registration and payment. You are responsible for maintaining the confidentiality of your account and for all activity under your account.</P>
        <P>You agree not to use the platform for any unlawful purpose or in any way that could damage, disable, or impair the service.</P>
      </Section>

      <Section title="8. Governing Law">
        <P>These Terms of Use are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the exclusive jurisdiction of the South African courts.</P>
      </Section>

      <Section title="9. Contact">
        <P>For questions, support, or enquiries regarding these Terms of Use, please contact us at:</P>
        <P><a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#D4AF37", fontFamily: "Cinzel, serif", letterSpacing: "0.1em" }}>{CONTACT_EMAIL}</a></P>
      </Section>

    </LegalPage>
  );
}
