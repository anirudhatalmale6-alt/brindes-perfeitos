'use client';

import { useEffect, useState, useCallback } from 'react';

interface Product {
  id: number; name: string; supplier_sku: string; cost_price: number | null; tier_count: number;
}

interface Tier {
  min_qty: number; unit_price: number;
}

export default function AdminPricing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // Bulk margin mode
  const [showBulk, setShowBulk] = useState(false);
  const [bulkMode, setBulkMode] = useState<'fixed' | 'margin'>('margin');
  const [bulkTiers, setBulkTiers] = useState<{ min_qty: number; value: number }[]>([
    { min_qty: 100, value: 50 },
    { min_qty: 300, value: 40 },
    { min_qty: 500, value: 35 },
    { min_qty: 1000, value: 30 },
  ]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/pricing');
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier_sku && p.supplier_sku.toLowerCase().includes(search.toLowerCase()))
  );

  async function openProductTiers(product: Product) {
    setEditingProduct(product);
    const res = await fetch(`/api/pricing?product_id=${product.id}`);
    const data = await res.json();
    const existing = (data.tiers || []).map((t: Tier) => ({ min_qty: t.min_qty, unit_price: t.unit_price }));
    setTiers(existing.length > 0 ? existing : [
      { min_qty: 100, unit_price: 0 },
      { min_qty: 300, unit_price: 0 },
      { min_qty: 500, unit_price: 0 },
    ]);
  }

  async function saveTiers() {
    if (!editingProduct) return;
    const validTiers = tiers.filter(t => t.min_qty > 0 && t.unit_price > 0);
    const res = await fetch('/api/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: editingProduct.id, tiers: validTiers }),
    });
    const data = await res.json();
    setMsg(data.message || 'Salvo!');
    setEditingProduct(null);
    loadProducts();
    setTimeout(() => setMsg(''), 3000);
  }

  async function applyBulk() {
    const ids = Array.from(selected);
    if (ids.length === 0) { setMsg('Selecione produtos primeiro'); setTimeout(() => setMsg(''), 3000); return; }

    let body: Record<string, unknown>;
    if (bulkMode === 'margin') {
      body = {
        product_ids: ids,
        margin_tiers: bulkTiers.map(t => ({ min_qty: t.min_qty, margin_percent: t.value })),
      };
    } else {
      body = {
        product_ids: ids,
        tiers: bulkTiers.map(t => ({ min_qty: t.min_qty, unit_price: t.value })),
      };
    }

    const res = await fetch('/api/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setMsg(data.message || 'Aplicado!');
    setSelected(new Set());
    setShowBulk(false);
    loadProducts();
    setTimeout(() => setMsg(''), 3000);
  }

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(p => p.id)));
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tabela de Precos</h1>
        {selected.size > 0 && (
          <button onClick={() => setShowBulk(true)}
            className="bg-lime-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-lime-700">
            Aplicar Precos em Massa ({selected.size} produtos)
          </button>
        )}
      </div>

      {msg && <div className="bg-green-50 text-green-700 p-3 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Search */}
      <div className="mb-4">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou codigo..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
      </div>

      {/* Bulk pricing modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-lg font-bold mb-4">Aplicar Precos em Massa ({selected.size} produtos)</h2>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setBulkMode('margin')}
                className={`px-3 py-1.5 rounded text-sm ${bulkMode === 'margin' ? 'bg-lime-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Margem %
              </button>
              <button onClick={() => setBulkMode('fixed')}
                className={`px-3 py-1.5 rounded text-sm ${bulkMode === 'fixed' ? 'bg-lime-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                Preco Fixo R$
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-3">
              {bulkMode === 'margin'
                ? 'Margem sobre o preco de custo (da API). Ex: 50% sobre R$1.00 = R$1.50'
                : 'Preco fixo de venda por unidade para cada faixa de quantidade'}
            </p>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2">Qtd Minima</th>
                  <th className="pb-2">{bulkMode === 'margin' ? 'Margem %' : 'Preco R$'}</th>
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {bulkTiers.map((tier, i) => (
                  <tr key={i}>
                    <td className="pb-2 pr-2">
                      <input type="number" value={tier.min_qty}
                        onChange={e => { const t = [...bulkTiers]; t[i].min_qty = Number(e.target.value); setBulkTiers(t); }}
                        className="w-full px-2 py-1.5 border rounded text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="number" value={tier.value} step="0.01"
                        onChange={e => { const t = [...bulkTiers]; t[i].value = Number(e.target.value); setBulkTiers(t); }}
                        className="w-full px-2 py-1.5 border rounded text-sm" />
                    </td>
                    <td className="pb-2">
                      <button onClick={() => setBulkTiers(bulkTiers.filter((_, j) => j !== i))}
                        className="text-red-500 hover:text-red-700 text-xs">X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={() => setBulkTiers([...bulkTiers, { min_qty: 0, value: 0 }])}
              className="text-sm text-lime-600 hover:underline mb-4 block">+ Adicionar faixa</button>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowBulk(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Cancelar</button>
              <button onClick={applyBulk}
                className="px-4 py-2 bg-lime-600 text-white rounded-lg text-sm hover:bg-lime-700">Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Individual product tier editor modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h2 className="text-lg font-bold mb-1">{editingProduct.name}</h2>
            <p className="text-sm text-gray-500 mb-1">COD: {editingProduct.supplier_sku}</p>
            {editingProduct.cost_price && (
              <p className="text-sm text-gray-500 mb-4">
                Preco de custo (API): <strong className="text-red-600">R$ {editingProduct.cost_price.toFixed(2)}</strong>
              </p>
            )}

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2">Qtd Minima</th>
                  <th className="pb-2">Preco Unitario R$</th>
                  {editingProduct.cost_price && <th className="pb-2">Margem</th>}
                  <th className="pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, i) => (
                  <tr key={i}>
                    <td className="pb-2 pr-2">
                      <input type="number" value={tier.min_qty}
                        onChange={e => { const t = [...tiers]; t[i].min_qty = Number(e.target.value); setTiers(t); }}
                        className="w-full px-2 py-1.5 border rounded text-sm" />
                    </td>
                    <td className="pb-2 pr-2">
                      <input type="number" value={tier.unit_price} step="0.01"
                        onChange={e => { const t = [...tiers]; t[i].unit_price = Number(e.target.value); setTiers(t); }}
                        className="w-full px-2 py-1.5 border rounded text-sm" />
                    </td>
                    {editingProduct.cost_price && (
                      <td className="pb-2 pr-2 text-xs text-gray-500">
                        {tier.unit_price > 0
                          ? `${(((tier.unit_price - editingProduct.cost_price) / editingProduct.cost_price) * 100).toFixed(0)}%`
                          : '-'}
                      </td>
                    )}
                    <td className="pb-2">
                      <button onClick={() => setTiers(tiers.filter((_, j) => j !== i))}
                        className="text-red-500 hover:text-red-700 text-xs">X</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={() => setTiers([...tiers, { min_qty: 0, unit_price: 0 }])}
              className="text-sm text-lime-600 hover:underline mb-4 block">+ Adicionar faixa</button>

            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingProduct(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">Cancelar</button>
              <button onClick={saveTiers}
                className="px-4 py-2 bg-lime-600 text-white rounded-lg text-sm hover:bg-lime-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Products table */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Carregando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 w-10">
                  <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={selectAll} />
                </th>
                <th className="text-left p-3">Produto</th>
                <th className="text-left p-3">Codigo</th>
                <th className="text-right p-3">Custo (API)</th>
                <th className="text-right p-3">Faixas</th>
                <th className="text-right p-3">Acao</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(p => (
                <tr key={p.id} className={`border-t ${selected.has(p.id) ? 'bg-blue-50' : ''}`}>
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                  </td>
                  <td className="p-3 font-medium text-gray-900">{p.name}</td>
                  <td className="p-3 text-gray-500">{p.supplier_sku}</td>
                  <td className="p-3 text-right text-gray-500">
                    {p.cost_price ? `R$ ${p.cost_price.toFixed(2)}` : '-'}
                  </td>
                  <td className="p-3 text-right">
                    {p.tier_count > 0 ? (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">{p.tier_count} faixas</span>
                    ) : (
                      <span className="text-gray-400 text-xs">Nenhuma</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={() => openProductTiers(p)}
                      className="text-lime-600 hover:text-lime-800 text-xs font-medium">Editar Precos</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 50 && (
            <div className="p-3 text-center text-sm text-gray-500">
              Mostrando 50 de {filtered.length} produtos. Use a busca para filtrar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
