import { cookies, headers } from 'next/headers';
import { LanguageProvider } from "./providers/LanguageProvider";
import { ClientLayout } from "./providers/ClientLayout";
import { ThemeProvider } from "./providers/ThemeProvider";
import TanstackProvider from "./providers/tanstack.provider";
import { Locale } from "./lib/dictionary";
import MainLayout from "./components/MainLayout";
import type { Metadata } from "next";
import "./globals.css";

// Self-hosted fonts via @fontsource (served from npm — no build-time Google Fonts
// fetch, so Vercel/CI builds don't depend on fonts.gstatic.com being reachable).
// The CSS variables (--font-poiret / --font-open-sans / --font-mono) are defined
// in globals.css and consumed through the Tailwind fontFamily mapping.
import "@fontsource/poiret-one/latin-400.css";
import "@fontsource-variable/open-sans/wght.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-600.css";

export const metadata: Metadata = {
  title: "dranzr",
  description: "dranzr — building modern digital products and experiences.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  
  let initialLang: Locale = 'en'; // Default to English ("Rest of world")
  
  if (localeCookie && (localeCookie === 'es' || localeCookie === 'en')) {
     initialLang = localeCookie as Locale;
  } else {
     const headersList = await headers();
     const acceptLang = headersList.get('accept-language') || '';
     if (acceptLang.startsWith('es')) {
        initialLang = 'es'; // Spanish for LatAm/Spanish speakers
     }
  }

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  } else {
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {}
              })()
            `
          }}
        />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <TanstackProvider>
            <LanguageProvider initialLang={initialLang}>
              <ClientLayout>
                <MainLayout>
                  {children}
                </MainLayout>
              </ClientLayout>
            </LanguageProvider>
          </TanstackProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}