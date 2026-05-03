import { assertFrontendEnvAtBuild } from "./env.validation.mjs";

assertFrontendEnvAtBuild();

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
