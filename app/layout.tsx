import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brindes Perfeitos - Brindes Promocionais Personalizados",
  description: "Catalogo completo de brindes promocionais personalizados para sua empresa. Produtos de qualidade dos melhores fornecedores do Brasil.",
  keywords: "brindes, brindes promocionais, brindes personalizados, brindes corporativos, brindes empresariais",
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
