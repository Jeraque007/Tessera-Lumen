export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname === "/privacy" || url.pathname === "/privacy/") {
      return new Response(PRIVACY_HTML, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    
    return new Response("Tessera Lumen - Singapore Gateway", { status: 200 });
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
  .lang-section { margin-top: 40px; padding-top: 24px; border-top: 1px solid rgba(212,175,55,0.15); }
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

<h2>2. How We Use Your Information</h2>
<p>Your information is used exclusively to personalise your reading experience, process payments, and deliver results. We do not sell your data to third parties.</p>

<h2>3. Data Processing Location</h2>
<p>User data for the mobile application is processed in the <strong>Singapore</strong> region through Huawei AppGallery Connect infrastructure.</p>

<h2>4. Payment Processing</h2>
<p>Payments are processed by Huawei In-App Purchases (for AppGallery users) and PayFast (for global users). We do not store your payment card details.</p>

<div class="lang-section">
<h2>Chinese Version (中文)</h2>
<p>用户数据在新加坡地区通过华为 AppGallery Connect 基础设施进行处理。我们收集姓名、电子邮件和出生日期仅用于个性化您的阅读体验。我们不会向第三方出售您的数据。</p>
</div>

<div class="lang-section">
<h2>Malay Version (Bahasa Melayu)</h2>
<p>Data pengguna diproses di wilayah Singapura melalui infrastruktur Huawei AppGallery Connect. Kami mengumpul nama, e-mel dan tarikh lahir hanya untuk memperibadikan pengalaman bacaan anda. Kami tidak menjual data anda kepada pihak ketiga.</p>
</div>

<div class="lang-section">
<h2>Tamil Version (தமிழ்)</h2>
<p>பயனர் தரவு சிங்கப்பூர் பிராந்தியத்தில் ஹுவாய் AppGallery Connect உள்கட்டமைப்பு மூலம் செயலாக்கப்படுகிறது. உங்கள் வாசிப்பு அனுபவத்தைத் தனிப்பயனாக்க மட்டுமே நாங்கள் பெயர், மின்னஞ்சல் மற்றும் பிறந்த தேதியைச் சேகரிக்கிறோம். உங்கள் தரவை மூன்றாம் தரப்பினருக்கு நாங்கள் விற்க மாட்டோம்.</p>
</div>

<div class="footer">
<p>&copy; 2026 Tessera Lumen. All rights reserved.</p>
<p>Last updated: June 2026 | Singapore Region Build</p>
</div>

</body>
</html>`;