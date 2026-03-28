'use client';

import { useState } from 'react';

interface QuoteFormProps {
  productId: number;
  productName: string;
}

export default function QuoteForm({ productId, productName }: QuoteFormProps) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', quantity: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        product_name: productName,
        ...form,
        quantity: form.quantity ? parseInt(form.quantity) : null,
      }),
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      setError('Erro ao enviar. Tente novamente.');
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <h3 className="text-xl font-bold text-green-800 mb-2">Orcamento Solicitado!</h3>
        <p className="text-green-600">Recebemos sua solicitacao para &quot;{productName}&quot;. Entraremos em contato em breve.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Solicitar Orcamento</h2>
      <p className="text-gray-500 mb-6">Preencha o formulario abaixo para receber um orcamento para: <strong>{productName}</strong></p>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
          <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
          <input type="text" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
          <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Ex: 100" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
          <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3}
            placeholder="Detalhes sobre personalizacao, cores, prazos..." />
        </div>
        <div className="md:col-span-2">
          <button type="submit" className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600">
            Enviar Solicitacao
          </button>
        </div>
      </form>
    </div>
  );
}
