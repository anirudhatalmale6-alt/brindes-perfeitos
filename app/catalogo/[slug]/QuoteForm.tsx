'use client';

import { useState } from 'react';

interface QuoteFormProps {
  productId: number;
  productName: string;
}

export default function QuoteForm({ productId, productName }: QuoteFormProps) {
  const [form, setForm] = useState({
    name: '', company: '', email: '', whatsapp: '', quantity: '', message: '',
    _hp: '', // honeypot
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Honeypot check
    if (form._hp) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          product_name: productName,
          name: form.name,
          company: form.company,
          email: form.email,
          whatsapp: form.whatsapp,
          quantity: form.quantity ? parseInt(form.quantity) : null,
          message: form.message,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao enviar. Tente novamente.');
      }
    } catch {
      setError('Erro de conexao. Tente novamente.');
    }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <h3 className="text-xl font-bold text-green-800 mb-2">Produto Adicionado ao Carrinho!</h3>
        <p className="text-green-600">Recebemos seu pedido de &quot;{productName}&quot;. Entraremos em contato em breve com seu orcamento.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Adicionar ao Carrinho</h2>
      <p className="text-gray-500 mb-6">Preencha os dados abaixo para adicionar ao carrinho: <strong>{productName}</strong></p>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        {/* Honeypot - hidden from users */}
        <div className="hidden" aria-hidden="true">
          <input type="text" tabIndex={-1} autoComplete="off" value={form._hp}
            onChange={e => setForm(f => ({ ...f, _hp: e.target.value }))} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Seu nome completo" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
          <input type="text" required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="Nome da empresa" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="seu@email.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
          <input type="tel" required value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="(11) 99999-9999" />
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
          <button type="submit" disabled={submitting}
            className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50">
            {submitting ? 'Enviando...' : 'Adicionar ao Carrinho'}
          </button>
        </div>
      </form>
    </div>
  );
}
