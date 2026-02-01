import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Swasthya - Healthcare Directory",
  description: "Find verified healthcare professionals in Nepal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
