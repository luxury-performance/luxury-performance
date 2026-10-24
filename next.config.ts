import type { NextConfig } from "next";
const config: NextConfig = { experimental: { agentUpgrade: "security" }, images: { qualities: [75, 90, 95] }, poweredByHeader: false, reactStrictMode: true, devIndicators: false };
export default config;
