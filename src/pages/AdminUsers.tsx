import { useEffect, useState, useCallback } from "react";
import { toast } from "react-hot-toast";

import { Button } from "../components/elements/button";
import { Card } from "../components/elements/card";
import { Badge } from "../components/elements/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/elements/select";
import { Skeleton } from "../components/elements/skeleton";
import { userService } from "../api/api";
import { useWastra } from "../context/WastraContext";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: "user" | "admin" | "super_admin";
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminUsers = () => {
  const { user: currentUser } = useWastra();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin" | "super_admin">("all");
  const [creating, setCreating] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  
  // Form state for add user
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin" | "super_admin",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const res = await userService.getAll(params.toString()) as any;

      if (res.data && res.data.success) {
        const data = res.data.data || [];
        const paginationData = res.data.pagination || pagination;
        setUsers(data);
        setPagination(paginationData);
      } else {
        // Fallback for old API format
        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.users || [];
        setUsers(data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  const updateRole = async (id: string, role: "user" | "admin" | "super_admin") => {
    setUpdating(id);
    try {
      await userService.updateRole(id, role);
      // Refresh users list to get latest data from server
      await fetchUsers();
      toast.success("Role updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update role");
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    setDeleting(deleteId);
    try {
      await userService.delete(deleteId);
      
      // If current page becomes empty after deletion and not on page 1, go to previous page
      if (users.length === 1 && pagination.page > 1) {
        setPagination({ ...pagination, page: pagination.page - 1 });
      } else {
        fetchUsers();
      }
      toast.success("User deleted successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    } finally {
      setDeleting(null);
      setDeleteId(null);
      setShowConfirm(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setCreating(true);
    try {
      await userService.create(
        formData.name,
        formData.email,
        formData.password,
        formData.role
      );

      // Refresh users list to get updated pagination
      fetchUsers();
      toast.success("User created successfully");
      setShowAddUser(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to create user";
      if (err.response?.data?.errors) {
        const errors = (err.response.data.errors as any[]).map((e: any) => e.message).join(", ");
        toast.error(errors);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setCreating(false);
    }
  };

  // Note: Filtering is now done on the displayed users (client-side)
  // For better performance with large datasets, consider implementing server-side filtering
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-6 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Total users: {pagination.total || users.length}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={fetchUsers} className="flex-1 sm:flex-none">Refresh</Button>
          <Button 
            onClick={() => setShowAddUser(true)}
            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white"
          >
            + Add User
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <Card className="p-4 bg-transparent border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Search
            </label>
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
            />
          </div>
          <div className="md:w-48">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Role
            </label>
            <Select
              value={roleFilter}
              onValueChange={(value: "all" | "user" | "admin" | "super_admin") => setRoleFilter(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="p-4 bg-transparent border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div>
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-[120px]" />
              </div>
            </Card>
          ))
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card key={user.id} className="p-4 bg-transparent border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name || "No Name"}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge 
                      variant={
                        user.role === "super_admin" 
                          ? "default" 
                          : user.role === "admin" 
                          ? "default" 
                          : "secondary"
                      }
                      className={
                        user.role === "super_admin"
                          ? "bg-purple-600 hover:bg-purple-700 text-white"
                          : user.role === "admin"
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : ""
                      }
                    >
                      {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "User"}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400 sm:hidden">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                  <Select
                    value={user.role}
                    onValueChange={(value: User["role"]) =>
                      updateRole(user.id, value)
                    }
                    disabled={
                      updating === user.id || 
                      deleting === user.id ||
                      // Admin cannot change super_admin role
                      (currentUser?.role === "admin" && user.role === "super_admin")
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {currentUser?.role === "super_admin" && (
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(user.id)}
                    disabled={
                      updating === user.id || 
                      deleting === user.id ||
                      // Admin cannot delete super_admin
                      (currentUser?.role === "admin" && user.role === "super_admin")
                    }
                    title={
                      currentUser?.role === "admin" && user.role === "super_admin"
                        ? "Only Owner can delete Owner"
                        : ""
                    }
                  >
                    {deleting === user.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center">No users found</p>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setPagination({ ...pagination, page: 1 })}
              disabled={pagination.page <= 1}
              variant="outline"
              size="sm"
            >
              ««
            </Button>
            <Button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page <= 1}
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
              title="Last page"
            >
              »»
            </Button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 min-w-[400px] max-w-[500px] w-full mx-4 transition-colors">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Add New User
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData("text");
                    setFormData({ ...formData, name: pastedText });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData("text");
                    setFormData({ ...formData, email: pastedText });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Enter password (min 6 chars, with uppercase, lowercase, and number)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedText = e.clipboardData.getData("text");
                    setFormData({ ...formData, password: pastedText });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Must include uppercase, lowercase, and number
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Role
                </label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "user" | "admin" | "super_admin") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="!z-[10000] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    {currentUser?.role === "super_admin" && (
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddUser(false);
                  setFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: "user",
                  });
                }}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser} 
                disabled={creating}
                className="bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white"
              >
                {creating ? "Creating..." : "Create User"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 min-w-[300px] transition-colors">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Confirm Delete
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirm(false);
                  setDeleteId(null);
                }}
                disabled={!!deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={!!deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
