import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Package,
  Calendar,
  ExternalLink,
  Copy,
  MessageSquare,
  ChevronRight,
  ShieldAlert,
  Navigation,
  Eye
} from 'lucide-react';
import { fetchDispatches } from '../../api/deliveryApi';
import { useApp } from '../../context/AppContext';
import { openWhatsApp, buildDeliveryConfirmationLinkMessage } from '../../utils/whatsapp';
import { formatMeters, formatDate } from '../../utils/formatters';
import CreateDispatchModal from '../delivery/CreateDispatchModal';
import DispatchDetailModal from '../delivery/DispatchDetailModal';
import DriverTransitModal from '../delivery/DriverTransitModal';
import ResolveDisputeModal from '../delivery/ResolveDisputeModal';

export default function DeliveriesView() {
  const { userRole, showToast } = useApp();

  const [dispatches, setDispatches] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    inTransit: 0,
    awaiting: 0,
    delivered: 0,
    partial: 0,
    disputed: 0,
    failed: 0
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDispatchId, setSelectedDispatchId] = useState(null);
  const [transitDispatch, setTransitDispatch] = useState(null);
  const [disputeDispatch, setDisputeDispatch] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchDispatches({
        status: statusFilter,
        party: searchQuery,
        dispatchId: searchQuery
      });
      if (res.data) {
        setDispatches(res.data.dispatches || []);
        if (res.data.metrics) setMetrics(res.data.metrics);
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Failed to load deliveries', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
          </span>
        );
      case 'Partially Delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" /> Partial ({status})
          </span>
        );
      case 'Delivery Disputed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5" /> Disputed
          </span>
        );
      case 'In Transit':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Truck className="w-3.5 h-3.5" /> In Transit
          </span>
        );
      case 'Picked Up':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Package className="w-3.5 h-3.5" /> Picked Up
          </span>
        );
      case 'Awaiting Receiver Confirmation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Awaiting OTP
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                Delivery Management
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                Secure Party Verification • Anti-Fraud OTP Protocol
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer shadow-2xs"
            title="Refresh Deliveries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {(userRole === 'Admin' || userRole === 'Supervisor') && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>Create Dispatch</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div
          onClick={() => setStatusFilter('All')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'All' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[11px] block font-medium ${statusFilter === 'All' ? 'text-slate-300' : 'text-slate-500'}`}>Total</span>
          <span className="text-xl font-black font-display">{metrics.total}</span>
        </div>

        <div
          onClick={() => setStatusFilter('In Transit')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'In Transit' ? 'bg-sky-600 text-white border-sky-600 shadow-md' : 'bg-white border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[11px] block font-medium ${statusFilter === 'In Transit' ? 'text-sky-100' : 'text-slate-500'}`}>In Transit</span>
          <span className="text-xl font-black font-display text-sky-600 group-hover:text-sky-700">{metrics.inTransit}</span>
        </div>

        <div
          onClick={() => setStatusFilter('Awaiting Receiver Confirmation')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Awaiting Receiver Confirmation' ? 'bg-amber-600 text-white border-amber-600 shadow-md' : 'bg-white border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[11px] block font-medium ${statusFilter === 'Awaiting Receiver Confirmation' ? 'text-amber-100' : 'text-slate-500'}`}>Awaiting OTP</span>
          <span className="text-xl font-black font-display text-amber-600">{metrics.awaiting}</span>
        </div>

        <div
          onClick={() => setStatusFilter('Delivered')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Delivered' ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[11px] block font-medium ${statusFilter === 'Delivered' ? 'text-emerald-100' : 'text-slate-500'}`}>Delivered</span>
          <span className="text-xl font-black font-display text-emerald-600">{metrics.delivered}</span>
        </div>

        <div
          onClick={() => setStatusFilter('Partially Delivered')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Partially Delivered' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[11px] block font-medium ${statusFilter === 'Partially Delivered' ? 'text-indigo-100' : 'text-slate-500'}`}>Partial</span>
          <span className="text-xl font-black font-display text-indigo-600">{metrics.partial}</span>
        </div>

        <div
          onClick={() => setStatusFilter('Delivery Disputed')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Delivery Disputed' ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[11px] block font-medium ${statusFilter === 'Delivery Disputed' ? 'text-rose-100' : 'text-slate-500'}`}>Disputed</span>
          <span className="text-xl font-black font-display text-rose-600">{metrics.disputed}</span>
        </div>

        <div
          onClick={() => setStatusFilter('Delivery Failed')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Delivery Failed' ? 'bg-slate-700 text-white border-slate-700 shadow-md' : 'bg-white border-slate-200/90 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[11px] block font-medium ${statusFilter === 'Delivery Failed' ? 'text-slate-200' : 'text-slate-500'}`}>Failed</span>
          <span className="text-xl font-black font-display text-slate-700">{metrics.failed}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Dispatch ID, Party, Driver, Vehicle..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'In Transit', 'Awaiting Receiver Confirmation', 'Delivered', 'Delivery Disputed'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'Awaiting Receiver Confirmation' ? 'Awaiting OTP' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-600" />
            <span>Loading factory dispatches...</span>
          </div>
        ) : dispatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-600 text-sm">No Dispatches Found</p>
            <p className="text-slate-400 mt-1">Create a factory dispatch to begin tracking driver transit and party verification.</p>
          </div>
        ) : (
          <div className="overflow-x-auto modern-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5 pl-5">Dispatch ID</th>
                  <th className="p-3.5">Customer / Party</th>
                  <th className="p-3.5">Fabric & Qty</th>
                  <th className="p-3.5">Tempo & Driver</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Dispatched Date</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dispatches.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Dispatch ID */}
                    <td className="p-3.5 pl-5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">{d.dispatchId}</div>
                      {d.salesOrderId && (
                        <span className="text-[10px] text-slate-400 font-mono block">Order: {d.salesOrderId}</span>
                      )}
                    </td>

                    {/* Party */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{d.partyName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{d.partyPhone}</div>
                    </td>

                    {/* Fabric & Qty */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{d.fabric}</div>
                      <div className="font-mono text-slate-600 text-[11px]">
                        {formatMeters(d.totalMetresDispatched)} ({d.totalRollsDispatched} rolls)
                      </div>
                    </td>

                    {/* Driver & Vehicle */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-800">{d.driver?.vehicleNumber}</div>
                      <div className="text-[11px] text-slate-500">{d.driver?.name} ({d.driver?.phone})</div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 whitespace-nowrap">
                      {renderStatusBadge(d.status)}
                    </td>

                    {/* Date */}
                    <td className="p-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatDate(d.dispatchedAt)}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 pr-5 whitespace-nowrap text-right space-x-1.5">
                      {/* View Details */}
                      <button
                        onClick={() => setSelectedDispatchId(d.dispatchId)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="View Details & Timeline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* Copy / Share WhatsApp Link */}
                      <button
                        onClick={() => {
                          const msg = buildDeliveryConfirmationLinkMessage(d);
                          openWhatsApp({ phone: d.partyPhone, message: msg });
                        }}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Share Confirmation Link on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Driver Transit Console */}
                      {d.status !== 'Delivered' && (
                        <button
                          onClick={() => setTransitDispatch(d)}
                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          title="Driver Transit Updates"
                        >
                          <Truck className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Dispute Resolution (Admin) */}
                      {(d.status === 'Delivery Disputed' || d.status === 'Partially Delivered') && userRole === 'Admin' && (
                        <button
                          onClick={() => setDisputeDispatch(d)}
                          className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Dispatch Modal */}
      <CreateDispatchModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={() => {
          loadData();
        }}
        showToast={showToast}
      />

      {/* Dispatch Detail Modal */}
      <DispatchDetailModal
        dispatchId={selectedDispatchId}
        isOpen={!!selectedDispatchId}
        onClose={() => setSelectedDispatchId(null)}
        onOpenDispute={(dsp) => {
          setSelectedDispatchId(null);
          setDisputeDispatch(dsp);
        }}
        showToast={showToast}
      />

      {/* Driver Transit Modal */}
      <DriverTransitModal
        dispatch={transitDispatch}
        isOpen={!!transitDispatch}
        onClose={() => setTransitDispatch(null)}
        onUpdated={loadData}
        showToast={showToast}
      />

      {/* Resolve Dispute Modal */}
      <ResolveDisputeModal
        dispatch={disputeDispatch}
        isOpen={!!disputeDispatch}
        onClose={() => setDisputeDispatch(null)}
        onResolved={loadData}
        showToast={showToast}
      />
    </div>
  );
}

