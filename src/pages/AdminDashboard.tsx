import { useEffect, useState } from "react";
import { useWastra } from "../context/WastraContext";
import { motifService, statsService } from "../api/api";
import { Card } from "../components/elements/card";
import { Button } from "../components/elements/button";
import { Skeleton } from "../components/elements/skeleton";

interface DashboardStats {
  totalMotifs: number;
  totalPredictions: number;
  pendingPredictions?: number;
  approvedPredictions?: number;
  rejectedPredictions?: number;
  reviewedByMe?: number;
  todayPredictions: number;
  weekPredictions?: number;
  monthPredictions?: number;
  lastUpdated: string;
}

const AdminDashboard = () => {
  const { user } = useWastra();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      
      const lastUpdated = new Date().toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      // Fetch stats based on role
      if (user?.role === "super_admin") {
        // Fetch system stats for super admin
        try {
          const systemStatsResponse = await statsService.getSystemStats();
          const systemStats = systemStatsResponse.data.data;
          
          setStats({
            totalMotifs: systemStats.motifs.total,
            totalPredictions: systemStats.predictions.total,
            pendingPredictions: systemStats.predictions.pending,
            approvedPredictions: systemStats.predictions.approved,
            rejectedPredictions: systemStats.predictions.rejected,
            todayPredictions: systemStats.predictions.today,
            weekPredictions: systemStats.predictions.thisWeek,
            lastUpdated,
          });
        } catch (error) {
          console.error("Error fetching system stats:", error);
          // Fallback to old method
          const motifsResponse = await motifService.getAll();
          const motifs = motifsResponse.data || [];
          setStats({
            totalMotifs: motifs.length,
            totalPredictions: 0,
            todayPredictions: 0,
            lastUpdated,
          });
        }
      } else {
        // Fetch admin personal stats
        try {
          const adminStatsResponse = await statsService.getAdminStats();
          const adminStats = adminStatsResponse.data.data;
          
          setStats({
            totalMotifs: adminStats.motifs.total,
            totalPredictions: adminStats.predictions.total,
            pendingPredictions: adminStats.predictions.pending,
            approvedPredictions: adminStats.predictions.approved,
            rejectedPredictions: adminStats.predictions.rejected,
            reviewedByMe: adminStats.predictions.reviewedByMe,
            todayPredictions: adminStats.predictions.today,
            weekPredictions: adminStats.predictions.thisWeek,
            monthPredictions: adminStats.predictions.thisMonth,
            lastUpdated,
          });
        } catch (error) {
          console.error("Error fetching admin stats:", error);
          // Fallback
          const motifsResponse = await motifService.getAll();
          const motifs = motifsResponse.data || [];
          setStats({
            totalMotifs: motifs.length,
            totalPredictions: 0,
            todayPredictions: 0,
            lastUpdated,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Citra Wastra Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Complete overview of batik management system data
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Last updated: {stats?.lastUpdated || (loading ? "Loading..." : "-")}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          {refreshing || loading ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      {/* Ringkasan Utama */}
      <Card className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ringkasan Utama
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Statistik utama sistem
        </p>
        
        {loading && !stats ? (
          <div className="mt-8 space-y-6">
            {/* Table Header Placeholder */}
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
            </div>
            
            {/* Table Rows Placeholder */}
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Metrik
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Jumlah
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Detail
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                    Total Motif
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {stats?.totalMotifs || 0}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    Data terbaru
                  </td>
                  <td className="py-3 px-4">
                    <a
                      href="/admin/motifs"
                      className="text-amber-600 dark:text-amber-500 hover:underline text-sm"
                    >
                      Lihat →
                    </a>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                    Total Prediksi
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {stats?.totalPredictions || 0}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    Data terbaru
                  </td>
                  <td className="py-3 px-4">
                    <a
                      href="/admin/prediction-history"
                      className="text-amber-600 dark:text-amber-500 hover:underline text-sm"
                    >
                      Lihat →
                    </a>
                  </td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                    Aktivitas Hari Ini
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    {stats?.todayPredictions || 0}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    Minggu ini: {stats?.weekPredictions || 0}
                    {stats?.monthPredictions !== undefined && ` | Bulan ini: ${stats.monthPredictions}`}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Hari ini</span>
                  </td>
                </tr>
                {user?.role !== "super_admin" && stats?.pendingPredictions !== undefined && (
                  <tr>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                      Pending Reviews
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {stats.pendingPredictions}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {stats.reviewedByMe || 0} reviewed by me
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href="/admin/prediction-review"
                        className="text-amber-600 dark:text-amber-500 hover:underline text-sm"
                      >
                        Review →
                      </a>
                    </td>
                  </tr>
                )}
                {user?.role === "super_admin" && stats?.pendingPredictions !== undefined && (
                  <>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                        Approved Predictions
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {stats.approvedPredictions || 0}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        Data terbaru
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href="/admin/prediction-history?status=approved"
                          className="text-amber-600 dark:text-amber-500 hover:underline text-sm"
                        >
                          Lihat →
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                        Pending Reviews
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {stats.pendingPredictions || 0}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        Needs review
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href="/admin/prediction-review?status=pending"
                          className="text-amber-600 dark:text-amber-500 hover:underline text-sm"
                        >
                          Review →
                        </a>
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;
