'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/produtos', label: 'Produtos', icon: '📦' },
  { href: '/admin/categorias', label: 'Categorias', icon: '📁' },
  { href: '/admin/importar', label: 'Importar', icon: '⬇️' },
  { href: '/admin/orcamentos', label: 'Carrinho/Pedidos', icon: '🛒' },
  { href: '/admin/configuracoes', label: 'Configuracoes', icon: '⚙️' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') return <>{children}</>;

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-4 border-b">
          <Link href="/" className="text-lg font-bold text-lime-600">Brindes Perfeitos</Link>
          <p className="text-xs text-gray-500">Painel Admin</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                pathname === item.href ? 'bg-lime-50 text-lime-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600">Sair</button>
          <Link href="/" className="block mt-2 text-sm text-lime-600 hover:underline">Ver Site</Link>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
