import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (pdfjs-dist), sahte worker kurulumu için node_modules içindeki
  // pdf.worker.mjs dosyasını relative path ile dinamik import ediyor. Turbopack bunu
  // server action chunk'ına gömünce dosya yolu bozuluyor ("Cannot find module ... pdf.worker.mjs").
  // Bu paketleri bundle dışı (native require) bırakmak sorunu çözüyor.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  experimental: {
    serverActions: {
      // Base64 CV yüklemesi (maks. 5MB dosya) server action gövdesine sığsın diye artırıldı.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
