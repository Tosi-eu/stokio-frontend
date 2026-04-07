import { assertFrontendEnvAtBuild } from "./env.validation.mjs";

assertFrontendEnvAtBuild();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: [
    "@mui/material",
    "@mui/icons-material",
    "@emotion/react",
    "@emotion/styled",
  ],
};

export default nextConfig;
