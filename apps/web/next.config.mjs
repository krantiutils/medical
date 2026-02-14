import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@swasthya/database"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "doctorsewa.org",
      },
      {
        protocol: "https",
        hostname: "*.doctorsewa.org",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "@tiptap/react",
      "@tiptap/starter-kit",
      "embla-carousel-react",
      "leaflet",
      "lucide-react",
    ],
  },
};

export default withNextIntl(nextConfig);
