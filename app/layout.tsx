import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Brindes Perfeitos - Brindes Promocionais Personalizados",
    template: "%s | Brindes Perfeitos",
  },
  description: "Catalogo completo de brindes promocionais personalizados para sua empresa. Melhor qualidade, melhor preco e melhor servico. Canetas, mochilas, chaveiros, squeezes e mais de 1.000 produtos personalizados dos melhores fornecedores do Brasil.",
  keywords: "brindes promocionais, brindes personalizados, brindes corporativos, brindes empresariais, canetas personalizadas, mochilas personalizadas, chaveiros personalizados, squeezes personalizadas, produtos promocionais, brindes para empresas, melhor qualidade, melhor preco, melhor servico, best quality, best price, best service",
  openGraph: {
    title: "Brindes Perfeitos - Brindes Promocionais Personalizados",
    description: "Encontre o brinde promocional perfeito para sua empresa. Catalogo completo com produtos personalizados de qualidade.",
    type: "website",
    locale: "pt_BR",
    siteName: "Brindes Perfeitos",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
