/**
 * SEO Component - Manages meta tags and structured data for better search ranking
 * Uses React 19 native metadata support (tags are automatically hoisted to <head>)
 */
const SEO = ({ 
  title = "Food Fantasy - Best Restaurant in Town",
  description = "Order delicious food from Food Fantasy. Fresh ingredients, amazing taste, quick delivery. Dine-in and takeaway available. Reserve your table now!",
  keywords = "restaurant, food delivery, dine-in, takeaway, online ordering, food fantasy, best restaurant",
  image = "/og-image.jpg",
  url = "https://foodfantasy-live.vercel.app",
  type = "website"
}) => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "Food Fantasy",
    "description": "Premium restaurant offering dine-in and delivery services",
    "image": `${url}/og-image.jpg`,
    "url": url,
    "telephone": "+91-XXXXXXXXXX",
    "priceRange": "$$",
    "servesCuisine": ["Indian", "Continental", "Chinese"],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Your Street Address",
      "addressLocality": "Your City",
      "addressRegion": "Your State",
      "postalCode": "Your Pincode",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 0.0,
      "longitude": 0.0
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "10:00",
        "closes": "23:00"
      }
    ],
    "acceptsReservations": "True"
  };

  return (
    <>
      {/* Primary Meta Tags - React 19 automatically hoists these to <head> */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="Food Fantasy" />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Food Fantasy" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </>
  );
};

export default SEO;
