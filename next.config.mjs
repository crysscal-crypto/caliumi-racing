/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },

  // Reindirizzamenti permanenti dal vecchio sito Google Sites
  async redirects() {
    return [
      { source: "/home-page", destination: "/", permanent: true },
      { source: "/home-page/gilera-cup", destination: "/campionati/trofeo-gilera", permanent: true },
      { source: "/home-page/trofeo-gilera", destination: "/campionati/trofeo-gilera", permanent: true },
      { source: "/home-page/gallery", destination: "/gallery", permanent: true },
      { source: "/home-page/gallery/gallery-:anno(\\d{4})", destination: "/gallery/anno/:anno", permanent: true },
      { source: "/home-page/gallery/:path*", destination: "/gallery", permanent: true },
      { source: "/home-page/my-carrier", destination: "/chi-sono", permanent: true },
      { source: "/home-page/my-career", destination: "/chi-sono", permanent: true },
      { source: "/home-page/time-line", destination: "/chi-sono", permanent: true },
      { source: "/home-page/timeline", destination: "/chi-sono", permanent: true },
      { source: "/home-page/the-bike", destination: "/moto", permanent: true },
      { source: "/home-page/the-bikes", destination: "/moto", permanent: true },
      { source: "/home-page/press-media", destination: "/articoli", permanent: true },
      { source: "/home-page/press-e-media", destination: "/articoli", permanent: true },
      { source: "/home-page/press-and-media", destination: "/articoli", permanent: true },
      { source: "/home-page/:path*", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
