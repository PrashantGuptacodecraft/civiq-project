/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@civiq/auth", "@civiq/contracts"],
};

module.exports = nextConfig;
