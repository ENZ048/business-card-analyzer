import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  Search, 
  Filter, 
  Eye,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Calendar,
  CreditCard,
  Building,
  ExternalLink,
  MapPin,
  Phone,
  X,
  FileText,
  Download
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { apiService } from '../../lib/api';

const ScannedCards = () => {
  const [cards, setCards] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    userId: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [currentPage, filters]);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getAdminScannedCards(
        currentPage,
        20,
        filters.search,
        filters.userId
      );
      setCards(response.cards);
      setPagination(response.pagination);
    } catch (err) {
      const errorMessage = err.toastMessage || err.response?.data?.error || 'Failed to fetch cards';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await apiService.exportAdminScannedCards(filters.search, filters.userId);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `scanned_cards_export_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel export started successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export cards. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const openCardDetail = (card) => {
    setSelectedCard(card);
    setShowDetailModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 w-full px-6 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-premium-black">Scanned Cards</h1>
          <p className="text-premium-gray">View all business cards scanned by users</p>
        </div>
        <Button
          onClick={handleExport}
          disabled={isExporting || cards.length === 0}
          className="bg-black text-white hover:bg-gray-800 transition-all flex items-center gap-2"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-premium-border">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Search by name, company, email..."
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            className="pl-10 bg-slate-50 border-slate-200 text-premium-black"
          />
        </div>
      </div>

      {/* Cards Table */}
      <div className="bg-white rounded-xl shadow-lg border border-premium-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="px-6 py-4 font-semibold">Contact Info</th>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Scanned At</th>
                <th className="px-6 py-4 font-semibold">Mode</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-6 text-center">
                      <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto"></div>
                    </td>
                  </tr>
                ))
              ) : cards.length > 0 ? (
                cards.map((card) => (
                  <tr key={card._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-premium-black font-semibold">{card.fullName || 'No Name'}</span>
                        <span className="text-slate-500 text-xs">{card.company || 'No Company'}</span>
                        {card.emails && card.emails.length > 0 && (
                          <span className="text-blue-600 text-xs mt-1">{card.emails[0]}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-700 text-sm font-medium">{card.userName}</span>
                        <span className="text-slate-500 text-xs">{card.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {formatDate(card.scannedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        card.sourceMode === 'bulk' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {card.sourceMode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCardDetail(card)}
                        className="text-slate-500 hover:text-premium-orange transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-12 h-12 opacity-20" />
                      <p className="text-lg font-medium">No scanned cards found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100 bg-slate-50">
            <div className="text-sm text-slate-500">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCards} total)
            </div>
            <div className="flex gap-2">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Detail Modal - Light Theme */}
      {showDetailModal && selectedCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-premium-black uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5 text-premium-orange" />
                Scanned Card Details
              </h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full"
              >
                <X className="w-6 h-6" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Left Column: Basic Info */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-premium-orange uppercase tracking-widest mb-3">Contact Person</h4>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-orange-50 border-2 border-orange-100 flex items-center justify-center">
                        <User className="text-premium-orange w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-premium-black leading-tight">{selectedCard.fullName || 'Unknown'}</p>
                        <p className="text-slate-500 mt-1">{selectedCard.title || 'No Title'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-premium-orange uppercase tracking-widest mb-3">Company</h4>
                    <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <Building className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold">{selectedCard.company || 'Not Specified'}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Contact Details */}
                <div className="flex-1 space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-premium-orange uppercase tracking-widest mb-3">Connect Info</h4>
                    <div className="space-y-2">
                      {selectedCard.emails?.map((email, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-slate-700 p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-sm truncate">{email}</span>
                        </div>
                      ))}
                      {selectedCard.phoneNumbers?.map((phone, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-slate-700 p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <span className="text-sm truncate">{phone}</span>
                        </div>
                      ))}
                      {selectedCard.website && (
                        <div className="flex items-center gap-3 text-slate-700 p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-colors">
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                          <span className="text-sm truncate">{selectedCard.website}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {selectedCard.address && (
                <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                  <h4 className="text-xs font-bold text-premium-orange uppercase tracking-widest mb-2">Location</h4>
                  <div className="flex gap-3 text-slate-700">
                    <MapPin className="w-5 h-5 text-premium-orange shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{selectedCard.address}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Scanned By</p>
                  <p className="text-premium-black font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    {selectedCard.userName}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Scanned On</p>
                  <p className="text-slate-700 font-medium">{formatDate(selectedCard.scannedAt)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2 bg-black text-white font-bold rounded-lg hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
              >
                Close View
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ScannedCards;
