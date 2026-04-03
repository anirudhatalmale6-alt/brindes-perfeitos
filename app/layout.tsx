import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL('https://brindesperfeitos.com.br'),
  title: {
    default: "Brindes Perfeitos - Brindes Promocionais Personalizados",
    template: "%s | Brindes Perfeitos",
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  description: "Catalogo completo de brindes promocionais personalizados para sua empresa. Melhor qualidade, melhor preco e melhor servico. Canetas, mochilas, chaveiros, squeezes e mais de 4.000 produtos personalizados dos melhores fornecedores do Brasil.",
  keywords: "brindes promocionais, brindes personalizados, brindes corporativos, brindes empresariais, canetas personalizadas, mochilas personalizadas, chaveiros personalizados, squeezes personalizadas, produtos promocionais, brindes para empresas, brindes SP, brindes Sao Paulo, melhor qualidade, melhor preco",
  openGraph: {
    title: "Brindes Perfeitos - Brindes Promocionais Personalizados",
    description: "Encontre o brinde promocional perfeito para sua empresa. Catalogo completo com mais de 4.000 produtos personalizados de qualidade.",
    type: "website",
    locale: "pt_BR",
    siteName: "Brindes Perfeitos",
    url: 'https://brindesperfeitos.com.br',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Brindes Perfeitos - Brindes Promocionais Personalizados',
    description: 'Catalogo completo com mais de 4.000 brindes promocionais personalizados para sua empresa.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://brindesperfeitos.com.br',
  },
  verification: {},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Brindes Perfeitos',
              url: 'https://brindesperfeitos.com.br',
              description: 'Catalogo completo de brindes promocionais personalizados para sua empresa. Mais de 4.000 produtos dos melhores fornecedores do Brasil.',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'customer service',
                availableLanguage: 'Portuguese',
              },
              sameAs: [],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Brindes Perfeitos',
              url: 'https://brindesperfeitos.com.br',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://brindesperfeitos.com.br/catalogo?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
