import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3">Brindes<span className="text-amber-500">Perfeitos</span></h3>
            <p className="text-sm text-gray-400">
              Seu parceiro em brindes promocionais personalizados. Qualidade e variedade para destacar sua marca.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-3">Navegacao</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/catalogo" className="hover:text-white">Catalogo</Link></li>
              <li><Link href="/categorias" className="hover:text-white">Categorias</Link></li>
              <li><Link href="/sobre" className="hover:text-white">Sobre Nos</Link></li>
              <li><Link href="/contato" className="hover:text-white">Contato</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-white mb-3">Categorias</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/categorias/tecnologia" className="hover:text-white">Tecnologia</Link></li>
              <li><Link href="/categorias/escritorio" className="hover:text-white">Escritorio</Link></li>
              <li><Link href="/categorias/bolsas-e-mochilas" className="hover:text-white">Bolsas e Mochilas</Link></li>
              <li><Link href="/categorias/esporte-e-lazer" className="hover:text-white">Esporte e Lazer</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-3">Contato</h4>
            <ul className="space-y-2 text-sm">
              <li>contato@brindesperfeitos.com.br</li>
              <li>
                <Link href="/contato" className="bg-amber-500 text-white px-4 py-2 rounded-lg inline-block mt-2 hover:bg-amber-600 text-sm">
                  Solicitar Orcamento
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Brindes Perfeitos. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
