import { cookies, headers } from 'next/headers';
import { LanguageProvider } from "./providers/LanguageProvider";
import { ClientLayout } from "./providers/ClientLayout";
import { ThemeProvider } from "./providers/ThemeProvider";
import TanstackProvider from "./providers/tanstack.provider";
import { Locale } from "./lib/dictionary";
import MainLayout from "./components/MainLayout";
import { getHomeData, getSocialLinks } from "@/lib/data";
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

const SITE_URL = "https://dranzr.com";
const SITE_DESCRIPTION = "dranzr — building modern digital products and experiences.";

/** OG/Twitter metadata so shared links (LinkedIn, X, Slack) render a real
 *  preview card instead of a bare URL. Image comes from the profile photo. */
export async function generateMetadata(): Promise<Metadata> {
  const home = await getHomeData().catch(() => null);
  const image = home?.userImage;
  return {
    metadataBase: new URL(SITE_URL),
    title: "dranzr",
    description: SITE_DESCRIPTION,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: "dranzr",
      title: "dranzr",
      description: SITE_DESCRIPTION,
      url: SITE_URL,
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: "dranzr" }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: "dranzr",
      description: SITE_DESCRIPTION,
      images: image ? [image] : undefined,
    },
  };
}

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

  // Structured data for SEO: Person entity with real profile data.
  const [homeData, socialLinks] = await Promise.all([getHomeData(), getSocialLinks()]);
  const jobTitle = homeData?.welcomeNote?.split('|')[0]?.trim() || 'Software Engineer';
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: homeData?.welcomeTitle ?? "Ronald Cardenas",
    jobTitle,
    description: homeData?.welcomeDescription ?? undefined,
    image: homeData?.userImage ?? undefined,
    url: SITE_URL,
    sameAs: socialLinks.map((s) => s.link).filter((l) => l.startsWith("http")),
  };

  return (
    <html lang={initialLang} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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