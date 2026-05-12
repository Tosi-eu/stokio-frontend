import { assertFrontendEnvAtBuild } from "./env.validation.mjs";

assertFrontendEnvAtBuild();

function buildImageRemotePatterns() {
  const raw = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!raw?.trim()) return [];
  try {
    const trimmed = raw.trim();
    const u = new URL(
      /^https?:/i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );
    return [
      {
        protocol: u.protocol.replace(":", ""),
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: [
    "@mui/material",
    "@mui/icons-material",
    "@emotion/react",
    "@emotion/styled",
  ],
  images: {
    remotePatterns: buildImageRemotePatterns(),
  },
};

export default nextConfig;
