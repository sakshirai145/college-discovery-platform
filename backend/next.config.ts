import type { NextConfig } from "next";

const corsOrigin =
  process.env.CORS_ORIGIN ||
  (process.env.NODE_ENV === "production"
    ? "https://collegehub-frontend-i3c3.onrender.com"
    : "http://localhost:3000");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: corsOrigin,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, Cookie",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
