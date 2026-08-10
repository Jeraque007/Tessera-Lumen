import rateLimit from "express-rate-limit";

// --- RATE LIMITERS ---

// General API limiter: 100 requests per 15 minutes per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  validate: { xForwardedForHeader: false },
});

// Strict limiter for sensitive endpoints: 10 requests per 15 minutes
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded. Please wait before trying again." },
  validate: { xForwardedForHeader: false },
});

// Payment/promo limiter: 5 requests per 10 minutes
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many payment attempts. Please wait." },
  validate: { xForwardedForHeader: false },
});

// --- CORS WHITELIST ---

const ALLOWED_ORIGINS = [
  "https://app.963.co.za",
  "https://sophia-tarot-app.vercel.app",
  "https://verify.963.co.za",
  "http://localhost:5173",
  "http://localhost:4000",
];

// Also allow Vercel preview deployments (dynamic subdomains)
const isVercelPreview = (origin) => {
  if (!origin) return false;
  return /^https:\/\/sophia-tarot[^/]*\.vercel\.app/.test(origin);
};

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, server-to-server, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin) || isVercelPreview(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"), false);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Request-ID"],
  credentials: true,
  maxAge: 86400,
};

// --- API KEY AUTH MIDDLEWARE ---
// Protects sensitive endpoints. The key is set via env var API_SECRET_KEY.
// Frontend calls from your own domain don't need this (CORS handles it).
// This protects against third-party scripts hitting sensitive endpoints.

export const apiKeyAuth = (req, res, next) => {
  const apiKey = process.env.API_SECRET_KEY;

  // If no API_SECRET_KEY is configured, skip auth (dev mode)
  if (!apiKey) return next();

  // Public endpoints that don't need auth
  const publicPaths = [
    "/api/health",
    "/api/fx",
    "/api/promo/free-card/status",
    "/api/languages",
    "/api/payfast/notify",  // PayFast ITN callbacks need to reach us
  ];

  const isPublic = publicPaths.some(p => req.path.startsWith(p));
  if (isPublic) return next();

  // Check for key in header or referer from allowed origins
  const providedKey = req.headers["x-api-key"];
  const referer = req.headers["referer"] || req.headers["origin"] || "";
  const origin = req.headers["origin"] || "";
  const isFromAllowedOrigin = ALLOWED_ORIGINS.some(o => referer.startsWith(o) || origin.startsWith(o)) || isVercelPreview(referer) || isVercelPreview(origin);

  // Allow if: correct API key OR request comes from our own domains
  if (providedKey === apiKey || isFromAllowedOrigin) {
    return next();
  }

  return res.status(403).json({ error: "Forbidden" });
};

// --- SECURITY HEADERS MIDDLEWARE ---

export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
};

