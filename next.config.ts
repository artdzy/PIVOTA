import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Base64 CV yüklemesi (maks. 5MB dosya) server action gövdesine sığsın diye artırıldı.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
