import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { CheckCircle2, XCircle, Search, Download } from "lucide-react";

import { Button } from "../components/elements/button";
import { Card } from "../components/elements/card";
import { Badge } from "../components/elements/badge";
import { Skeleton } from "../components/elements/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/elements/select";
import { predictionReviewService, exportService, predictionHistoryService } from "../api/api";

interface PredictionReview {
  id: string;
  userId: string;
  imageName: string;
  prediction: string;
  confidence: number;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  reviewer?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminPredictionReview = () => {
  const [predictions, setPredictions] = useState<PredictionReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchReviewing, setBatchReviewing] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const res = await predictionReviewService.getForReview(params.toString()) as any;

      if (res.data && res.data.success) {
        setPredictions(res.data.data || []);
        setPagination(res.data.pagination || pagination);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch predictions");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, statusFilter]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Clear selectedIds when filter changes to avoid selecting items from different filter
  useEffect(() => {
    setSelectedIds([]);
  }, [statusFilter]);

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    setReviewing(id);
    try {
      await predictionReviewService.review(id, status);
      toast.success(`Prediction ${status} successfully`);
      fetchPredictions();
      setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${status} prediction`);
    } finally {
      setReviewing(null);
    }
  };

  const handleBatchReview = async (status: "approved" | "rejected") => {
    if (selectedIds.length === 0) {
      toast.error("Please select predictions to review");
      return;
    }

    // Only allow batch review for pending predictions
    const pendingSelected = predictions
      .filter((p) => selectedIds.includes(p.id) && p.status === "pending")
      .map((p) => p.id);

    if (pendingSelected.length === 0) {
      toast.error("Please select pending predictions to review");
      return;
    }

    if (pendingSelected.length < selectedIds.length) {
      toast.error(`Only ${pendingSelected.length} of ${selectedIds.length} selected predictions are pending and can be reviewed`);
    }

    setBatchReviewing(true);
    try {
      await predictionReviewService.batchReview(pendingSelected, status);
      toast.success(`Successfully ${status} ${pendingSelected.length} prediction${pendingSelected.length > 1 ? "s" : ""}`);
      fetchPredictions();
      setSelectedIds([]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to batch review predictions");
    } finally {
      setBatchReviewing(false);
    }
  };

  const handleExport = async (format: "csv" | "json" = "csv") => {
    try {
      const filters: any = {};
      if (statusFilter !== "all") {
        filters.status = statusFilter;
      }

      const response = await exportService.exportPredictions(format, filters) as any;
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `predictions-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error("Failed to export predictions");
    }
  };

  // Filter predictions by search term (status filter already applied server-side)
  const filteredPredictions = predictions.filter((pred) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        pred.user.email.toLowerCase().includes(searchLower) ||
        pred.user.name?.toLowerCase().includes(searchLower) ||
        pred.prediction.toLowerCase().includes(searchLower) ||
        pred.imageName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Clear selectedIds when filter changes to avoid selecting items from different filter
  useEffect(() => {
    setSelectedIds([]);
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-600 hover:bg-red-700 text-white">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            Pending
          </Badge>
        );
    }
  };

  if (loading && predictions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-full md:w-[180px] rounded-lg" />
        </div>

        {/* Predictions List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4 bg-transparent border border-gray-100 dark:border-gray-700">
              <div className="flex gap-4">
                <Skeleton className="w-24 h-24 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prediction Review</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Review and approve/reject user predictions
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
            size="sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("json")}
            className="flex items-center gap-2 flex-1 sm:flex-initial"
            size="sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export JSON</span>
            <span className="sm:hidden">JSON</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, name, prediction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400 
                       outline-none transition"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value: "all" | "pending" | "approved" | "rejected") => setStatusFilter(value)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batch Actions */}
      {selectedIds.length > 0 && (
        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {selectedIds.length} prediction(s) selected
            </span>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-initial"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={() => handleBatchReview("approved")}
                disabled={batchReviewing}
                className="flex-1 sm:flex-initial bg-green-600"
              >
                Approve Selected
              </Button>
              <Button
                size="sm"
                onClick={() => handleBatchReview("rejected")}
                disabled={batchReviewing}
               className="flex-1 sm:flex-initial bg-red-600"
              >
                Reject Selected
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Predictions List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <Card key={i} className="p-4 bg-transparent border border-gray-100 dark:border-gray-700">
              <div className="flex gap-4">
                <Skeleton className="w-24 h-24 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredPredictions.length === 0 ? (
        <Card className="p-8 text-center bg-transparent border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No predictions found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPredictions.map((pred) => {
            const imageUrl = predictionHistoryService.getImageUrl(pred.id);
            const isSelected = selectedIds.includes(pred.id);

            return (
              <Card
                key={pred.id}
                className={`p-4 bg-transparent border ${
                  isSelected
                    ? "border-amber-500 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20"
                    : "border-gray-100 dark:border-gray-700"
                }`}
              >
                <div className="flex gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={imageUrl}
                      alt={pred.imageName}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {pred.user.name || pred.user.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate break-all">{pred.user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 self-start">
                        {pred.status === "pending" && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds([...selectedIds, pred.id]);
                              } else {
                                setSelectedIds(selectedIds.filter((id) => id !== pred.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        )}
                        {getStatusBadge(pred.status)}
                      </div>
                    </div>

                    <div className="space-y-1 mb-3 break-words">
                      <p className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Prediction:</span>{" "}
                        <span className="text-gray-900 dark:text-white">{pred.prediction}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">Confidence:</span>{" "}
                        <span className="text-gray-900 dark:text-white">
                          {(pred.confidence * 100).toFixed(2)}%
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(pred.createdAt).toLocaleString()}
                      </p>
                      {pred.reviewedAt && pred.reviewer && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Reviewed by {pred.reviewer.email} on {new Date(pred.reviewedAt).toLocaleString()}
                        </p>
                      )}
                      {pred.reviewNotes && (
                        <p className="text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">Notes:</span>{" "}
                          <span className="text-gray-900 dark:text-white">{pred.reviewNotes}</span>
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {pred.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReview(pred.id, "approved")}
                          disabled={reviewing === pred.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {reviewing === pred.id ? "Reviewing..." : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReview(pred.id, "rejected")}
                          disabled={reviewing === pred.id}
                          className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {reviewing === pred.id ? "Reviewing..." : (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} predictions
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPredictionReview;

