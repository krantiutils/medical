import path from "path";
import { fileURLToPath } from "url";
import createNextIntlPlugin from "next-intl/plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../../"),
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
