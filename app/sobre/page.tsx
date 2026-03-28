import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function SobrePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Sobre a Brindes Perfeitos</h1>

          <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Quem Somos</h2>
              <p className="text-gray-600 leading-relaxed">
                A Brindes Perfeitos e uma plataforma especializada em brindes promocionais personalizados,
                conectando empresas aos melhores fornecedores do Brasil. Oferecemos um catalogo completo
                com milhares de opcoes para todas as necessidades corporativas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Nossa Missao</h2>
              <p className="text-gray-600 leading-relaxed">
                Facilitar a escolha e aquisicao de brindes promocionais de qualidade, oferecendo
                variedade, praticidade e atendimento personalizado para que cada empresa encontre
                o brinde perfeito para sua marca.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Por que nos escolher?</h2>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                {[
                  { title: 'Catalogo Completo', desc: 'Milhares de produtos dos melhores fornecedores' },
                  { title: 'Personalizacao', desc: 'Diversos metodos de gravacao e impressao' },
                  { title: 'Qualidade', desc: 'Produtos selecionados e certificados' },
                  { title: 'Atendimento', desc: 'Suporte dedicado para seu projeto' },
                ].map(item => (
                  <div key={item.title} className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Nossos Fornecedores</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Trabalhamos com os maiores e mais conceituados fornecedores de brindes do Brasil,
                garantindo qualidade e variedade em nosso catalogo.
              </p>
              <div className="flex gap-6 flex-wrap">
                <div className="bg-gray-50 px-6 py-3 rounded-lg">
                  <span className="font-semibold text-gray-700">SpotGifts</span>
                </div>
                <div className="bg-gray-50 px-6 py-3 rounded-lg">
                  <span className="font-semibold text-gray-700">XBZ Brindes</span>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 text-center">
            <Link href="/contato" className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 text-lg inline-block">
              Entre em Contato
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
