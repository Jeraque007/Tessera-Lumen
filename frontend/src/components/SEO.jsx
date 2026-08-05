import { Helmet } from "react-helmet-async";

const SITE_NAME = "Tessera Lumen";
const BASE_URL = "https://app.963.co.za";
const DEFAULT_IMAGE = `${BASE_URL}/assets/og-image.png`;

/**
 * SEO component for per-page meta tags.
 * Manages document title, description, Open Graph, Twitter Cards, and canonical URL.
 *
 * @param {object} props
 * @param {string} props.title - Page title (will be appended with site name)
 * @param {string} props.description - Meta description (max 160 chars recommended)
 * @param {string} [props.path] - URL path for canonical (e.g. "/privacy")
 * @param {string} [props.image] - Open Graph image URL
 * @param {string} [props.type] - OG type (default: "website")
 * @param {boolean} [props.noindex] - If true, tells search engines not to index
 * @param {object} [props.structuredData] - JSON-LD structured data object
 */
export default function SEO({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  structuredData = null,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      {/* Primary Meta */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
