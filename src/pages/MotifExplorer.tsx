import React, { useMemo, useState, useEffect } from "react";
import { X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { MotifItem } from "../assets/data/dataset";
import api, { motifService, galleryService } from "../api/api";
import { WILAYAH_API_URL } from "../../config";
import { Skeleton } from "../components/elements/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/elements/select";
import { useI18n } from "../context/I18nContext";

interface Province {
  id: string;
  name: string;
}

interface Regency {
  id: string;
  province_id: string;
  name: string;
}

const PremiumBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center rounded-md bg-amber-600 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white ring-1 ring-inset ring-amber-700/20 backdrop-blur-sm shadow-sm transition-colors uppercase">
    {children}
  </span>
);

const DetailModal = ({ item, onClose }: { item: MotifItem | null; onClose: () => void }) => {
  const [description, setDescription] = useState(item?.description);
  const [loadingDesc, setLoadingDesc] = useState(false);

  useEffect(() => {
    if (item) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [item]);

  useEffect(() => {
    if (item && item.description === "Klik untuk melihat detail filosofi motif ini.") {
      setLoadingDesc(true);
      const queryParams = item.id ? `id=${item.id}&name=${encodeURIComponent(item.name)}` : `name=${encodeURIComponent(item.name)}`;
      api.get(`/api/philosophy?${queryParams}`)
        .then((res: any) => setDescription(res.data.philosophy))
        .catch(() => setDescription("Gagal memuat deskripsi."))
        .finally(() => setLoadingDesc(false));
    }
  }, [item]);

  if (!item) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-300"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl rounded-3xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden transition-all transform scale-100 opacity-100 flex flex-col md:flex-row border border-white/20 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
          <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/30 pointer-events-none" />
          <button
            onClick={onClose}
            aria-label="Tutup detail"
            className="absolute right-4 top-12 md:hidden z-20 rounded-full bg-black/60 backdrop-blur-md p-3 text-white hover:bg-black/80 transition-all shadow-2xl border border-white/20 active:scale-90"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col max-h-[70vh] md:max-h-[85vh] overflow-y-auto custom-scrollbar relative bg-gradient-to-br from-white to-amber-50/30 dark:from-gray-900 dark:to-gray-900">
          <button
            onClick={onClose}
            aria-label="Tutup detail"
            className="absolute right-6 top-6 hidden md:flex rounded-full bg-gray-100 dark:bg-gray-800 p-2.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-700 dark:hover:text-white transition-all shadow-sm"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="space-y-6 flex-grow">
            <div>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2 font-serif">{item.name}</h3>
              <div className="h-1 w-12 bg-amber-500 rounded-full mb-4"></div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <PremiumBadge>{item.region}</PremiumBadge>
              <PremiumBadge>{item.province}</PremiumBadge>
              {item.tags?.map((t) => <PremiumBadge key={t}>#{t}</PremiumBadge>)}
            </div>

            <div className="prose prose-amber dark:prose-invert max-w-none">
              {loadingDesc ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-[15px]">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MotifExplorer: React.FC = () => {
  const { t } = useI18n();
  const [motifs, setMotifs] = useState<MotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("");
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>("");
  const [detail, setDetail] = useState<MotifItem | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [regencies, setRegencies] = useState<Regency[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await fetch(`${WILAYAH_API_URL}/provinces`);
        if (!res.ok) throw new Error("Gagal mengambil data provinsi");
        const data: Province[] = await res.json();
        setProvinces(data);
      } catch (err) {
        console.error("Error fetching provinces:", err);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) {
      setRegencies([]);
      setSelectedRegencyId("");
      return;
    }

    const fetchRegencies = async () => {
      try {
        const res = await fetch(`${WILAYAH_API_URL}/regencies/${selectedProvinceId}`);
        if (!res.ok) throw new Error("Gagal mengambil data kota/kabupaten");
        const data: Regency[] = await res.json();
        setRegencies(data);
        setSelectedRegencyId("");
      } catch (err) {
        console.error("Error fetching regencies:", err);
      }
    };
    fetchRegencies();
  }, [selectedProvinceId]);

  // Helper to get exact image name based on the public/gallery files
  const getExactImageName = (name: string) => {
    // Basic conversion strategy: 
    // "Batik Jawa Tengah Arumdalu" -> "JawaTengah_Arumdalu"
    // "Batik Bali Barong" -> "Bali_Barong"
    // Remove "Batik " and split remaining
    const withoutBatik = name.replace("Batik ", "");
    
    // Check specific complex names based on directory contents
    if (withoutBatik.startsWith("Jakarta Ondelondel")) return "Jakarta_OndelOndel";
    if (withoutBatik.startsWith("Jawa Barat")) return "JawaBarat_Megamendung";
    if (withoutBatik.startsWith("Jawa Tengah")) {
      const motifPart = withoutBatik.replace("Jawa Tengah ", "");
      // Map complex sub-words
      const complexMap: Record<string, string> = {
        "Asemarang": "AsemArang",
        "Asemsinom": "AsemSinom",
        "Asemwarak": "AsemWarak",
        "Cindewilis": "CindeWilis",
        "Gambangsemarangan": "GambangSemarangan",
        "Ikankerang": "IkanKerang",
        "Jagunglombok": "JagungLombok",
        "Jambubelimbing": "JambuBelimbing",
        "Jambucitra": "JambuCitra",
        "Jayakusuma": "JayaKusuma",
        "Kembangsepatu": "KembangSepatu",
        "Luriksemangka": "LurikSemangka",
        "Masjidagungdemak": "MasjidAgungDemak",
        "Parangkusumo": "ParangKusumo",
        "Parangslobog": "ParangSlobog",
        "Sarimulat": "SariMulat",
        "Sekargudhe": "SekarGudhe",
        "Tanjunggunung": "TanjungGunung",
        "Tebubambu": "TebuBambu",
        "Tugumuda": "TuguMuda",
        "Warakberasutah": "WarakBerasUtah",
        "Worawarirumpuk": "WorawariRumpuk"
      };
      return `JawaTengah_${complexMap[motifPart] || motifPart}`;
    }
    if (withoutBatik.startsWith("Jawa Timur")) {
      return `JawaTimur_${withoutBatik.replace("Jawa Timur ", "")}`;
    }
    if (withoutBatik.startsWith("Kalimantan Barat")) {
      return `KalimantanBarat_${withoutBatik.replace("Kalimantan Barat ", "")}`;
    }
    if (withoutBatik.startsWith("Kalimantan Dayak")) return "Kalimantan_Dayak";
    if (withoutBatik.startsWith("Lampunggajah")) return "Lampung_Gajah";
    if (withoutBatik.startsWith("Lampung Kacang Hijau")) return "Lampung_KacangHijau";
    if (withoutBatik.startsWith("Lampung Bledheg")) return "Lampung_Bledheg";
    if (withoutBatik.startsWith("Malukupala")) return "Maluku_Pala";
    if (withoutBatik.startsWith("NTB Lumbung")) return "NTB_Lumbung";
    if (withoutBatik.startsWith("Papua")) {
       return `Papua_${withoutBatik.replace("Papua ", "")}`;
    }
    if (withoutBatik.startsWith("Sulawesi Selatan")) {
      return `SulawesiSelatan_${withoutBatik.replace("Sulawesi Selatan ", "")}`;
    }
    if (withoutBatik.startsWith("Sumatera Barat")) {
      return `SumateraBarat_${withoutBatik.replace("Sumatera Barat ", "").replace(/\s/g, '')}`;
    }
    if (withoutBatik.startsWith("Sumatera Utara")) {
      return `SumateraUtara_${withoutBatik.replace("Sumatera Utara ", "").replace(/\s/g, '')}`;
    }
    if (withoutBatik.startsWith("Yogyakarta")) {
      const motifPart = withoutBatik.replace("Yogyakarta ", "");
      const complexMap: Record<string, string> = {
        "Cakarayam": "CakarAyam",
        "Ceplokliring": "CeplokLiring",
        "Jayakirana": "JayaKirana",
        "Klampokarum": "KlampokArum",
        "Kuncupkanthil": "KuncupKanthil",
        "Parangcurigo": "ParangCurigo",
        "Parangrusak": "ParangRusak",
        "Parangtuding": "ParangTuding",
        "Sekarandhong": "SekarAndhong",
        "Sekarblimbing": "SekarBlimbing",
        "Sekarcengkeh": "SekarCengkeh",
        "Sekardangan": "SekarDangan",
        "Sekardhuku": "SekarDhuku",
        "Sekardlima": "SekarDlima",
        "Sekarduren": "SekarDuren",
        "Sekargambir": "SekarGambir",
        "Sekargayam": "SekarGayam",
        "Sekarjagung": "SekarJagung",
        "Sekarjali": "SekarJali",
        "Sekarjeruk": "SekarJeruk",
        "Sekarkeben": "SekarKeben",
        "Sekarkemuning": "SekarKemuning",
        "Sekarkenanga": "SekarKenanga",
        "Sekarkenikir": "SekarKenikir",
        "Sekarkenthang": "SekarKenthang",
        "Sekarkepel": "SekarKepel",
        "Sekarketongkeng": "SekarKetongkeng",
        "Sekarlintang": "SekarLintang",
        "Sekarmanggis": "SekarManggis",
        "Sekarmenur": "SekarMenur",
        "Sekarmindi": "SekarMindi",
        "Sekarmlathi": "SekarMlathi",
        "Sekarmrica": "SekarMrica",
        "Sekarmundhu": "SekarMundhu",
        "Sekarnangka": "SekarNangka",
        "Sekarpacar": "SekarPacar",
        "Sekarpala": "SekarPala",
        "Sekarpijetan": "SekarPijetan",
        "Sekarpudhak": "SekarPudhak",
        "Sekarrandhu": "SekarRandhu",
        "Sekarsawo": "SekarSawo",
        "Sekarsoka": "SekarSoka",
        "Sekarsrengenge": "SekarSrengenge",
        "Sekarsrigadhing": "SekarSrigadhing",
        "Sekartanjung": "SekarTanjung",
        "Sekartebu": "SekarTebu"
      };
      return `Yogyakarta_${complexMap[motifPart] || motifPart}`;
    }

    // Default fallback (e.g. Bali Barong -> Bali_Barong)
    return withoutBatik.replace(" ", "_");
  };

 useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch from gallery service which now pulls from database
      const res = await galleryService.getAll();
      let data = [];
      
      if (res.data && res.data.success) {
        data = Array.isArray(res.data.data) ? res.data.data : [];
      } else {
        data = Array.isArray(res.data) ? res.data : [];
      }

      if (data.length > 0) {
        const mappedData: MotifItem[] = data.map((item: any) => ({
          id: item.id || `motif-${Math.random()}`,
          name: item.name,
          image: item.image || `/gallery/${getExactImageName(item.name)}.jpg`,
          description: item.description || item.philosophy,
          province: item.province || item.location || "Unknown",
          region: item.region || (item.location ? item.location.split(",")[0].trim() : ""),
          tags: item.tags || ["Batik", "Tradisional"],
        }));
        setMotifs(mappedData);
      }
    } catch (err) {
      console.error("Error fetching motifs for explorer:", err);
      // Fallback to direct motif service if gallery fails
      try {
        const res = await motifService.getAll();
        if (res.data && res.data.success) {
          setMotifs(res.data.data);
        }
      } catch (fallbackErr) {
        console.error("Fallback fetch failed:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };
  fetchData();
 }, []);

  const filtered = useMemo(() => {
    let data = [...motifs];

    if (selectedProvinceId) {
      const selectedProvince = provinces.find(p => p.id === selectedProvinceId);
      if (selectedProvince) {
        data = data.filter((d) => {
          const provinceName = selectedProvince.name.toUpperCase();
          return d.province.toUpperCase().includes(provinceName);
        });
      }
    }

    if (selectedRegencyId) {
      const selectedRegency = regencies.find(r => r.id === selectedRegencyId);
      if (selectedRegency) {
        data = data.filter((d) => {
          const regencyName = selectedRegency.name.toUpperCase();
          return d.province.toUpperCase().includes(regencyName);
        });
      }
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      data = data.filter((d) =>
        [d.name, d.description, d.region, d.province, ...(d.tags || [])]
          .map((x) => x.toLowerCase())
          .join(" ")
          .includes(q)
      );
    }
    return data;
  }, [query, selectedProvinceId, selectedRegencyId, motifs, provinces, regencies]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [query, selectedProvinceId, selectedRegencyId]);

  // Calculate paginated data
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-gray-900 transition-colors min-h-screen relative overflow-hidden grid-hero-bg">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-amber-500/10 to-transparent dark:from-amber-600/5 pointer-events-none -translate-y-1/2 rounded-full blur-3xl opacity-60 mix-blend-multiply dark:mix-blend-lighten"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-center mb-4 text-gray-900 dark:text-white leading-tight">
            {t("gallery.title")}
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {t("gallery.description")}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200 dark:border-gray-700 p-3 md:p-4 rounded-3xl shadow-xl mb-12 flex flex-col sm:flex-row gap-3 sticky top-20 z-30 transition-all">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
            </div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("gallery.searchPlaceholder")}
              className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div className="flex gap-2 sm:w-64">
            <Select value={selectedProvinceId} onValueChange={setSelectedProvinceId}>
              <SelectTrigger className="w-full h-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none">
                <SelectValue placeholder={t("gallery.allProvinces")} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                <SelectItem value="all_provinces">{t("gallery.allProvinces")}</SelectItem>
                {provinces.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[400px] w-full rounded-[32px]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 bg-white/50 dark:bg-gray-800/50 rounded-[32px] border border-dashed border-gray-300 dark:border-gray-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("gallery.noMotifs") || "Tidak ada motif yang ditemukan"}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t("maps.noMatch").replace("{q}", query) || "Coba kata kunci lain atau bersihkan filter."}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
              {paginatedData.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setDetail(item)}
                className="group relative flex flex-col items-start bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-amber-500/50 text-left transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-amber-500/10 transform hover:-translate-y-2"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative h-64 w-full overflow-hidden">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                    <span className="text-white text-xs font-bold tracking-widest uppercase bg-amber-600 px-3 py-1 rounded-full">{t("lang") === "id" ? "Lihat Detail" : "View Detail"}</span>
                  </div>
                </div>
                <div className="p-6 md:p-8 flex flex-col flex-1 w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-md">{item.region}</span>
                    <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700/50"></div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3 font-serif line-clamp-1 group-hover:text-amber-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed mb-6 flex-grow overflow-hidden">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-gray-700/50 w-full">
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {item.province}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 sm:gap-2 mt-12 mb-8 px-2 w-full max-w-full overflow-hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-10 w-10 sm:w-auto sm:px-4 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-1 shadow-sm shrink-0 active:scale-95"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="hidden sm:inline text-sm">{t("gallery.previously") || "Sebelumnya"}</span>
                </button>
                
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 px-1">
                  {(() => {
                    const pages = [];
                    // Responsive visible pages
                    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                    const maxVisible = isMobile ? 3 : 5;
                    
                    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    
                    if (end - start + 1 < maxVisible) {
                      start = Math.max(1, end - maxVisible + 1);
                    }

                    if (start > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-medium transition-all bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm shrink-0 active:scale-95"
                        >
                          1
                        </button>
                      );
                      if (start > 2) pages.push(<span key="start-dots" className="px-0.5 text-gray-400">...</span>);
                    }

                    for (let p = start; p <= end; p++) {
                      pages.push(
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-medium transition-all shrink-0 active:scale-95 ${
                            currentPage === p
                              ? "bg-amber-600 text-white shadow-md scale-105 z-10 border border-amber-700"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }

                    if (end < totalPages) {
                      if (end < totalPages - 1) pages.push(<span key="end-dots" className="px-0.5 text-gray-400">...</span>);
                      pages.push(
                        <button
                          key={totalPages}
                          onClick={() => handlePageChange(totalPages)}
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-medium transition-all bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm shrink-0 active:scale-95"
                        >
                          {totalPages}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 sm:w-auto sm:px-4 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium border border-gray-200 dark:border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-1 shadow-sm shrink-0 active:scale-95"
                  aria-label="Halaman selanjutnya"
                >
                  <span className="hidden sm:inline text-sm">{t("gallery.next") || "Selanjutnya"}</span>
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
        
        {/* Modal dengan Logika Baru */}
        {detail && <DetailModal item={detail} onClose={() => setDetail(null)} />}
      </div>
    </section>
  );
};

export default MotifExplorer;