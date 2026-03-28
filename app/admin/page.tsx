'use client';

import { useEffect, useState } from 'react';

interface Stats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  pendingQuotes: number;
  suppliers: { supplier: string; count: number }[];
  recentImports: { id: number; supplier: string; status: string; new_added: number; updated: number; started_at: string }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function loadStats() {
      const [prodRes, catRes, quoteRes] = await Promise.all([
        fetch('/api/products?limit=1'),
        fetch('/api/categories'),
        fetch('/api/contact'),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      const quoteData = await quoteRes.json();

      setStats({
        totalProducts: prodData.total || 0,
        activeProducts: prodData.total || 0,
        totalCategories: catData.length || 0,
        pendingQuotes: quoteData.filter((q: { status: string }) => q.status === 'new').length,
        suppliers: [],
        recentImports: [],
      });
    }
    loadStats();
  }, []);

  if (!stats) return <div className="text-gray-500">Carregando...</div>;

  const cards = [
    { label: 'Total Produtos', value: stats.totalProducts, color: 'bg-blue-500' },
    { label: 'Categorias', value: stats.totalCategories, color: 'bg-green-500' },
    { label: 'Orcamentos Pendentes', value: stats.pendingQuotes, color: 'bg-yellow-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-lg shadow p-6">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-white font-bold text-lg mb-3`}>
              {card.value}
            </div>
            <p className="text-gray-600 text-sm">{card.label}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Acoes Rapidas</h2>
        <div className="flex gap-4">
          <a href="/admin/produtos/novo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            Adicionar Produto
          </a>
          <a href="/admin/importar" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            Importar Produtos
          </a>
          <a href="/admin/orcamentos" className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 text-sm">
            Ver Orcamentos
          </a>
        </div>
      </div>
    </div>
  );
}
