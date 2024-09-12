import { GeistSans } from "geist/font/sans";
import "./globals.css";
import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';


const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "My Kart.ai",
  description: "Easily answer any cooking questions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className="text-foreground">
      <MantineProvider>{children}</MantineProvider>
      </body>
    </html>
  );
}
