import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverComponentsExternalPackages: [
    "puppeteer-core",
    "puppeteer",
    "puppeteer-extra",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin-recaptcha",
], serverActions: {
  bodySizeLimit: "10mb",
},
};

export default nextConfig;
