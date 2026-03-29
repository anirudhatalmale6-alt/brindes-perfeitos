'use client';

import { useEffect, useState } from 'react';

interface QuoteRequest {
  id: number; product_id: number; product_name: string;
  name: string; email: string; phone: string; whatsapp: string; company: string;
  quantity: number; message: string; status: string; created_at: string;
}

export default function AdminQuotes() {
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);

  async function load() {
    const res = await fetch('/api/contact');
    setQuotes(await res.json());
  }

  useEffect(() => { load(); }, []);

  const statusColors: Record<string, string> = {
    new: 'bg-yellow-100 text-yellow-700',
    contacted: 'bg-lime-100 text-lime-700',
    closed: 'bg-gray-100 text-gray-500',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Solicitacoes de Orcamento</h1>

      <div className="bg-white rounded-lg shadow">
        {quotes.length === 0 ? (
          <p className="p-8 text-center text-gray-500">Nenhuma solicitacao ainda.</p>
        ) : (
          <div className="divide-y">
            {quotes.map(q => (
              <div key={q.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{q.name}</span>
                    {q.company && <span className="text-gray-500 text-sm ml-2">({q.company})</span>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${statusColors[q.status] || ''}`}>
                    {q.status === 'new' ? 'Novo' : q.status === 'contacted' ? 'Contactado' : 'Fechado'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {q.email} {q.whatsapp && <span className="ml-2">| WhatsApp: <a href={`https://wa.me/${q.whatsapp.replace(/\D/g, '')}`} className="text-green-600 hover:underline">{q.whatsapp}</a></span>}
                </p>
                {q.product_name && (
                  <p className="text-sm text-lime-600 mt-1">Produto: {q.product_name}</p>
                )}
                {q.quantity && (
                  <p className="text-sm text-gray-600">Quantidade: {q.quantity}</p>
                )}
                {q.message && (
                  <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">{q.message}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">{q.created_at}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
