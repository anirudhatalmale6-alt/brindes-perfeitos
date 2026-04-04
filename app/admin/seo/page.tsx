'use client';

import { useState, useEffect, useCallback } from 'react';

interface SeoEntry {
  id: number; page_path: string; page_title: string | null;
  meta_description: string | null; meta_keywords: string | null;
  og_image: string | null; updated_at: string;
}

interface Product {
  id: number; name: string; slug: string; supplier_sku: string | null;
  description: string | null; short_description: string | null;
  category_name: string | null; colors: string | null;
  specs: string | null; image_main: string | null;
  seo_score?: number;
}

interface SeoCheck {
  label: string; status: 'good' | 'ok' | 'bad'; detail: string;
}

function analyzeSeo(p: Product): { score: number; checks: SeoCheck[] } {
  const checks: SeoCheck[] = [];
  let score = 0;
  const maxScore = 10;

  // 1. Title length
  const titleLen = p.name.length;
  if (titleLen >= 20 && titleLen <= 60) { checks.push({ label: 'Titulo', status: 'good', detail: `${titleLen} chars (ideal: 20-60)` }); score += 2; }
  else if (titleLen > 10) { checks.push({ label: 'Titulo', status: 'ok', detail: `${titleLen} chars (ideal: 20-60)` }); score += 1; }
  else { checks.push({ label: 'Titulo', status: 'bad', detail: `${titleLen} chars - muito curto` }); }

  // 2. Description
  const descLen = (p.description || '').length;
  if (descLen >= 100 && descLen <= 500) { checks.push({ label: 'Descricao', status: 'good', detail: `${descLen} chars` }); score += 2; }
  else if (descLen > 30) { checks.push({ label: 'Descricao', status: 'ok', detail: `${descLen} chars - poderia ser melhor` }); score += 1; }
  else { checks.push({ label: 'Descricao', status: 'bad', detail: descLen === 0 ? 'Sem descricao' : `${descLen} chars - muito curta` }); }

  // 3. Has image
  if (p.image_main) { checks.push({ label: 'Imagem', status: 'good', detail: 'Tem imagem principal' }); score += 1; }
  else { checks.push({ label: 'Imagem', status: 'bad', detail: 'Sem imagem principal' }); }

  // 4. Has SKU (for keyword)
  if (p.supplier_sku) { checks.push({ label: 'Codigo', status: 'good', detail: `COD: ${p.supplier_sku}` }); score += 1; }
  else { checks.push({ label: 'Codigo', status: 'ok', detail: 'Sem codigo do fornecedor' }); }

  // 5. Has category
  if (p.category_name) { checks.push({ label: 'Categoria', status: 'good', detail: p.category_name }); score += 1; }
  else { checks.push({ label: 'Categoria', status: 'bad', detail: 'Sem categoria' }); }

  // 6. Has colors
  if (p.colors) {
    try {
      const c = JSON.parse(p.colors);
      if (c.length > 0) { checks.push({ label: 'Cores', status: 'good', detail: `${c.length} cores` }); score += 1; }
    } catch { checks.push({ label: 'Cores', status: 'bad', detail: 'Sem cores' }); }
  } else { checks.push({ label: 'Cores', status: 'bad', detail: 'Sem cores' }); }

  // 7. Description contains keywords
  const desc = (p.description || '').toLowerCase();
  const keywords = ['personalizado', 'promocional', 'brinde', 'qualidade'];
  const found = keywords.filter(k => desc.includes(k));
  if (found.length >= 2) { checks.push({ label: 'Palavras-chave', status: 'good', detail: `${found.length}/4 keywords na descricao` }); score += 2; }
  else if (found.length >= 1) { checks.push({ label: 'Palavras-chave', status: 'ok', detail: `${found.length}/4 keywords - adicione mais` }); score += 1; }
  else { checks.push({ label: 'Palavras-chave', status: 'bad', detail: 'Nenhuma keyword SEO na descricao' }); }

  return { score: Math.round((score / maxScore) * 100), checks };
}

function generateSeoDescription(p: Product): string {
  const name = p.name;
  const category = p.category_name || 'Brindes';
  const sku = p.supplier_sku ? ` (COD: ${p.supplier_sku})` : '';

  let colorText = '';
  if (p.colors) {
    try {
      const colors = JSON.parse(p.colors);
      if (colors.length > 0) {
        const names = colors.slice(0, 5).map((c: { name: string }) => c.name).join(', ');
        colorText = ` Disponivel nas cores: ${names}${colors.length > 5 ? ` e mais ${colors.length - 5} opcoes` : ''}.`;
      }
    } catch { /* ignore */ }
  }

  let specsText = '';
  if (p.specs) {
    try {
      const specs = JSON.parse(p.specs);
      const entries = Object.entries(specs).slice(0, 3);
      if (entries.length > 0) {
        specsText = ' Especificacoes: ' + entries.map(([k, v]) => `${k}: ${v}`).join(', ') + '.';
      }
    } catch { /* ignore */ }
  }

  return `${name}${sku} - Brinde promocional personalizado da categoria ${category}. ` +
    `Produto ideal para brindes corporativos, eventos empresariais e acoes promocionais. ` +
    `Personalize com a marca da sua empresa e surpreenda seus clientes e colaboradores.` +
    `${colorText}${specsText} ` +
    `Solicite seu orcamento e receba o melhor preco com qualidade garantida. ` +
    `Brindes Perfeitos - melhor qualidade, melhor preco, melhor servico.`;
}

export default function AdminSeo() {
  const [tab, setTab] = useState<'pages' | 'products'>('products');

  // Pages SEO state
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [editing, setEditing] = useState<SeoEntry | null>(null);
  const [form, setForm] = useState({ page_path: '', page_title: '', meta_description: '', meta_keywords: '', og_image: '' });
  const [statusMsg, setStatusMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Products SEO state
  const [products, setProducts] = useState<Product[]>([]);
  const [prodSearch, setProdSearch] = useState('');
  const [prodLoading, setProdLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<Product | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ score: number; checks: SeoCheck[] } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkMsg, setBulkMsg] = useState('');
  const [generatingAll, setGeneratingAll] = useState(false);

  async function loadEntries() {
    const res = await fetch('/api/seo');
    if (res.ok) setEntries(await res.json());
  }

  const loadProducts = useCallback(async () => {
    setProdLoading(true);
    const params = new URLSearchParams({ limit: '100', active: '1' });
    if (prodSearch) params.set('search', prodSearch);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    // Analyze each product's SEO score
    const withScores = data.products.map((p: Product) => ({
      ...p, seo_score: analyzeSeo(p).score,
    }));
    setProducts(withScores);
    setProdLoading(false);
  }, [prodSearch]);

  useEffect(() => { loadEntries(); }, []);
  useEffect(() => { if (tab === 'products') loadProducts(); }, [tab, loadProducts]);

  function startEdit(entry: SeoEntry) {
    setEditing(entry);
    setForm({ page_path: entry.page_path, page_title: entry.page_title || '', meta_description: entry.meta_description || '', meta_keywords: entry.meta_keywords || '', og_image: entry.og_image || '' });
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
    const res = await fetch('/api/seo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setStatusMsg('Configuracao SEO salva!'); setShowForm(false); loadEntries(); setTimeout(() => setStatusMsg(''), 3000); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Excluir esta configuracao SEO?')) return;
    await fetch('/api/seo', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    loadEntries();
  }

  function openAnalysis(p: Product) {
    setAnalyzing(p);
    setAnalysisResult(analyzeSeo(p));
  }

  async function applyAutoDescription(productId: number) {
    const p = products.find(pr => pr.id === productId);
    if (!p) return;
    const desc = generateSeoDescription(p);

    const res = await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId, description: desc }),
    });

    if (res.ok) {
      setBulkMsg('Descricao SEO aplicada!');
      loadProducts();
      if (analyzing?.id === productId) {
        const updated = { ...p, description: desc };
        setAnalyzing(updated);
        setAnalysisResult(analyzeSeo(updated));
      }
      setTimeout(() => setBulkMsg(''), 3000);
    }
  }

  async function bulkApplyDescriptions() {
    const ids = Array.from(selected);
    if (ids.length === 0) { setBulkMsg('Selecione produtos primeiro'); setTimeout(() => setBulkMsg(''), 3000); return; }

    let count = 0;
    for (const id of ids) {
      const p = products.find(pr => pr.id === id);
      if (!p) continue;
      const desc = generateSeoDescription(p);
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, description: desc }),
      });
      if (res.ok) count++;
    }

    setBulkMsg(`Descricao SEO aplicada a ${count} produtos!`);
    setSelected(new Set());
    loadProducts();
    setTimeout(() => setBulkMsg(''), 3000);
  }

  async function generateAllSeo() {
    if (!confirm('Isso vai gerar descricoes curtas e URLs SEO para TODOS os produtos. Continuar?')) return;
    setGeneratingAll(true);
    setBulkMsg('Gerando descricoes e URLs SEO...');
    try {
      const res = await fetch('/api/products/generate-seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update_slugs: true }),
      });
      const data = await res.json();
      setBulkMsg(data.message || `SEO gerado para ${data.updated} produtos!`);
      loadProducts();
    } catch {
      setBulkMsg('Erro ao gerar SEO');
    }
    setGeneratingAll(false);
    setTimeout(() => setBulkMsg(''), 5000);
  }

  function toggleSelect(id: number) {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function selectAll() {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map(p => p.id)));
  }

  function scoreColor(score: number) {
    if (score >= 70) return 'text-green-600 bg-green-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }

  function statusIcon(status: 'good' | 'ok' | 'bad') {
    if (status === 'good') return '✅';
    if (status === 'ok') return '⚠️';
    return '❌';
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">SEO - Otimizacao para Buscadores</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('products')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'products' ? 'bg-lime-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          Analise de Produtos
        </button>
        <button onClick={() => setTab('pages')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'pages' ? 'bg-lime-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          SEO de Paginas
        </button>
      </div>

      {statusMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{statusMsg}</div>}
      {bulkMsg && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">{bulkMsg}</div>}

      {/* PRODUCTS SEO TAB */}
      {tab === 'products' && (
        <div>
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Analise SEO dos produtos no estilo Yoast. Cada produto recebe uma pontuacao baseada em titulo, descricao, imagem, categoria, cores e palavras-chave.
            </p>
            <p className="text-xs text-gray-400">
              Use &quot;Gerar Descricao SEO&quot; para criar automaticamente descricoes otimizadas com palavras-chave como &quot;personalizado&quot;, &quot;promocional&quot;, &quot;melhor qualidade&quot;, &quot;melhor preco&quot;.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mb-4">
            <input type="text" value={prodSearch} onChange={e => setProdSearch(e.target.value)}
              placeholder="Buscar produto..." className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm" />
            <button onClick={loadProducts} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Buscar</button>
            <button onClick={generateAllSeo} disabled={generatingAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {generatingAll ? 'Gerando...' : 'Gerar Descricoes e URLs SEO (Todos)'}
            </button>
            {selected.size > 0 && (
              <button onClick={bulkApplyDescriptions}
                className="px-4 py-2 bg-lime-600 text-white rounded-lg text-sm hover:bg-lime-700">
                Gerar Descricao SEO ({selected.size} produtos)
              </button>
            )}
          </div>

          {/* Product analysis modal */}
          {analyzing && analysisResult && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{analyzing.name}</h2>
                    <p className="text-sm text-gray-500">{analyzing.supplier_sku}</p>
                  </div>
                  <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${scoreColor(analysisResult.score)}`}>
                    {analysisResult.score}%
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {analysisResult.checks.map((check, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span>{statusIcon(check.status)}</span>
                      <div>
                        <span className="font-medium">{check.label}:</span>{' '}
                        <span className="text-gray-600">{check.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-4">
                  <h3 className="text-sm font-semibold mb-2">Descricao atual:</h3>
                  <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded max-h-24 overflow-y-auto">
                    {analyzing.description || '(sem descricao)'}
                  </p>
                </div>

                <div className="border-t pt-4 mb-4">
                  <h3 className="text-sm font-semibold mb-2">Descricao SEO sugerida:</h3>
                  <p className="text-xs text-gray-600 bg-green-50 p-2 rounded max-h-24 overflow-y-auto">
                    {generateSeoDescription(analyzing)}
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAnalyzing(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Fechar</button>
                  <button onClick={() => applyAutoDescription(analyzing.id)}
                    className="px-4 py-2 bg-lime-600 text-white rounded-lg text-sm hover:bg-lime-700">
                    Aplicar Descricao SEO
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Products list */}
          {prodLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 w-10">
                      <input type="checkbox" checked={selected.size === products.length && products.length > 0} onChange={selectAll} />
                    </th>
                    <th className="text-left p-3">Produto</th>
                    <th className="text-left p-3">Codigo</th>
                    <th className="text-center p-3">Score SEO</th>
                    <th className="text-right p-3">Acao</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className={`border-t ${selected.has(p.id) ? 'bg-blue-50' : ''}`}>
                      <td className="p-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                      <td className="p-3 font-medium text-gray-900">{p.name}</td>
                      <td className="p-3 text-gray-500">{p.supplier_sku || '-'}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${scoreColor(p.seo_score || 0)}`}>
                          {p.seo_score || 0}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => openAnalysis(p)} className="text-lime-600 hover:text-lime-800 text-xs font-medium mr-3">Analisar</button>
                        <button onClick={() => applyAutoDescription(p.id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">Gerar SEO</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {products.length === 0 && (
                <div className="p-8 text-center text-gray-500 text-sm">Nenhum produto encontrado</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PAGES SEO TAB */}
      {tab === 'pages' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={startNew} className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 text-sm">+ Nova Pagina</button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow mb-6 p-6">
              <h2 className="text-lg font-semibold mb-4">{editing ? 'Editar SEO' : 'Nova Configuracao SEO'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caminho da Pagina</label>
                  <input type="text" value={form.page_path} onChange={e => setForm({ ...form, page_path: e.target.value })}
                    placeholder="/ ou /categorias" className="w-full px-3 py-2 border rounded-lg text-sm" disabled={!!editing} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titulo (Title Tag)</label>
                  <input type="text" value={form.page_title} onChange={e => setForm({ ...form, page_title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" maxLength={70} />
                  <p className={`text-xs mt-1 ${form.page_title.length > 60 ? 'text-red-500' : form.page_title.length > 40 ? 'text-green-500' : 'text-gray-400'}`}>{form.page_title.length}/70 chars</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meta Descricao</label>
                  <textarea value={form.meta_description} onChange={e => setForm({ ...form, meta_description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} maxLength={160} />
                  <p className={`text-xs mt-1 ${form.meta_description.length > 150 ? 'text-red-500' : form.meta_description.length > 100 ? 'text-green-500' : 'text-gray-400'}`}>{form.meta_description.length}/160 chars</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Palavras-chave</label>
                  <textarea value={form.meta_keywords} onChange={e => setForm({ ...form, meta_keywords: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Imagem OG</label>
                  <input type="text" value={form.og_image} onChange={e => setForm({ ...form, og_image: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-lime-600 text-white px-6 py-2 rounded-lg text-sm">Salvar</button>
                  <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg text-sm">Cancelar</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <table className="w-full">
              <thead><tr className="border-b text-left text-sm text-gray-500">
                <th className="px-4 py-3">Pagina</th><th className="px-4 py-3">Titulo</th><th className="px-4 py-3">Keywords</th><th className="px-4 py-3">Acoes</th>
              </tr></thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-lime-600">{entry.page_path}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{entry.page_title || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{entry.meta_keywords || '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => startEdit(entry)} className="text-lime-600 hover:underline text-sm mr-2">Editar</button>
                      <button onClick={() => handleDelete(entry.id)} className="text-red-600 hover:underline text-sm">Excluir</button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500 text-sm">Nenhuma configuracao SEO.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
