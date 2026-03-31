'use client';

import { useState, useEffect } from 'react';

interface SeoEntry {
  id: number;
  page_path: string;
  page_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  og_image: string | null;
  updated_at: string;
}

export default function AdminSeo() {
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [editing, setEditing] = useState<SeoEntry | null>(null);
  const [form, setForm] = useState({ page_path: '', page_title: '', meta_description: '', meta_keywords: '', og_image: '' });
  const [statusMsg, setStatusMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch('/api/seo');
    if (res.ok) setEntries(await res.json());
  }

  useEffect(() => { load(); }, []);

  function startEdit(entry: SeoEntry) {
    setEditing(entry);
    setForm({
      page_path: entry.page_path,
      page_title: entry.page_title || '',
      meta_description: entry.meta_description || '',
      meta_keywords: entry.meta_keywords || '',
      og_image: entry.og_image || '',
    });
    setShowForm(true);
  }

  function startNew() {
    setEditing(null);
    setForm({ page_path: '', page_title: '', meta_description: '', meta_keywords: '', og_image: '' });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.page_path) return;

    const res = await fetch('/api/seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatusMsg('Configuracao SEO salva com sucesso!');
      setShowForm(false);
      load();
      setTimeout(() => setStatusMsg(''), 3000);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta configuracao SEO?')) return;
    await fetch('/api/seo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SEO - Otimizacao para Buscadores</h1>
        <button onClick={startNew} className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 text-sm">
          + Nova Pagina
        </button>
      </div>

      {statusMsg && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm">{statusMsg}</div>
      )}

      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <p className="text-sm text-gray-600 mb-2">
          Configure o titulo, descricao e palavras-chave para cada pagina do site.
          Essas informacoes aparecem nos resultados de busca do Google e ajudam a melhorar o posicionamento.
        </p>
        <p className="text-xs text-gray-400">
          Dica: Use palavras-chave relevantes separadas por virgula. A descricao deve ter entre 120-160 caracteres.
        </p>
      </div>

      {/* Edit/New Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <h2 className="text-lg font-semibold mb-4">{editing ? 'Editar SEO' : 'Nova Configuracao SEO'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caminho da Pagina</label>
              <input
                type="text"
                value={form.page_path}
                onChange={e => setForm({ ...form, page_path: e.target.value })}
                placeholder="/ ou /categorias ou /sobre"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                disabled={!!editing}
                required
              />
              <p className="text-xs text-gray-400 mt-1">Ex: / (home), /categorias, /sobre, /contato</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Titulo da Pagina (Title Tag)</label>
              <input
                type="text"
                value={form.page_title}
                onChange={e => setForm({ ...form, page_title: e.target.value })}
                placeholder="Brindes Perfeitos - Brindes Promocionais Personalizados"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                maxLength={70}
              />
              <p className="text-xs text-gray-400 mt-1">{form.page_title.length}/70 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Descricao</label>
              <textarea
                value={form.meta_description}
                onChange={e => setForm({ ...form, meta_description: e.target.value })}
                placeholder="Descricao que aparece nos resultados do Google..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-gray-400 mt-1">{form.meta_description.length}/160 caracteres</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave (Keywords)</label>
              <textarea
                value={form.meta_keywords}
                onChange={e => setForm({ ...form, meta_keywords: e.target.value })}
                placeholder="brindes personalizados, brindes promocionais, brindes corporativos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
              <p className="text-xs text-gray-400 mt-1">Separe as palavras-chave por virgula</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagem OG (Open Graph)</label>
              <input
                type="text"
                value={form.og_image}
                onChange={e => setForm({ ...form, og_image: e.target.value })}
                placeholder="URL da imagem para compartilhamento em redes sociais"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-lime-600 text-white px-6 py-2 rounded-lg hover:bg-lime-700 text-sm">
                Salvar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing entries */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="px-4 py-3">Pagina</th>
              <th className="px-4 py-3">Titulo</th>
              <th className="px-4 py-3">Keywords</th>
              <th className="px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-lime-600">{entry.page_path}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{entry.page_title || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{entry.meta_keywords || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(entry)} className="text-lime-600 hover:underline text-sm">Editar</button>
                    <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">Nenhuma configuracao SEO ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
