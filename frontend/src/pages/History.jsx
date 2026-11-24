import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Trash2,
  Eye,
  FileDown,
  RefreshCw,
  AlertTriangle,
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import api from '../services/api';

export default function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Deletion modal state
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);

  const handleDownload = async (endpoint) => {
    try {
      await api.downloadFile(endpoint);
    } catch (error) {
      window.alert(error.message);
    }
  };

  // Detail preview modal state
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory({
        search: search || undefined,
        test_type: testTypeFilter,
        status: statusFilter,
        limit: 100,
      });
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [testTypeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteHistoryItem(itemToDelete.id);
      setHistory((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      setItemToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearAll = async () => {
    try {
      await api.clearAllHistory();
      setHistory([]);
      setClearAllConfirm(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
            <HistoryIcon size={15} />
            <span>SQLite Database Telemetry Archive</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white md:text-3xl">
            Diagnostic Test History
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Audit logs of network operations, latency measurements, and automata error classifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Download Link */}
          <button
            type="button"
            onClick={() => handleDownload(api.getCsvExportUrl())}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setClearAllConfirm(true)}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-rose-900/40 bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/40 transition disabled:opacity-40"
          >
            <Trash2 size={14} />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 p-4 backdrop-blur-md">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search target or error */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search size={15} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by target host or error string..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Test Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-sans">Type:</span>
            <select
              value={testTypeFilter}
              onChange={(e) => setTestTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Protocols</option>
              <option value="PING">PING</option>
              <option value="DNS">DNS</option>
              <option value="TRACEROUTE">TRACEROUTE</option>
              <option value="AUTO_DIAGNOSIS">AUTO_DIAGNOSIS</option>
              <option value="CONNECTIVITY">CONNECTIVITY</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-sans">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Outcomes</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
              <option value="WARNING">WARNING</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* History Records Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a]/90 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-slate-800 bg-slate-900/60 font-sans text-[11px] text-slate-400">
              <tr>
                <th className="py-3 px-4">Test ID</th>
                <th className="py-3 px-4">Protocol</th>
                <th className="py-3 px-4">Target Host / Hostname</th>
                <th className="py-3 px-4">Latency (RTT)</th>
                <th className="py-3 px-4">Packet Loss</th>
                <th className="py-3 px-4">Outcome</th>
                <th className="py-3 px-4">Error Description</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400 font-sans">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin text-cyan-400" />
                    <span>Loading diagnostic records...</span>
                  </td>
                </tr>
              ) : history.length > 0 ? (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-slate-400">#{record.id}</td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-slate-700">
                        {record.test_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-white truncate max-w-[150px]" title={record.target}>
                      {record.target}
                    </td>
                    <td className="py-3 px-4">{record.latency > 0 ? `${record.latency} ms` : '—'}</td>
                    <td className="py-3 px-4">
                      <span className={record.packet_loss > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {record.packet_loss}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={record.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[200px]" title={record.error_message}>
                      {record.error_message || 'None (Normal)'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">{record.timestamp}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedItem(record)}
                          title="View Technical Details"
                          className="rounded-lg p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setItemToDelete(record)}
                          title="Delete Record"
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500 font-sans">
                    No diagnostic records matching current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspection Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={`Diagnostic Record Details – #${selectedItem?.id}`}
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-400 block font-sans">Protocol / Test Type:</span>
                <span className="font-bold text-cyan-400">{selectedItem.test_type}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-400 block font-sans">Target Destination:</span>
                <span className="font-bold text-white">{selectedItem.target}</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-400 block font-sans">Recorded Latency:</span>
                <span className="font-bold text-slate-200">{selectedItem.latency} ms</span>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                <span className="text-slate-400 block font-sans">Packet Loss:</span>
                <span className="font-bold text-rose-400">{selectedItem.packet_loss}%</span>
              </div>
            </div>

            {selectedItem.error_message && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
                <span className="font-bold block mb-1">Captured Error String:</span>
                <span className="font-mono">{selectedItem.error_message}</span>
              </div>
            )}

            {selectedItem.details && Object.keys(selectedItem.details).length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-400 block mb-1">Payload JSON:</span>
                <pre className="max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-black/60 p-3 text-[11px] font-mono text-cyan-300">
                  {JSON.stringify(selectedItem.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
              <button
                type="button"
                onClick={() => handleDownload(api.getPdfDownloadUrl(selectedItem.id))}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-500 transition"
              >
                <Download size={14} />
                <span>Download PDF Report</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        title="Confirm Record Deletion"
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            Are you sure you want to permanently delete record{' '}
            <strong className="text-white">#{itemToDelete?.id} ({itemToDelete?.test_type} to {itemToDelete?.target})</strong> from the SQLite database?
          </p>
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
            <button
              onClick={() => setItemToDelete(null)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteItem}
              disabled={isDeleting}
              className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Clear All Confirmation Modal */}
      <Modal
        isOpen={clearAllConfirm}
        onClose={() => setClearAllConfirm(false)}
        title="Clear Entire Test History"
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            This operation will truncate all historical diagnostic test results stored in SQLite. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
            <button
              onClick={() => setClearAllConfirm(false)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleClearAll}
              className="rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition"
            >
              Clear All Records
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
