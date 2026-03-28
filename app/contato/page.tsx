'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ContatoPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', quantity: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, quantity: form.quantity ? parseInt(form.quantity) : null }),
    });
    if (res.ok) setSubmitted(true);
    else setError('Erro ao enviar. Tente novamente.');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contato</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Solicite um orcamento ou entre em contato conosco. Responderemos em ate 24 horas.
          </p>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <h3 className="text-2xl font-bold text-green-800 mb-2">Mensagem Enviada!</h3>
              <p className="text-green-600 text-lg">Obrigado pelo contato. Responderemos em breve.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8">
              {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input type="text" required value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" required value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input type="tel" value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                    <input type="text" value={form.company}
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem *</label>
                  <textarea required value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={5}
                    placeholder="Conte-nos sobre seu projeto, produtos de interesse, quantidades, prazos..." />
                </div>

                <button type="submit"
                  className="bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-amber-600 text-lg">
                  Enviar Mensagem
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
