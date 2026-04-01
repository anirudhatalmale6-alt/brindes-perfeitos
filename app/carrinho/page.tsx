'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/lib/cart-context';

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, clearCart, totalItems } = useCart();
  const [form, setForm] = useState({ name: '', company: '', email: '', whatsapp: '', message: '', _hp: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form._hp) return;
    if (items.length === 0) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/cart-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          items: items.map(i => ({
            id: i.id,
            name: i.name,
            supplier_sku: i.supplier_sku,
            category_name: i.category_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
        clearCart();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao enviar. Tente novamente.');
      }
    } catch {
      setError('Erro de conexao. Tente novamente.');
    }
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meu Carrinho</h1>
          <p className="text-gray-500 mb-8">Selecione seus produtos e solicite um orcamento</p>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Pedido Enviado com Sucesso!</h2>
              <p className="text-green-600 text-lg mb-4">
                Seu orcamento em PDF foi enviado para o email informado e para nossa equipe.
              </p>
              <p className="text-green-600 mb-6">Entraremos em contato em ate 24 horas.</p>
              <Link href="/catalogo" className="bg-lime-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-lime-700 inline-block">
                Continuar Comprando
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-700 mb-2">Seu carrinho esta vazio</h2>
              <p className="text-gray-500 mb-6">Navegue pelo catalogo e adicione produtos ao seu carrinho.</p>
              <Link href="/catalogo" className="bg-amber-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-600 inline-block">
                Ver Catalogo
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h2 className="font-semibold text-gray-900">{totalItems} {totalItems === 1 ? 'produto' : 'produtos'} no carrinho</h2>
                      <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700">Limpar carrinho</button>
                    </div>
                  </div>

                  <div className="divide-y">
                    {items.map(item => (
                      <div key={item.id} className="p-4 flex gap-4">
                        {/* Image */}
                        <Link href={`/catalogo/${item.slug}`} className="flex-shrink-0">
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                            {item.image_main ? (
                              <img src={item.image_main} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </Link>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/catalogo/${item.slug}`} className="text-sm font-medium text-gray-900 hover:text-lime-600 line-clamp-2">
                            {item.name}
                          </Link>
                          {item.supplier_sku && (
                            <p className="text-xs text-gray-400 mt-0.5">Codigo: {item.supplier_sku}</p>
                          )}
                          {item.category_name && (
                            <p className="text-xs text-lime-600 mt-0.5">{item.category_name}</p>
                          )}

                          {/* Price */}
                          {item.unit_price && item.unit_price > 0 && (
                            <p className="text-sm font-bold text-green-700 mt-1">
                              R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / un.
                            </p>
                          )}

                          {/* Min order notice */}
                          {item.min_order && item.min_order > 1 && (
                            <p className="text-xs text-amber-600 mt-1">Pedido minimo: {item.min_order} un.</p>
                          )}

                          {/* Quantity + Remove */}
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center border border-gray-300 rounded">
                              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-sm">-</button>
                              <input type="number" min={item.min_order || 1} value={item.quantity}
                                onChange={e => updateQuantity(item.id, Math.max(item.min_order || 1, parseInt(e.target.value) || 1))}
                                className="w-12 text-center py-1 border-x border-gray-300 text-sm" />
                              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-sm">+</button>
                            </div>
                            {item.unit_price && item.unit_price > 0 && (
                              <span className="text-sm font-semibold text-gray-700">
                                = R$ {(item.unit_price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                            <button onClick={() => removeItem(item.id)}
                              className="text-xs text-red-500 hover:text-red-700">Remover</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                {items.some(i => i.unit_price && i.unit_price > 0) && (
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Total estimado:</span>
                      <span className="text-xl font-bold text-green-700">
                        R$ {items.reduce((sum, i) => sum + (i.unit_price || 0) * i.quantity, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">* Valor estimado baseado na tabela de precos. O valor final sera confirmado no orcamento.</p>
                  </div>
                )}

                <Link href="/catalogo" className="inline-block text-lime-600 hover:underline text-sm font-medium">
                  Continuar adicionando produtos
                </Link>
              </div>

              {/* Quote Form */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Solicitar Orcamento</h2>
                  <p className="text-sm text-gray-500 mb-4">Preencha seus dados para receber o orcamento em PDF por email.</p>

                  {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="hidden" aria-hidden="true">
                      <input type="text" tabIndex={-1} autoComplete="off" value={form._hp}
                        onChange={e => setForm(f => ({ ...f, _hp: e.target.value }))} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                      <input type="text" required value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Seu nome completo" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
                      <input type="text" required value={form.company}
                        onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Nome da empresa" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" required value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="seu@email.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
                      <input type="tel" required value={form.whatsapp}
                        onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="(11) 99999-9999" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observacoes</label>
                      <textarea value={form.message}
                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={3}
                        placeholder="Cores, prazos, personalizacao..." />
                    </div>

                    <button type="submit" disabled={submitting}
                      className="w-full bg-amber-500 text-white py-3 rounded-lg font-semibold hover:bg-amber-600 disabled:opacity-50">
                      {submitting ? 'Gerando orcamento...' : 'Enviar Pedido de Orcamento'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
