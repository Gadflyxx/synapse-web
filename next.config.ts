import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking: forbid all iframe embedding of this app.
  // Belt-and-suspenders: X-Frame-Options covers older browsers;
  // frame-ancestors covers modern browsers that honour CSP over XFO.
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'",
  },
  // Additional hardening headers (defence-in-depth)
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to every route.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
