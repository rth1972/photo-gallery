import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import { SessionProvider } from "@/context/SessionProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "PixelBox",
  description: "Your photos, beautifully organized",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var t = localStorage.getItem('theme');
                if (!t) t = 'light';
                document.documentElement.setAttribute('data-theme', t);
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <SessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}