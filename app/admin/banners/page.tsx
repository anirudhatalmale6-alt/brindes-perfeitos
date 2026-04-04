'use client';

import { useEffect, useState } from 'react';

interface Banner {
  id: number; title: string; subtitle: string; image_url: string;
  link_url: string; cta_text: string; sort_order: number; is_active: number;
}

const emptyForm = { title: '', subtitle: '', image_url: '', link_url: '', cta_text: '', sort_order: 0 };

function BannerFormFields({ form, updateField, uploading, onUpload }: {
  form: typeof emptyForm;
  updateField: (key: string, value: string | number) => void;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Titulo * <span className="text-gray-400 font-normal">(referencia interna)</span></label>
          <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" required
            placeholder="Ex: Garrafa Termica XBZ" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subtitulo <span className="text-gray-400 font-normal">(deixe vazio para banners prontos)</span></label>
          <input type="text" value={form.subtitle} onChange={e => updateField('subtitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Ex: Confira nossas canetas personalizadas" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Imagem do Banner</label>
        <div className="flex gap-2 items-center">
          <input type="text" value={form.image_url} onChange={e => updateField('image_url', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Cole uma URL ou envie uma imagem" />
          <label className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium ${uploading ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
            {uploading ? 'Enviando...' : 'Importar'}
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
        {form.image_url && (
          <div className="mt-2">
            <img src={form.image_url} alt="Preview" className="h-20 rounded border border-gray-200 object-cover" />
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Link de Destino</label>
          <input type="text" value={form.link_url} onChange={e => updateField('link_url', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="/catalogo/caneta-xyz ou /categorias/canetas" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Texto do Botao <span className="text-gray-400 font-normal">(deixe vazio para banners prontos)</span></label>
          <input type="text" value={form.cta_text} onChange={e => updateField('cta_text', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            placeholder="Ex: Ver Produto" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ordem</label>
          <input type="number" value={form.sort_order} onChange={e => updateField('sort_order', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>
    </div>
  );
}

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showAdd, setShowAdd] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await fetch('/api/banners');
    setBanners(await res.json());
  }

  useEffect(() => { load(); }, []);

  function updateField(key: string, value: string | number) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function addBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    await fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm(emptyForm);
    setShowAdd(false);
    load();
  }

  async function saveBanner(id: number) {
    await fetch('/api/banners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...form }),
    });
    setEditing(null);
    load();
  }

  async function toggleActive(id: number, current: number) {
    await fetch('/api/banners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: current ? 0 : 1 }),
    });
    load();
  }

  async function deleteBanner(id: number) {
    if (!confirm('Excluir este banner?')) return;
    await fetch('/api/banners', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function startEdit(b: Banner) {
    setEditing(b.id);
    setForm({
      title: b.title, subtitle: b.subtitle || '', image_url: b.image_url || '',
      link_url: b.link_url || '', cta_text: b.cta_text || '', sort_order: b.sort_order,
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'banners');
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) updateField('image_url', data.url);
    } catch { /* ignore */ }
    setUploading(false);
    e.target.value = '';
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
        {!showAdd && (
          <button onClick={() => { setShowAdd(true); setForm(emptyForm); }}
            className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 text-sm">
            + Novo Banner
          </button>
        )}
      </div>

      {showAdd && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="font-semibold text-gray-700 mb-3">Novo Banner</h2>
          <form onSubmit={addBanner}>
            <BannerFormFields form={form} updateField={updateField} uploading={uploading} onUpload={handleImageUpload} />
            <div className="flex gap-2 mt-3">
              <button type="submit" className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 text-sm">
                Criar Banner
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setForm(emptyForm); }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Nenhum banner criado. Os banners padrao serao exibidos no site.
          </div>
        ) : (
          banners.map(b => (
            <div key={b.id} className={`bg-white rounded-lg shadow overflow-hidden ${!b.is_active ? 'opacity-60' : ''}`}>
              {editing === b.id ? (
                <div className="p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Editar Banner</h3>
                  <form onSubmit={(e) => { e.preventDefault(); saveBanner(b.id); }}>
                    <BannerFormFields form={form} updateField={updateField} uploading={uploading} onUpload={handleImageUpload} />
                    <div className="flex gap-2 mt-3">
                      <button type="submit" className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 text-sm">
                        Salvar
                      </button>
                      <button type="button" onClick={() => { setEditing(null); }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex items-stretch">
                  {/* Preview */}
                  <div className="w-48 flex-shrink-0 bg-gray-100" style={{ aspectRatio: '1920/500' }}>
                    {b.image_url ? (
                      <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full hero-gradient flex items-center justify-center">
                        <span className="text-white text-xs font-semibold opacity-80">Gradiente Padrao</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{b.title}</h3>
                        {b.subtitle && <p className="text-sm text-gray-500 mt-0.5">{b.subtitle}</p>}
                        <div className="flex gap-4 mt-2 text-xs text-gray-400">
                          {b.link_url && <span>Link: {b.link_url}</span>}
                          {b.cta_text && <span>Botao: {b.cta_text}</span>}
                          <span>Ordem: {b.sort_order}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleActive(b.id, b.is_active)}
                          className={`text-xs px-2 py-1 rounded ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {b.is_active ? 'Ativo' : 'Inativo'}
                        </button>
                        <button onClick={() => startEdit(b)} className="text-lime-600 text-sm">Editar</button>
                        <button onClick={() => deleteBanner(b.id)} className="text-red-600 text-sm">Excluir</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
        <p className="text-xs text-blue-700 font-semibold mb-1">Dica para banners prontos (XBZ, SpotGifts):</p>
        <p className="text-xs text-blue-600">
          Para usar banners prontos dos fornecedores: preencha o Titulo (apenas referencia interna), importe a imagem, e deixe Subtitulo e Texto do Botao VAZIOS. Assim a imagem aparece limpa, sem texto sobreposto.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Banners sem imagem usam o gradiente verde padrao. O banner inteiro e clicavel quando tem link de destino.
        </p>
      </div>
    </div>
  );
}
