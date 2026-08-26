import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 이미지에 필요한 파일만 담기 위해 standalone 으로 뽑는다.
  output: "standalone",
};

export default nextConfig;
