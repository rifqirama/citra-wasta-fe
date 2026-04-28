import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import { Search, RefreshCw, Copy, Check, Trash2, AlertTriangle } from "lucide-react";

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
import { activityLogsService } from "../api/api";

interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const SystemLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearOlderThan, setClearOlderThan] = useState<string>("30");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (actionFilter !== "all") {
        params.append("action", actionFilter);
      }

      if (entityTypeFilter !== "all") {
        params.append("entityType", entityTypeFilter);
      }

      const res = await activityLogsService.getAll(params.toString()) as any;

      if (res.data && res.data.success) {
        setLogs(res.data.data || []);
        setPagination(res.data.pagination || pagination);
        setLastUpdated(new Date());
      }
    } catch (err: any) {
      if (!silent) {
        toast.error(err.response?.data?.message || "Failed to fetch activity logs");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [pagination.page, pagination.limit, actionFilter, entityTypeFilter]);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, actionFilter, entityTypeFilter]);

  // Auto-refresh every 15 seconds when autoRefresh is enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only auto-refresh if we're on page 1 (to avoid disrupting pagination)
      if (pagination.page === 1) {
        fetchLogs(true); // Silent refresh
      }
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, pagination.page]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const filteredLogs = logs.filter((log) => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.entityType.toLowerCase().includes(searchLower) ||
        log.user?.email.toLowerCase().includes(searchLower) ||
        log.user?.name?.toLowerCase().includes(searchLower) ||
        log.entityId?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    const actionLower = action.toLowerCase();
    const colors: Record<string, string> = {
      create: "bg-emerald-600 hover:bg-emerald-700 text-white",
      update: "bg-blue-600 hover:bg-blue-700 text-white",
      delete: "bg-red-600 hover:bg-red-700 text-white",
      login: "bg-purple-600 hover:bg-purple-700 text-white",
      logout: "bg-gray-600 hover:bg-gray-700 text-white",
      system: "bg-amber-600 hover:bg-amber-700 text-white",
    };
    return colors[actionLower] || "bg-gray-600 hover:bg-gray-700 text-white";
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleCopyDetails = (logId: string, details: any) => {
    try {
      const jsonString = JSON.stringify(details, null, 2);
      navigator.clipboard.writeText(jsonString);
      setCopiedId(logId);
      toast.success("Details copied to clipboard!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Failed to copy details");
    }
  };

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      const olderThan = clearOlderThan === "all" ? undefined : parseInt(clearOlderThan);
      const res = await activityLogsService.clear(olderThan) as any;
      
      if (res.data && res.data.success) {
        toast.success(res.data.message || "Logs cleared successfully");
        setShowClearConfirm(false);
        fetchLogs();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to clear activity logs");
    } finally {
      setClearing(false);
    }
  };


  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <div className="flex gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-[180px] rounded-lg" />
            <Skeleton className="h-10 w-full sm:w-[180px] rounded-lg" />
          </div>
        </div>

        {/* Logs List Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4 bg-transparent border border-gray-100 dark:border-gray-700">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-20 w-full rounded-lg" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">System Activity Logs</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Monitor all system activities and user actions
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
              {autoRefresh && " (Auto-refresh every 15s)"}
            </p>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
          >
            {autoRefresh ? "Auto: ON" : "Auto: OFF"}
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-2 flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Log
          </Button>
        </div>
      </div>

      {/* Clear Logs Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !clearing && setShowClearConfirm(false)} />
          <Card className="relative w-full max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-2xl p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Hapus Log Aktivitas</h2>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Tindakan ini akan menghapus log aktivitas sistem untuk mengoptimalkan database. Pilih rentang waktu log yang ingin dihapus.
            </p>

            <div className="space-y-4 mb-8">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hapus log yang lebih tua dari:</label>
              <Select value={clearOlderThan} onValueChange={setClearOlderThan}>
                <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Pilih rentang waktu" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectItem value="7">7 Hari</SelectItem>
                  <SelectItem value="30">30 Hari (1 Bulan)</SelectItem>
                  <SelectItem value="90">90 Hari (3 Bulan)</SelectItem>
                  <SelectItem value="all">Semua Log (Kosongkan)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={clearing}
                onClick={() => setShowClearConfirm(false)}
              >
                Batal
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={clearing}
                onClick={handleClearLogs}
              >
                {clearing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  "Konfirmasi Hapus"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by action, user, entity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:border-amber-500 dark:focus:border-amber-500 focus:ring-2 focus:ring-amber-400 
                       outline-none transition"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={actionFilter}
            onValueChange={setActionFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={entityTypeFilter}
            onValueChange={setEntityTypeFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by entity" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <SelectItem value="all">All Entities</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="motif">Motif</SelectItem>
              <SelectItem value="prediction">Prediction</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <Skeleton key={i} className="h-24 bg-transparent border border-gray-100 dark:border-gray-700" />
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card className="p-8 text-center bg-transparent border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">No activity logs found</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <Card
              key={log.id}
              className="p-4 bg-transparent border border-gray-100 dark:border-gray-700 hover:border-amber-500 dark:hover:border-amber-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Badge className={`${getActionBadge(log.action)} shrink-0`}>
                      {log.action.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {log.entityType}
                    </span>
                    {log.entityId && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                        {log.entityId.substring(0, 12)}...
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {log.user ? (
                      <span>
                        By <span className="font-semibold text-gray-900 dark:text-white">
                          {log.user.name || log.user.email}
                        </span>{" "}
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                          {log.user.role}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium">
                        System Action
                      </span>
                    )}
                  </div>

                  {log.details && (
                    <div className="mt-3 relative group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Details:</span>
                        <button
                          onClick={() => handleCopyDetails(log.id, log.details)}
                          className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                          title="Copy details to clipboard"
                        >
                          {copiedId === log.id ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{formatRelativeTime(log.createdAt)}</span>
                      <span className="text-gray-400 dark:text-gray-500">•</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    {log.ipAddress && (
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-mono">{log.ipAddress}</span>
                      </div>
                    )}
                    {log.userAgent && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs" title={log.userAgent}>
                        {log.userAgent.split(" ")[0]} {log.userAgent.split(" ")[1] || ""}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
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
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium px-3 py-1 bg-amber-600 text-white rounded-md">
                {pagination.page}
              </span>
              <span className="text-sm text-gray-500">of {pagination.totalPages}</span>
            </div>
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

export default SystemLogs;

