export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === "/privacy" || url.pathname === "/privacy/") {
      return new Response(PRIVACY_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    
    return new Response("Tessera Lumen", { status: 200 });
  }
};

const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy - Tessera Lumen</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, serif; background: #060810; color: #f0e8d8; max-width: 720px; margin: 0 auto; padding: 40px 24px 80px; line-height: 1.8; }
  h1 { color: #D4AF37; font-size: 1.8rem; text-align: center; margin-bottom: 8px; letter-spacing: 2px; }
  h2 { color: #D4AF37; font-size: 1rem; margin: 28px 0 12px; letter-spacing: 1px; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 6px; }
  p { margin: 0 0 14px; color: #e8dcc8; }
  ul { list-style: none; padding: 0; margin: 8px 0 14px; }
  li { margin: 6px 0; padding-left: 16px; position: relative; }
  li::before { content: "\\25C6"; position: absolute; left: 0; color: rgba(212,175,55,0.5); font-size: 0.6rem; top: 4px; }
  a { color: #D4AF37; }
  .subtitle { text-align: center; font-size: 0.8rem; color: rgba(212,175,55,0.5); letter-spacing: 2px; margin-bottom: 32px; }
  .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(212,175,55,0.15); text-align: center; font-size: 0.75rem; color: rgba(212,175,55,0.3); }
  .chinese { margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(212,175,55,0.15); }
</style>
</head>
<body>

<h1>Privacy Policy</h1>
<p class="subtitle">TESSERA LUMEN - ORACLE OF THE SOUL</p>

<h2>Application and Developer Information</h2>
<p><strong>Application Name:</strong> Tessera Lumen</p>
<p><strong>Developer:</strong> Sylvana Anne Ellis</p>
<p><strong>Contact:</strong> holistic@963.co.za</p>
<p>This privacy policy applies to the Tessera Lumen mobile application and web application, developed and operated by Sylvana Anne Ellis.</p>

<h2>1. Information We Collect</h2>
<p>We collect the following personal information when you use our app:</p>
<ul>
<li>Name (for personalising your reading experience)</li>
<li>Email address (for delivering readings and account identification)</li>
<li>Date of birth (optional, for astrological personalisation)</li>
</ul>
<p>We do not collect location data, device identifiers, or biometric information.</p>

<h2>2. How We Use Your Information</h2>
<p>Your information is used exclusively to:</p>
<ul>
<li>Personalise your oracle reading experience</li>
<li>Process payments and manage subscriptions</li>
<li>Deliver advanced astrology readings</li>
<li>Communicate reading results to you</li>
</ul>
<p>We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>

<h2>3. Payment Processing</h2>
<p>Payments are processed by Huawei In-App Purchases (for AppGallery users) and PayFast (for web users). We do not store, process, or have access to your payment card details. Each payment processor operates under its own privacy policy.</p>

<h2>4. Data Storage and Security</h2>
<p>Your data is stored securely using Supabase (cloud database) with industry-standard encryption. Access is restricted to authorised systems only.</p>

<h2>5. Data Retention</h2>
<p>We retain your personal data for as long as your account is active or as needed to provide services. You may request deletion at any time.</p>

<h2>6. Your Rights</h2>
<p>You have the right to:</p>
<ul>
<li>Access your personal data</li>
<li>Request correction of inaccurate data</li>
<li>Request deletion of your data</li>
<li>Withdraw consent at any time</li>
</ul>
<p>To exercise these rights, contact us at <a href="mailto:holistic@963.co.za">holistic@963.co.za</a>.</p>

<h2>7. Third-Party Services</h2>
<p>We use the following third-party services:</p>
<ul>
<li>Supabase - secure database</li>
<li>Huawei IAP - in-app payment processing</li>
<li>PayFast - web payment processing</li>
</ul>

<h2>8. Consent</h2>
<p>By using Tessera Lumen, you consent to this privacy policy. The app provides an explicit "Agree" and "Reject" option on first launch. If you do not agree, you may choose "Reject" to decline and exit the application.</p>

<h2>9. Contact</h2>
<p>For questions or concerns regarding this privacy policy:</p>
<p>Email: <a href="mailto:holistic@963.co.za">holistic@963.co.za</a></p>

<div class="chinese">
<h2>Chinese Version</h2>
<p><strong>&#x5E94;&#x7528;&#x540D;&#x79F0;&#xFF1A;</strong>Tessera Lumen</p>
<p><strong>&#x5F00;&#x53D1;&#x8005;&#xFF1A;</strong>Sylvana Anne Ellis</p>
<p><strong>&#x8054;&#x7CFB;&#x65B9;&#x5F0F;&#xFF1A;</strong>holistic@963.co.za</p>
<p>&#x672C;&#x9690;&#x79C1;&#x653F;&#x7B56;&#x9002;&#x7528;&#x4E8E;Tessera Lumen&#x79FB;&#x52A8;&#x5E94;&#x7528;&#x7A0B;&#x5E8F;&#x548C;&#x7F51;&#x7EDC;&#x5E94;&#x7528;&#x7A0B;&#x5E8F;&#xFF0C;&#x7531;Sylvana Anne Ellis&#x5F00;&#x53D1;&#x548C;&#x8FD0;&#x8425;&#x3002;</p>
<p><strong>&#x6211;&#x4EEC;&#x6536;&#x96C6;&#x7684;&#x4FE1;&#x606F;&#xFF1A;</strong>&#x59D3;&#x540D;&#x3001;&#x7535;&#x5B50;&#x90AE;&#x4EF6;&#x5730;&#x5740;&#x3001;&#x51FA;&#x751F;&#x65E5;&#x671F;&#xFF08;&#x53EF;&#x9009;&#xFF09;&#x3002;&#x8FD9;&#x4E9B;&#x4FE1;&#x606F;&#x4EC5;&#x7528;&#x4E8E;&#x4E2A;&#x6027;&#x5316;&#x60A8;&#x7684;&#x9605;&#x8BFB;&#x4F53;&#x9A8C;&#x3002;</p>
<p><strong>&#x6570;&#x636E;&#x4F7F;&#x7528;&#xFF1A;</strong>&#x6211;&#x4EEC;&#x4F7F;&#x7528;&#x60A8;&#x7684;&#x4FE1;&#x606F;&#x63D0;&#x4F9B;&#x4E2A;&#x6027;&#x5316;&#x7684;&#x5854;&#x7F57;&#x724C;&#x9605;&#x8BFB;&#x670D;&#x52A1;&#x3002;&#x6211;&#x4EEC;&#x4E0D;&#x4F1A;&#x51FA;&#x552E;&#x6216;&#x5206;&#x4EAB;&#x60A8;&#x7684;&#x4E2A;&#x4EBA;&#x4FE1;&#x606F;&#x7ED9;&#x7B2C;&#x4E09;&#x65B9;&#x7528;&#x4E8E;&#x8425;&#x9500;&#x76EE;&#x7684;&#x3002;</p>
<p><strong>&#x652F;&#x4ED8;&#x5904;&#x7406;&#xFF1A;</strong>&#x6240;&#x6709;&#x652F;&#x4ED8;&#x901A;&#x8FC7;&#x534E;&#x4E3A;&#x5E94;&#x7528;&#x5185;&#x8D2D;&#x4E70;&#x5904;&#x7406;&#x3002;Tessera Lumen&#x4E0D;&#x5B58;&#x50A8;&#x3001;&#x5904;&#x7406;&#x6216;&#x8BBF;&#x95EE;&#x60A8;&#x7684;&#x94F6;&#x884C;&#x5361;&#x8BE6;&#x7EC6;&#x4FE1;&#x606F;&#x3002;</p>
<p><strong>&#x6570;&#x636E;&#x5B58;&#x50A8;&#xFF1A;</strong>&#x60A8;&#x7684;&#x6570;&#x636E;&#x5B89;&#x5168;&#x5730;&#x5B58;&#x50A8;&#x5728;Supabase&#xFF08;&#x4E91;&#x6570;&#x636E;&#x5E93;&#xFF09;&#x4E2D;&#xFF0C;&#x5E76;&#x53D7;&#x884C;&#x4E1A;&#x6807;&#x51C6;&#x52A0;&#x5BC6;&#x4FDD;&#x62A4;&#x3002;</p>
<p><strong>&#x60A8;&#x7684;&#x6743;&#x5229;&#xFF1A;</strong>&#x60A8;&#x53EF;&#x4EE5;&#x968F;&#x65F6;&#x901A;&#x8FC7;&#x8054;&#x7CFB;holistic@963.co.za&#x8BF7;&#x6C42;&#x5220;&#x9664;&#x60A8;&#x7684;&#x6570;&#x636E;&#x3002;</p>
<p><strong>&#x540C;&#x610F;&#xFF1A;</strong>&#x4F7F;&#x7528;&#x672C;&#x5E94;&#x7528;&#x5373;&#x8868;&#x793A;&#x60A8;&#x540C;&#x610F;&#x672C;&#x9690;&#x79C1;&#x653F;&#x7B56;&#x3002;&#x5E94;&#x7528;&#x7A0B;&#x5E8F;&#x5728;&#x9996;&#x6B21;&#x542F;&#x52A8;&#x65F6;&#x63D0;&#x4F9B;&#x660E;&#x786E;&#x7684;&#x201C;&#x540C;&#x610F;&#x201D;&#x548C;&#x201C;&#x62D2;&#x7EDD;&#x201D;&#x9009;&#x9879;&#x3002;&#x5982;&#x679C;&#x60A8;&#x4E0D;&#x540C;&#x610F;&#xFF0C;&#x8BF7;&#x505C;&#x6B62;&#x4F7F;&#x7528;&#x672C;&#x5E94;&#x7528;&#x3002;</p>
</div>

<div class="footer">
<p>&copy; 2026 Tessera Lumen. All rights reserved.</p>
<p>Sylvana Anne Ellis</p>
<p>Last updated: June 2026</p>
</div>

</body>
</html>`;