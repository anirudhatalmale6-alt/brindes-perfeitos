'use client';

import { useEffect, useState } from 'react';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number | null;
}

interface Order {
  order_id: string;
  name: string;
  email: string;
  company: string;
  whatsapp: string;
  message: string;
  status: string;
  created_at: string;
  items: OrderItem[];
  total_items: number;
  total_qty: number;
  total_value: number;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(orderId: string, newStatus: string) {
    await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, status: newStatus }),
    });
    load();
  }

  const statusColors: Record<string, string> = {
    new: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    contacted: 'bg-blue-100 text-blue-700 border-blue-300',
    quoted: 'bg-lime-100 text-lime-700 border-lime-300',
    closed: 'bg-gray-100 text-gray-500 border-gray-300',
  };

  const statusLabels: Record<string, string> = {
    new: 'Novo',
    contacted: 'Contactado',
    quoted: 'Orcamento Enviado',
    closed: 'Fechado',
  };

  function formatCurrency(value: number) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos do Carrinho</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{orders.length} pedido(s)</span>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">Todos</option>
            <option value="new">Novos</option>
            <option value="contacted">Contactados</option>
            <option value="quoted">Orcamento Enviado</option>
            <option value="closed">Fechados</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Carregando pedidos...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Nenhum pedido encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const isExpanded = expandedOrder === order.order_id;
            return (
              <div key={order.order_id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Order header - clickable */}
                <div className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedOrder(isExpanded ? null : order.order_id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-gray-900">{order.name}</span>
                        {order.company && <span className="text-gray-500 text-sm">({order.company})</span>}
                        <span className={`text-xs px-2 py-0.5 rounded border ${statusColors[order.status] || 'bg-gray-100 text-gray-500'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{order.email}</span>
                        {order.whatsapp && (
                          <a href={`https://wa.me/${order.whatsapp.replace(/\D/g, '')}`}
                            className="text-green-600 hover:underline"
                            onClick={e => e.stopPropagation()}>
                            WhatsApp: {order.whatsapp}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {order.total_items} {order.total_items === 1 ? 'item' : 'itens'} | {order.total_qty} un.
                      </div>
                      {order.total_value > 0 && (
                        <div className="text-sm font-bold text-lime-700">{formatCurrency(order.total_value)}</div>
                      )}
                      <div className="text-xs text-gray-400 mt-1">{formatDate(order.created_at)}</div>
                      <div className="text-xs text-gray-400 font-mono">{order.order_id}</div>
                    </div>
                  </div>
                  {order.message && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">{order.message}</p>
                  )}
                </div>

                {/* Expanded: items + actions */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2 text-gray-600">Produto</th>
                          <th className="text-right px-4 py-2 text-gray-600">Qtd</th>
                          <th className="text-right px-4 py-2 text-gray-600">Preco Unit.</th>
                          <th className="text-right px-4 py-2 text-gray-600">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {order.items.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <a href={`/admin/produtos/${item.product_id}`} className="text-blue-600 hover:underline">
                                {item.product_name}
                              </a>
                            </td>
                            <td className="text-right px-4 py-2">{item.quantity}</td>
                            <td className="text-right px-4 py-2">
                              {item.unit_price ? formatCurrency(item.unit_price) : '-'}
                            </td>
                            <td className="text-right px-4 py-2 font-medium">
                              {item.unit_price ? formatCurrency(item.unit_price * item.quantity) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {order.total_value > 0 && (
                        <tfoot>
                          <tr className="bg-gray-50 font-bold">
                            <td className="px-4 py-2" colSpan={3}>Total</td>
                            <td className="text-right px-4 py-2 text-lime-700">{formatCurrency(order.total_value)}</td>
                          </tr>
                        </tfoot>
                      )}
                    </table>

                    {/* Status actions */}
                    <div className="px-4 py-3 bg-gray-50 border-t flex items-center gap-2">
                      <span className="text-sm text-gray-600 mr-2">Alterar status:</span>
                      {['new', 'contacted', 'quoted', 'closed'].map(s => (
                        <button key={s} onClick={() => updateStatus(order.order_id, s)}
                          disabled={order.status === s}
                          className={`text-xs px-3 py-1 rounded border ${order.status === s ? 'opacity-50 cursor-not-allowed ' : 'hover:opacity-80 cursor-pointer '}${statusColors[s]}`}>
                          {statusLabels[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
