import React, { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { motifService, galleryService } from "../api/api";
import { useI18n } from "../context/I18nContext";

interface MotifItem {
  id: string;
  name: string;
  description: string;
  image: string;
  region: string;
  province: string;
  tags: string[];
}

interface MotifMarker {
  motif: MotifItem;
  position: [number, number];
  provinceName: string;
}

const PROVINCE_COORDINATES: Record<string, [number, number]> = {
  "JAWA BARAT": [-6.9175, 107.6191], 
  "JAWA TENGAH": [-7.0051, 110.4381], 
  "JAWA TIMUR": [-7.2575, 112.7521], 
  "DI YOGYAKARTA": [-7.7956, 110.3695], 
  "DKI JAKARTA": [-6.2088, 106.8456], 
  "BALI": [-8.4095, 115.1889], 
  "SUMATERA UTARA": [3.5952, 98.6722], 
  "SUMATERA BARAT": [-0.9492, 100.3543],
  "SUMATERA SELATAN": [-2.9761, 104.7754], 
  "KALIMANTAN TENGAH": [-2.2104, 113.9200], 
  "KALIMANTAN BARAT": [-0.0263, 109.3425], 
  "KALIMANTAN TIMUR": [-1.2388, 116.8642], 
  "SULAWESI SELATAN": [-5.1477, 119.4327], 
  "SULAWESI UTARA": [1.4748, 124.8426], 
  "PAPUA": [-2.5330, 140.7181], 
  "PAPUA BARAT": [-0.8615, 134.0620], 
  "NUSA TENGGARA BARAT": [-8.5833, 116.1167], 
  "NUSA TENGGARA TIMUR": [-10.1718, 123.6075], 
  "MALUKU": [-3.2385, 130.1453], 
  "MALUKU UTARA": [0.7893, 127.3842], 
  "ACEH": [5.5483, 95.3238], 
  "LAMPUNG": [-5.4294, 105.2620], 
  "BENGKULU": [-3.7924, 102.2608], 
  "RIAU": [0.5071, 101.4478], 
  "KEPULAUAN RIAU": [1.0833, 104.4833], 
  "JAMBI": [-1.6101, 103.6131], 
  "BANTEN": [-6.1200, 106.1503],
  "KALIMANTAN SELATAN": [-3.3144, 114.5925], 
  "KALIMANTAN UTARA": [3.3167, 117.6333], 
  "GORONTALO": [0.5449, 123.0597], 
  "SULAWESI TENGAH": [-0.9000, 119.8667], 
  "SULAWESI TENGGARA": [-3.9985, 122.5129], 
  "SULAWESI BARAT": [-2.6688, 118.8623], 
};

const createCustomIcon = (color: string = "#F59E0B") => {
  return new Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 0 C20 0 8 8 8 20 L8 35 C8 42 13 47 20 47 C27 47 32 42 32 35 L32 20 C32 8 20 0 20 0 Z" fill="white" stroke="${color}" stroke-width="2"/>
        <path d="M12 20 L28 20" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <path d="M14 25 L26 25" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M16 30 L24 30" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="20" cy="12" r="3" fill="${color}"/>
      </svg>
    `)}`,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
  });
};

function ChangeMapView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

const MotifMaps: React.FC = () => {
  const { t, lang } = useI18n() as any;
  const [motifs, setMotifs] = useState<MotifItem[]>([]);
  const [markers, setMarkers] = useState<MotifMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMotif, setSelectedMotif] = useState<MotifItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.5489, 118.0149]);
  const [mapZoom, setMapZoom] = useState(5);

  // Helper to get exact image name based on the public/gallery files
  const getExactImageName = (name: string) => {
    const withoutBatik = name.replace("Batik ", "");
    
    if (withoutBatik.startsWith("Jakarta Ondelondel")) return "Jakarta_OndelOndel";
    if (withoutBatik.startsWith("Jawa Barat")) return "JawaBarat_Megamendung";
    if (withoutBatik.startsWith("Jawa Tengah")) {
      const motifPart = withoutBatik.replace("Jawa Tengah ", "");
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
    return withoutBatik.replace(" ", "_");
  };

  useEffect(() => {
    const fetchMotifs = async () => {
      try {
        // Fetch with a large limit to get all motifs for the map
        const res = await motifService.getAll("limit=1000");
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
            image: item.image,
            description: item.description,
            province: item.province || "Unknown",
            region: item.region || "",
            tags: item.tags || ["Batik", "Tradisional"],
          }));
          setMotifs(mappedData);
        } else {
          // Fallback to galleryService if motifService is empty
          const galleryRes = await galleryService.getAll();
          const galleryData = Array.isArray(galleryRes.data) ? galleryRes.data : [];
          
          if (galleryData.length > 0) {
            const mappedData: MotifItem[] = galleryData.map((item: any) => ({
              id: `gallery-${item.index}`,
              name: item.name,
              image: `/gallery/${getExactImageName(item.name)}.jpg`,
              description: item.philosophy,
              province: item.location,
              region: item.location.split(",")[0].trim(),
              tags: ["Batik", "Tradisional"],
            }));
            setMotifs(mappedData);
          }
        }
      } catch (err) {
        console.error("Error fetching motifs for map:", err);
        setMotifs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMotifs();
  }, []);

  useEffect(() => {
    if (motifs.length === 0) return;

    const motifMarkers: MotifMarker[] = [];
    
    // Gunakan jitter agar marker tidak bertumpuk sempurna di koordinat provinsi yang sama
    const jitter = () => (Math.random() - 0.5) * 0.45; // Offset sekitar 0.45 derajat

    motifs.forEach((motif) => {
      // Ambil bagian pertama sebagai provinsi (misal: "Bali, Denpasar" -> "Bali")
      const provinceName = motif.province.split(",")[0].trim().toUpperCase();
      
      const basePosition: [number, number] = PROVINCE_COORDINATES[provinceName] || [-2.5489, 118.0149];
      
      // Tambahkan jitter ke posisi
      const position: [number, number] = [
        basePosition[0] + jitter(),
        basePosition[1] + jitter()
      ];

      motifMarkers.push({
        motif,
        position,
        provinceName,
      });
    });

    setMarkers(motifMarkers);
  }, [motifs]);

  const filteredMarkers = useMemo(() => {
    if (!searchQuery.trim()) return markers;
    
    const query = searchQuery.toLowerCase();
    return markers.filter(
      (marker) =>
        marker.motif.name.toLowerCase().includes(query) ||
        marker.motif.region.toLowerCase().includes(query) ||
        marker.motif.province.toLowerCase().includes(query) ||
        marker.provinceName.toLowerCase().includes(query)
    );
  }, [markers, searchQuery]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setMapCenter([-2.5489, 118.0149]);
      setMapZoom(5);
      return;
    }

    const firstMatch = filteredMarkers[0];
    if (firstMatch) {
      setMapCenter(firstMatch.position);
      setMapZoom(8);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 dark:border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            {lang === "id" ? "Memuat peta motif batik..." : "Loading batik motif map..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative bg-white dark:bg-gray-900 overflow-hidden">
      <div className="absolute top-24 sm:top-24 md:top-20 left-1/2 transform -translate-x-1/2 z-30 md:z-[1000] w-[calc(100%-1rem)] sm:w-full max-w-2xl px-2 sm:px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 transition-colors">
          <input
            type="text"
            placeholder={t("maps.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-none outline-none rounded-lg"
          />
          <button
            onClick={handleSearch}
            className="bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-600 text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-lg font-medium transition-colors flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="hidden sm:inline">{t("maps.search")}</span>
          </button>
        </div>
      </div>
      {!searchQuery && (
        <div className="absolute top-40 sm:top-40 md:top-32 left-2 sm:left-4 z-30 md:z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 sm:p-4 max-w-[calc(100%-1rem)] sm:max-w-xs transition-colors">
          <h1 className="text-base sm:text-xl font-bold text-gray-800 dark:text-white mb-1">
            {t("maps.title")}
          </h1>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {t("maps.instructions")}
          </p>
        </div>
      )}

      {searchQuery && filteredMarkers.length > 0 && (
        <div className="absolute top-40 sm:top-40 md:top-32 left-2 sm:left-4 z-30 md:z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 sm:p-4 max-w-[calc(100%-1rem)] sm:max-w-xs transition-colors">
          <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white">
            {t("maps.foundCount").replace("{count}", String(filteredMarkers.length))}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {t("maps.forQuery").replace("{q}", searchQuery)}
          </p>
        </div>
      )}

      {searchQuery && filteredMarkers.length === 0 && (
        <div className="absolute top-40 sm:top-40 md:top-32 left-2 sm:left-4 z-30 md:z-[1000] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 sm:p-4 max-w-[calc(100%-1rem)] sm:max-w-xs border-l-4 border-amber-500 transition-colors">
          <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-white">
            {t("maps.notFound")}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {t("maps.noMatch").replace("{q}", searchQuery)}
          </p>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100vh", width: "100%", zIndex: 0 }}
        className="z-0"
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | © CARTO'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeMapView center={mapCenter} zoom={mapZoom} />

        {filteredMarkers.map((marker, index) => (
          <Marker
            key={`${marker.motif.id}-${index}`}
            position={marker.position}
            icon={createCustomIcon("#B45309")}
            eventHandlers={{
              click: () => {
                setSelectedMotif(marker.motif);
              },
            }}
          >
            <Popup 
              className="custom-popup"
              autoPan={true}
              autoPanPadding={[80, 50]}
              autoPanPaddingTopLeft={[0, 80]}
              autoPanPaddingBottomRight={[0, 0]}
              closeButton={true}
              maxWidth={300}
              minWidth={200}
            >
              <div className="p-3 bg-white dark:bg-gray-800">
                <h3 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white mb-2">
                  {marker.motif.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                  {marker.provinceName}
                </p>
                {marker.motif.region && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {t("maps.region")} {marker.motif.region}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-2">
                  {marker.motif.description}
                </p>
                <button
                  onClick={() => setSelectedMotif(marker.motif)}
                  className="w-full mt-2 px-3 py-1.5 bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors"
                >
              {lang === "id" ? "Lihat Detail" : "View Details"}
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute bottom-3 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-30 md:z-[1000]">
        <button className="bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg font-semibold text-sm sm:text-lg flex items-center gap-1 sm:gap-2 transition-colors">
          <svg
            className="w-4 h-4 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="hidden xs:inline">{searchQuery ? filteredMarkers.length : markers.length} {t("maps.totalMotifs")}</span>
          <span className="xs:hidden">{searchQuery ? filteredMarkers.length : markers.length}</span>
        </button>
      </div>

      {selectedMotif && (
        <div className="fixed sm:absolute inset-0 sm:top-4 sm:right-4 sm:inset-auto z-[1001] bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-xl p-4 sm:p-6 max-w-full sm:max-w-sm w-full sm:w-auto h-full sm:h-auto max-h-screen sm:max-h-[80vh] overflow-y-auto transition-colors">
          <button
            onClick={() => setSelectedMotif(null)}
            className="fixed sm:absolute top-4 right-4 sm:top-2 sm:right-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <img
            src={selectedMotif.image}
            alt={selectedMotif.name}
            className="w-full h-40 sm:h-48 object-cover rounded-lg mb-4"
          />
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-2">
            {selectedMotif.name}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2">
            <span className="font-semibold">{t("maps.province")}</span> {selectedMotif.province}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-4">
            <span className="font-semibold">{t("maps.region")}</span> {selectedMotif.region}
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm leading-relaxed mb-4">
            {selectedMotif.description}
          </p>
          {selectedMotif.tags && selectedMotif.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedMotif.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MotifMaps;
