import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "3D 큐브 데모",
  description: "R3F와 WebGPU를 사용한 3D 큐브 데모",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
