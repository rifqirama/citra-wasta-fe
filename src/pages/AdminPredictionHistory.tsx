import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import { Trash2, Download, Search, X, Image as ImageIcon } from "lucide-react";

import { Button } from "../components/elements/button";
import { Card } from "../components/elements/card";
import { Badge } from "../components/elements/badge";
import { Skeleton } from "../components/elements/skeleton";
import { predictionHistoryService } from "../api/api";

interface PredictionHistory {
  id: string;
  userId: string;
  imageName: string;
  prediction: string;
  confidence: number;
  fullResult?: any;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminPredictionHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // 1. Generate SWR Key based on pagination and search
  const swrKey = useMemo(() => {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });
    if (searchTerm) {
      params.append("search", searchTerm);
    }
    return `/api/predict/admin/history?${params.toString()}`;
  }, [pagination.page, pagination.limit, searchTerm]);

  // 2. Fetch data using SWR
  const { 
    data: historyResponse, 
    isLoading: loading, 
    mutate,
  } = useSWR(
    swrKey,
    async (url: string) => {
      const query = url.split("?")[1] || "";
      const res = await predictionHistoryService.getAll(query) as any;
      if (res.data && res.data.success) {
        return res.data;
      }
      throw new Error(res.data?.message || "Gagal mengambil data");
    },
    {
      keepPreviousData: true, // Crucial for smooth pagination
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  const history: PredictionHistory[] = historyResponse?.data || [];

  // Sync pagination from server
  useEffect(() => {
    if (historyResponse?.pagination) {
      setPagination(prev => {
        if (
          prev.total !== historyResponse.pagination.total ||
          prev.totalPages !== historyResponse.pagination.totalPages
        ) {
          return historyResponse.pagination;
        }
        return prev;
      });
    }
  }, [historyResponse]);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus prediction history ini?")) {
      return;
    }

    setDeleting(id);
    try {
      await predictionHistoryService.delete(id);
      toast.success("Prediction history berhasil dihapus");
      mutate(); // Optimistic update would be better, but mutate is safe
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus prediction history");
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error("Pilih prediction history yang ingin dihapus");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} prediction history?`)) {
      return;
    }

    try {
      await predictionHistoryService.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} prediction history berhasil dihapus`);
      setSelectedIds([]);
      mutate();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal menghapus prediction history");
    }
  };

  const handleDownload = async (format: "json" | "csv") => {
    try {
      await predictionHistoryService.export(format);
      toast.success(`Data berhasil diunduh dalam format ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengunduh data");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(history.map((h: PredictionHistory) => h.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Prediction History Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
          Manage and download user history prediction data
          </p>
        </div>

        <Card className="p-6 bg-white dark:bg-gray-800">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari berdasarkan prediction atau image name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                onClick={() => handleDownload("csv")}
                variant="outline"
                className="flex items-center gap-2 flex-1 sm:flex-initial"
                size="sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
              <Button
                onClick={() => handleDownload("json")}
                variant="outline"
                className="flex items-center gap-2 flex-1 sm:flex-initial"
                size="sm"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download JSON</span>
                <span className="sm:hidden">JSON</span>
              </Button>
              {selectedIds.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  className="flex items-center gap-2 flex-1 sm:flex-initial"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Hapus ({selectedIds.length})</span>
                  <span className="sm:hidden">Hapus</span>
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm ? "Tidak ada prediction history yang ditemukan" : "Belum ada prediction history"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.length === history.length && history.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Image
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Image Name
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Prediction
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Confidence
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Created At
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item: PredictionHistory) => (
                      <tr
                        key={item.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                            className="rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {item.user.name || "N/A"}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.user.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setViewingImage(item.id)}
                            className="flex items-center gap-2 text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                          >
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-sm">Lihat Foto</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.imageName}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-sm">
                            {item.prediction}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`text-sm ${
                              item.confidence >= 0.7
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : item.confidence >= 0.5
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            }`}
                          >
                            {(item.confidence * 100).toFixed(2)}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            onClick={() => handleDelete(item.id)}
                            variant="ghost"
                            size="sm"
                            disabled={deleting === item.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Menampilkan {((pagination.page - 1) * pagination.limit) + 1} -{" "}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} dari{" "}
                    {pagination.total} prediction history
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setPagination({ ...pagination, page: 1 })}
                      disabled={pagination.page === 1}
                      variant="outline"
                      size="sm"
                      title="Halaman pertama"
                    >
                      ««
                    </Button>
                    <Button
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 1}
                      variant="outline"
                      size="sm"
                    >
                      « Previous
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages: (number | string)[] = [];
                        const totalPages = pagination.totalPages;
                        const currentPage = pagination.page;
                        
                        if (totalPages > 0) {
                          pages.push(1);
                        }
                        
                        let startPage = Math.max(2, currentPage - 1);
                        let endPage = Math.min(totalPages - 1, currentPage + 1);
                        
                        if (currentPage <= 3) {
                          endPage = Math.min(5, totalPages - 1);
                        }
                        
                        if (currentPage >= totalPages - 2) {
                          startPage = Math.max(2, totalPages - 4);
                        }
                        
                        if (startPage > 2) {
                          pages.push('...');
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          if (i > 1 && i < totalPages) {
                            pages.push(i);
                          }
                        }
                        
                        if (endPage < totalPages - 1) {
                          pages.push('...');
                        }
                        
                        if (totalPages > 1) {
                          pages.push(totalPages);
                        }
                        
                        return pages.map((page, index) => {
                          if (page === '...') {
                            return (
                              <span key={`ellipsis-${index}`} className="px-2 text-gray-500 dark:text-gray-400">
                                ...
                              </span>
                            );
                          }
                          
                          const pageNum = page as number;
                          const isActive = pageNum === currentPage;
                          
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => setPagination({ ...pagination, page: pageNum })}
                              variant={isActive ? "default" : "outline"}
                              size="sm"
                              className={isActive ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
                            >
                              {pageNum}
                            </Button>
                          );
                        });
                      })()}
                    </div>
                    
                    <Button
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                      disabled={pagination.page >= pagination.totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Next »
                    </Button>
                    <Button
                      onClick={() => setPagination({ ...pagination, page: pagination.totalPages })}
                      disabled={pagination.page >= pagination.totalPages}
                      variant="outline"
                      size="sm"
                      title="Halaman terakhir"
                    >
                      »»
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <button
                onClick={async () => {
                  const imageUrl = predictionHistoryService.getImageUrl(viewingImage);
                  const historyItem = history.find((h: PredictionHistory) => h.id === viewingImage);
                  const filename = historyItem?.imageName || `prediction-${viewingImage}.png`;
                  
                  try {
                    const response = await fetch(imageUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    toast.success("Gambar berhasil diunduh");
                  } catch (error) {
                    toast.error("Gagal mengunduh gambar");
                  }
                }}
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
                title="Download gambar"
              >
                <Download className="w-6 h-6" />
              </button>
              <button
                onClick={() => setViewingImage(null)}
                className="p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 relative">
              <img
                key={viewingImage}
                src={predictionHistoryService.getImageUrl(viewingImage)}
                alt="Prediction image"
                className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const container = target.parentElement;
                  if (container) {
                    const errorDiv = container.querySelector('.error-message') as HTMLElement;
                    if (errorDiv) {
                      errorDiv.style.display = "block";
                    }
                  }
                }}
              />
              <div className="error-message hidden text-center py-12">
                <ImageIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Gambar tidak ditemukan
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 px-4">
                  {(() => {
                    const historyItem = history.find((h: PredictionHistory) => h.id === viewingImage);
                    if (historyItem?.createdAt) {
                      const createdDate = new Date(historyItem.createdAt);
                      const cutoffDate = new Date('2025-12-14');
                      if (createdDate < cutoffDate) {
                        return "Data lama tidak memiliki file gambar. Silakan lakukan prediksi baru untuk melihat gambar.";
                      }
                    }
                    return "File gambar tidak tersedia untuk prediksi ini.";
                  })()}
                </p>
              </div>
            </div>
            <div className="px-4 pb-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {history.find((h: PredictionHistory) => h.id === viewingImage)?.imageName || "Image"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPredictionHistory;

