'use client';

import { useState, useEffect, useRef } from 'react';

interface ImportRun {
  id: number; supplier: string; status: string; total_found: number;
  new_added: number; updated: number; errors: number; error_log: string;
  started_at: string; finished_at: string;
}

interface ImportProgress {
  running: boolean;
  progress: {
    total: number; processed: number; added: number;
    updated: number; errors: number; status: string;
  };
}

export default function AdminImport() {
  const [importingSpot, setImportingSpot] = useState(false);
  const [importingXbz, setImportingXbz] = useState(false);
  const [runs, setRuns] = useState<ImportRun[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress['progress'] | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  async function loadRuns() {
    try {
      const res = await fetch('/api/import/status');
      if (res.ok) setRuns(await res.json());
    } catch { /* ignore */ }
  }

  useEffect(() => { loadRuns(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, []);

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/import/spotgifts');
        if (res.ok) {
          const data: ImportProgress = await res.json();
          setProgress(data.progress);
          if (!data.running && data.progress.status !== 'idle') {
            // Import finished
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setImportingSpot(false);
            setStatusMsg(`Importacao concluida: ${data.progress.added} novos, ${data.progress.updated} atualizados, ${data.progress.errors} erros`);
            loadRuns();
          }
        }
      } catch { /* ignore */ }
    }, 3000);
  }

  async function triggerSpotImport() {
    setImportingSpot(true);
    setStatusMsg('Iniciando importacao SpotGifts... Isso pode levar alguns minutos.');
    setProgress({ total: 0, processed: 0, added: 0, updated: 0, errors: 0, status: 'starting' });
    try {
      const res = await fetch('/api/import/spotgifts', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        startPolling();
      } else {
        setStatusMsg(`Erro: ${data.error}`);
        setImportingSpot(false);
      }
    } catch (err) {
      setStatusMsg(`Erro na importacao: ${err}`);
      setImportingSpot(false);
    }
  }

  async function triggerXbzImport() {
    setImportingXbz(true);
    setStatusMsg('Iniciando importacao XBZ Brindes...');
    try {
      const res = await fetch('/api/import/xbzbrindes', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`XBZ importado: ${data.new_added} novos, ${data.updated} atualizados`);
      } else {
        setStatusMsg(`Erro: ${data.error}`);
      }
    } catch (err) {
      setStatusMsg(`Erro na importacao: ${err}`);
    }
    setImportingXbz(false);
    loadRuns();
  }

  async function handleCsvImport(e: React.FormEvent) {
    e.preventDefault();
    if (!csvFile) return;
    setCsvImporting(true);
    setStatusMsg('Importando CSV...');

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const res = await fetch('/api/import/xbzbrindes', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`CSV importado: ${data.new_added} novos, ${data.updated} atualizados`);
      } else {
        setStatusMsg(`Erro: ${data.error}`);
      }
    } catch (err) {
      setStatusMsg(`Erro: ${err}`);
    }
    setCsvImporting(false);
    setCsvFile(null);
    loadRuns();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Importar Produtos</h1>

      {statusMsg && (
        <div className="mb-6 p-4 bg-lime-50 text-lime-800 rounded-lg text-sm">{statusMsg}</div>
      )}

      {/* Progress bar */}
      {importingSpot && progress && (
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Importando SpotGifts...</span>
            <span>{progress.processed} produtos processados</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: progress.total > 0 ? `${Math.min(100, (progress.processed / Math.max(progress.total, 1)) * 100)}%` : '5%' }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>Novos: {progress.added}</span>
            <span>Atualizados: {progress.updated}</span>
            <span>Erros: {progress.errors}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* SpotGifts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">SpotGifts</h2>
          <p className="text-sm text-gray-500 mb-4">
            Importar catalogo completo de spotgifts.com.br.
            Aproximadamente 1.155 produtos. A importacao roda em segundo plano.
          </p>
          <button
            onClick={triggerSpotImport}
            disabled={importingSpot}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            {importingSpot ? 'Importando...' : 'Importar SpotGifts'}
          </button>
        </div>

        {/* XBZ Brindes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-2">XBZ Brindes</h2>
          <p className="text-sm text-gray-500 mb-4">
            Site protegido por Cloudflare. Use importacao CSV ou solicite acesso API ao fornecedor.
          </p>
          <form onSubmit={handleCsvImport} className="space-y-3">
            <input
              type="file" accept=".csv,.xlsx,.xls"
              onChange={e => setCsvFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-lime-50 file:text-lime-700 hover:file:bg-lime-100"
            />
            <button
              type="submit" disabled={!csvFile || csvImporting}
              className="bg-lime-600 text-white px-4 py-2 rounded-lg hover:bg-lime-700 disabled:opacity-50 text-sm"
            >
              {csvImporting ? 'Importando...' : 'Importar CSV'}
            </button>
          </form>
          <button
            onClick={triggerXbzImport}
            disabled={importingXbz}
            className="mt-3 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
          >
            {importingXbz ? 'Importando...' : 'Tentar Scraping XBZ'}
          </button>
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold p-4 border-b">Historico de Importacoes</h2>
        {runs.length === 0 ? (
          <p className="p-4 text-gray-500 text-sm">Nenhuma importacao realizada ainda.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Encontrados</th>
                <th className="px-4 py-3">Novos</th>
                <th className="px-4 py-3">Atualizados</th>
                <th className="px-4 py-3">Erros</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id} className="border-b">
                  <td className="px-4 py-3 text-sm">{r.supplier}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${
                      r.status === 'completed' ? 'bg-green-100 text-green-700' :
                      r.status === 'running' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{r.total_found}</td>
                  <td className="px-4 py-3 text-sm">{r.new_added}</td>
                  <td className="px-4 py-3 text-sm">{r.updated}</td>
                  <td className="px-4 py-3 text-sm">{r.errors}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.started_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CSV Format Guide */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-3">Formato CSV para Importacao</h2>
        <p className="text-sm text-gray-600 mb-2">O arquivo CSV deve conter as seguintes colunas:</p>
        <code className="text-xs bg-gray-100 p-3 rounded block">
          sku,nome,descricao,categoria,imagem_url,material,dimensoes,peso,cores,pedido_minimo
        </code>
        <p className="text-sm text-gray-500 mt-2">
          Codificacao: UTF-8 | Separador: virgula | Aspas: duplas para textos com virgula
        </p>
      </div>
    </div>
  );
}
