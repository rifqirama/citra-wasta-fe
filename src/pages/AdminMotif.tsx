import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import axios from "axios";
import { toast } from "react-hot-toast";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  X, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from "lucide-react";

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
import { motifService, uploadService, wilayahService } from "../api/api";
import type { ApiResponse, Motif } from "../utils/api";

interface Province {
  id: string;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const AdminMotif = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("all");

  // Helper function for client-side image compression
  const compressImage = (file: File): Promise<File | Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Canvas to Blob failed"));
              }
            },
            "image/jpeg",
            0.7 // quality
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modal & Form state
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    region: "",
    province: "",
    tags: "", // will be converted to string[]
    image: "",
  });

  // 1. Fetch Provinces using SWR
  const { data: provincesData, isLoading: loadingProvinces } = useSWR(
    "/api/wilayah/provinces",
    async () => {
      const res = await wilayahService.getProvinces() as { data: Province[] };
      return res.data.map((p: any) => ({
        id: p.id,
        name: p.name.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      }));
    },
    { revalidateOnFocus: false, dedupingInterval: 3600000 } // Cache for 1 hour
  );

  const provinces = provincesData || [];

  // 2. Fetch Motifs using SWR
  const swrKey = useMemo(() => {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
    });
    if (searchTerm) params.append("search", searchTerm);
    if (provinceFilter !== "all") params.append("province", provinceFilter);
    return `/api/motifs?${params.toString()}`;
  }, [pagination.page, pagination.limit, searchTerm, provinceFilter]);

  const { 
    data: motifResponse, 
    isLoading: loading, 
    mutate: mutateMotifs,
    isValidating: refreshing
  } = useSWR(
    swrKey,
    async (url) => {
      const query = url.split("?")[1] || "";
      const res = await motifService.getAll(query) as { data: ApiResponse<Motif[]> };
      
      if (res.data && res.data.success) {
        return res.data;
      } else {
        // Fallback for old API format
        const oldData = res.data as unknown as Motif[];
        return {
          success: true,
          data: Array.isArray(oldData) ? oldData : [],
          pagination: {
            page: 1,
            limit: 10,
            total: Array.isArray(oldData) ? oldData.length : 0,
            totalPages: 1
          }
        };
      }
    },
    { 
      keepPreviousData: true, // Smooth loading when changing page/filters
      revalidateOnFocus: false 
    }
  );

  const motifs = motifResponse?.data || [];
  
  // Sync local pagination state with API response
  useEffect(() => {
    if (motifResponse?.pagination) {
      setPagination(prev => {
        if (
          prev.total !== motifResponse.pagination?.total || 
          prev.totalPages !== motifResponse.pagination?.totalPages
        ) {
          return motifResponse.pagination!;
        }
        return prev;
      });
    }
  }, [motifResponse]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: "",
      description: "",
      region: "",
      province: "",
      tags: "",
      image: "",
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleOpenEdit = (motif: Motif) => {
    setIsEditing(true);
    setCurrentId(motif.id);

    // Logic for location splitting (Province vs Region)
    let provinceToSet = (motif.province || "").trim();
    let regionToSet = (motif.region || "").trim();

    // 1. Fix cases where region is too broad (e.g. "Jawa") and province has city details
    const broadRegions = ["jawa", "sumatera", "kalimantan", "sulawesi", "papua", "bali"];
    if (broadRegions.includes(regionToSet.toLowerCase()) && provinceToSet.includes(",")) {
      // If region is just "Jawa" and province is "Kota Yogyakarta, DI Yogyakarta"
      // Swap them or prioritize province content
      const parts = provinceToSet.split(",").map(p => p.trim());
      regionToSet = parts[0];
      provinceToSet = parts[1] || parts[0];
    }

    // 2. If province contains a comma (e.g. "Bali, Gianyar"), split it
    else if (provinceToSet.includes(",")) {
      const parts = provinceToSet.split(",").map(p => p.trim());
      provinceToSet = parts[0];
      // Append the second part to region if region is empty or generic
      if (!regionToSet || regionToSet === "-" || broadRegions.includes(regionToSet.toLowerCase())) {
        regionToSet = parts.slice(1).join(", ");
      }
    }

    // 3. Special case for "DI Yogyakarta" and similar that might be in province
    const foundProvince = provinces.find(p => 
      provinceToSet.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(provinceToSet.toLowerCase())
    );

    if (foundProvince) {
      // If we found a match, but the province field had more info
      if (provinceToSet.length > foundProvince.name.length && !regionToSet) {
        // e.g. provinceToSet is "Kota Yogyakarta DI Yogyakarta"
        regionToSet = provinceToSet.replace(foundProvince.name, "").replace(/[,]/g, "").trim();
      }
      provinceToSet = foundProvince.name;
    }

    setFormData({
      name: motif.name,
      description: motif.description,
      region: regionToSet,
      province: provinceToSet,
      tags: motif.tags.join(", "),
      image: motif.image,
    });
    setImagePreview(motif.image);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus motif ini?")) return;

    try {
      await motifService.delete(id);
      toast.success("Motif berhasil dihapus");
      mutateMotifs();
    } catch (err) {
      if ((axios as any).isAxiosError(err)) {
        toast.error((err as any).response?.data?.message || "Gagal menghapus motif");
      } else {
        toast.error("Gagal menghapus motif");
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 2. Start immediate upload to Cloudinary
      setUploading(true);
      const startTime = Date.now();
      
      try {
        // Compress image before uploading
        const compressedBlob = await compressImage(file);
        
        const uploadFormData = new FormData();
        uploadFormData.append("image", compressedBlob, file.name.replace(/\.[^/.]+$/, ".jpg"));
        
        const uploadRes = await uploadService.upload(uploadFormData) as { data: { imageUrl: string } };
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        // 3. Update form data with final URL
        setFormData(prev => ({ ...prev, image: uploadRes.data.imageUrl }));
        toast.success(`Gambar berhasil diunggah (${duration}s)`);
      } catch (err) {
        toast.error("Gagal mengunggah gambar");
        setImagePreview(formData.image || null); // revert preview
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploading) {
      toast.error("Mohon tunggu, gambar sedang diunggah...");
      return;
    }

    setSubmitting(true);

    try {
      const imageUrl = formData.image;

      if (!imageUrl) {
        toast.error("Gambar wajib diunggah");
        setSubmitting(false);
        return;
      }

      // Cleanup and standardize location data before saving
      let finalProvince = formData.province.trim();
      let finalRegion = formData.region.trim();

      // Standardize "Yogyakarta" to "DI Yogyakarta" if it matches
      if (finalProvince.toLowerCase().includes("yogyakarta") && !finalProvince.toLowerCase().includes("di")) {
        finalProvince = "DI Yogyakarta";
      }

      // Try to match with standardized list from API if available
      if (provinces.length > 0) {
        const matched = provinces.find(p => p.name.toLowerCase() === finalProvince.toLowerCase());
        if (matched) finalProvince = matched.name;
      }

      const dataToSubmit = {
        ...formData,
        province: finalProvince,
        region: finalRegion,
        image: imageUrl,
        tags: formData.tags.split(",").map(t => t.trim()).filter(t => t !== ""),
      };

      if (isEditing && currentId) {
        await motifService.update(currentId, dataToSubmit);
        toast.success("Motif berhasil diperbarui");
      } else {
        await motifService.create(dataToSubmit);
        toast.success("Motif baru berhasil ditambahkan");
      }

      setShowModal(false);
      mutateMotifs();
    } catch (err) {
      if ((axios as any).isAxiosError(err)) {
        toast.error((err as any).response?.data?.message || "Gagal menyimpan motif");
      } else {
        toast.error("Gagal menyimpan motif");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Motif Batik</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Kelola data kelas batik untuk sistem AI dan Galeri.</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => mutateMotifs()} 
            disabled={refreshing}
            className="flex gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleOpenAdd} className="bg-amber-600 hover:bg-amber-700 text-white flex gap-2">
            <Plus className="w-4 h-4" />
            Tambah Motif
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama motif..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
              <SelectTrigger className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <SelectValue placeholder="Semua Provinsi" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <SelectItem value="all">Semua Provinsi</SelectItem>
                {loadingProvinces ? (
                  <div className="p-2 text-center text-xs text-gray-500">Memuat provinsi...</div>
                ) : (
                  provinces.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Motif</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lokasi</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tags</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-12 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : motifs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada data motif ditemukan.
                  </td>
                </tr>
              ) : (
                motifs.map((motif) => (
                  <tr key={motif.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 relative">
                          <img 
                            src={motif.image} 
                            alt={motif.name} 
                            loading="lazy"
                            className="w-full h-full object-cover transition-opacity duration-300 opacity-0"
                            onLoad={(e) => (e.currentTarget.style.opacity = "1")}
                          />
                          {/* Skeleton placeholder while loading image */}
                          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse -z-10" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white">{motif.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]">{motif.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white font-bold">{motif.region || "-"}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{motif.province}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {motif.tags.slice(0, 2).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] py-0 px-1.5 bg-gray-100 dark:bg-gray-700">
                            {tag}
                          </Badge>
                        ))}
                        {motif.tags.length > 2 && <span className="text-[10px] text-gray-400">+{motif.tags.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(motif.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(motif)}
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(motif.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Menampilkan {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !submitting && setShowModal(false)} />
          <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-2xl">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Motif" : "Tambah Motif Baru"}
              </h2>
              <button onClick={() => !submitting && setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Nama Motif</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Batik Parang"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Provinsi</label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pilih dari daftar</span>
                  </div>
                  <Select 
                    key={formData.province || 'empty'}
                    value={formData.province} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, province: val }))}
                  >
                    <SelectTrigger className="w-full bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      <SelectValue placeholder={loadingProvinces ? "Memuat..." : "Pilih Provinsi"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                      {loadingProvinces ? (
                        <div className="p-2 text-center text-xs text-gray-500">Memuat provinsi...</div>
                      ) : (
                        provinces.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Wilayah (Region)</label>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Contoh: Gianyar, Solo, Pekalongan</span>
                  </div>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={formData.region}
                    onChange={e => setFormData(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="Masukkan nama kota/kabupaten"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Tags (pisahkan dengan koma)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={formData.tags}
                    onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="batik, parang, tradisional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Deskripsi / Filosofi</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Jelaskan makna dan sejarah motif ini..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Gambar Motif</label>
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="relative w-full md:w-40 h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center">
                    {imagePreview ? (
                      <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="motif-image-upload"
                    />
                    <label
                      htmlFor="motif-image-upload"
                      className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                    >
                      Pilih Gambar
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Format: JPG, PNG, WebP. Maksimal 5MB.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={submitting}
                  onClick={() => setShowModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Motif"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminMotif;
