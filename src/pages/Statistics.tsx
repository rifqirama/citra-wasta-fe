import { useEffect, useState } from "react";
import { useWastra } from "../context/WastraContext";
import { statsService } from "../api/api";
import { Card } from "../components/elements/card";
import { Button } from "../components/elements/button";
import { Skeleton } from "../components/elements/skeleton";
import { RefreshCw, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface StatisticsData {
  totalUsers?: number;
  totalAdmins?: number;
  totalSuperAdmins?: number;
  totalRegularUsers?: number;
  totalMotifs: number;
  totalPredictions: number;
  pendingPredictions?: number;
  approvedPredictions?: number;
  rejectedPredictions?: number;
  reviewedByMe?: number;
  todayPredictions: number;
  weekPredictions?: number;
  monthPredictions?: number;
  todayUsers?: number;
}

const COLORS = ["#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6"];

const Statistics = () => {
  const { user } = useWastra();
  const [stats, setStats] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      if (user?.role === "super_admin") {
        const systemStatsResponse = await statsService.getSystemStats();
        const systemStats = systemStatsResponse.data.data;
        setStats({
          totalUsers: systemStats.users.total,
          totalAdmins: systemStats.users.admins,
          totalSuperAdmins: systemStats.users.superAdmins,
          totalRegularUsers: systemStats.users.regular,
          totalMotifs: systemStats.motifs.total,
          totalPredictions: systemStats.predictions.total,
          pendingPredictions: systemStats.predictions.pending,
          approvedPredictions: systemStats.predictions.approved,
          rejectedPredictions: systemStats.predictions.rejected,
          todayPredictions: systemStats.predictions.today,
          weekPredictions: systemStats.predictions.thisWeek,
          todayUsers: systemStats.users.today,
        });
      } else {
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
        });
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatistics();
  };

  // Prepare chart data
  const predictionStatusData = [
    { name: "Approved", value: stats?.approvedPredictions || 0, color: COLORS[1] },
    { name: "Pending", value: stats?.pendingPredictions || 0, color: COLORS[0] },
    { name: "Rejected", value: stats?.rejectedPredictions || 0, color: COLORS[2] },
  ].filter((item) => item.value > 0);

  const userRoleData = user?.role === "super_admin" && stats
    ? [
        { name: "Super Admin", value: stats.totalSuperAdmins || 0 },
        { name: "Admin", value: stats.totalAdmins || 0 },
        { name: "User", value: stats.totalRegularUsers || 0 },
      ].filter((item) => item.value > 0)
    : [];

  const activityComparisonData = [
    {
      name: "Today",
      Predictions: stats?.todayPredictions || 0,
    },
    {
      name: "This Week",
      Predictions: stats?.weekPredictions || 0,
    },
    {
      name: "This Month",
      Predictions: stats?.monthPredictions || 0,
    },
  ].filter((item) => item.Predictions > 0);

  const overviewData = [
    {
      name: "Motifs",
      value: stats?.totalMotifs || 0,
      color: COLORS[3],
    },
    {
      name: "Predictions",
      value: stats?.totalPredictions || 0,
      color: COLORS[0],
    },
    ...(user?.role === "super_admin" && stats?.totalUsers
      ? [{ name: "Users", value: stats.totalUsers, color: COLORS[4] }]
      : []),
  ];

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Overview Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="w-12 h-12 rounded-full" />
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
              <Skeleton className="h-6 w-40 mb-6" />
              <Skeleton className="h-[300px] w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Statistik</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Visualisasi data dan analisis sistem
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="border-gray-200 dark:border-gray-700" disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Motif</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalMotifs || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Prediksi</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalPredictions || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        {user?.role === "super_admin" && (
          <Card className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pengguna</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {stats?.totalUsers || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Status Pie Chart */}
        <Card className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Status Prediksi
          </h3>
          {predictionStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={predictionStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const name = props.name || "";
                    const percent = props.percent || 0;
                    return `${name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {predictionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Tidak ada data
            </div>
          )}
        </Card>

        {/* User Role Distribution (Super Admin only) */}
        {user?.role === "super_admin" && (
          <Card className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribusi Role Pengguna
            </h3>
            {userRoleData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userRoleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: any) => {
                    const name = props.name || "";
                    const percent = props.percent || 0;
                    return `${name}: ${(percent * 100).toFixed(0)}%`;
                  }}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userRoleData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Tidak ada data
              </div>
            )}
          </Card>
        )}

        {/* Activity Comparison */}
        {activityComparisonData.length > 0 && (
          <Card className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Perbandingan Aktivitas
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Predictions" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Overview Bar Chart */}
        <Card className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ringkasan Data
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={overviewData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b">
                {overviewData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Detailed Statistics Table */}
      <Card className="p-6 bg-transparent border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Detail Statistik
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Kategori
                </th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Jumlah
                </th>
                <th className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Keterangan
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
                  Total motif batik dalam sistem
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
                  Total prediksi yang telah dibuat
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                  Approved
                </td>
                <td className="py-3 px-4 text-sm text-green-600 dark:text-green-400 font-medium">
                  {stats?.approvedPredictions || 0}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  Prediksi yang telah disetujui
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                  Pending
                </td>
                <td className="py-3 px-4 text-sm text-amber-600 dark:text-amber-400 font-medium">
                  {stats?.pendingPredictions || 0}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  Prediksi yang menunggu review
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                  Rejected
                </td>
                <td className="py-3 px-4 text-sm text-red-600 dark:text-red-400 font-medium">
                  {stats?.rejectedPredictions || 0}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  Prediksi yang ditolak
                </td>
              </tr>
              {user?.role === "super_admin" && stats?.totalUsers !== undefined && (
                <>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                      Total Pengguna
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {stats.totalUsers}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      Total pengguna dalam sistem
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                      Super Admin
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {stats.totalSuperAdmins || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      Jumlah super admin
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                      Admin
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {stats.totalAdmins || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      Jumlah admin
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                      User
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {stats.totalRegularUsers || 0}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      Jumlah user biasa
                    </td>
                  </tr>
                </>
              )}
              {user?.role !== "super_admin" && stats?.reviewedByMe !== undefined && (
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                    Reviewed by Me
                  </td>
                  <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400 font-medium">
                    {stats.reviewedByMe}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                    Prediksi yang telah Anda review
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">
                  Prediksi Hari Ini
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                  {stats?.todayPredictions || 0}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                  Jumlah prediksi dibuat hari ini
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Statistics;