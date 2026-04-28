import * as React from "react";
import { useState, useContext, useEffect, lazy, Suspense } from "react";
import { WastraContext } from "../context/WastraContext";
import DetectionIntro from "../components/fragments/DetectionIntro";
import { X, Volume2, VolumeX, Loader2 } from "lucide-react";
import { predictionService, motifService, ttsService, galleryService } from "../api/api";
const BatikArViewer = lazy(() => import("../components/common/BatikArViewer"));
const RichMarkdown = lazy(() => import("../components/common/RichMarkdown"));
import Footer from "../components/fragments/Footer";

// Sample images used for “Try a sample image” section
import sample1 from "../assets/images/batik-preview1.jpeg";
import sample2 from "../assets/images/batik-preview2.jpeg";
import sample3 from "../assets/images/batik-preview3.jpeg";
import sample4 from "../assets/images/batik-preview4.jpeg";
import sample5 from "../assets/images/batik-bali.jpg";
import sample6 from "../assets/images/batik-parang.jpg";

import { useI18n } from "../context/I18nContext";

interface TopPrediction {
  class_name: string;
  confidence: number;
}

interface DetectionData {
  prediction: string;
  confidence: number;
  top_predictions: TopPrediction[];
  timestamp: string;
  aiNarrative?: string | null;
}

interface DetectionResponse {
  success: boolean;
  data: DetectionData;
}

interface MotifData {
  id: string;
  name: string;
  description: string;
  image: string;
  region: string;
  province: string;
  tags: string[];
}

const DetectionPage: React.FC = () => {
  const { user, loading } = useContext(WastraContext) ?? {};
  const { t } = useI18n();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<DetectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [motifData, setMotifData] = useState<MotifData | null>(null);
  const [loadingMotif, setLoadingMotif] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem("voice_enabled");
    return saved ? JSON.parse(saved) : true;
  });
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const speakResult = async (text: string) => {
    if (!isVoiceEnabled) return;
    
    // Stop any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // remove bold
      .replace(/\*(.*?)\*/g, '$1')     // remove italic
      .replace(/#/g, ' ')              // remove hash
      .replace(/\((.*?)\)/g, '')       // remove parenthesized text
      .replace(/\n+/g, ' ')           // replace newlines with space
      .replace(/\s+/g, ' ')           // normalize spaces
      .trim();

    try {
      setIsSynthesizing(true);
      const response = await ttsService.synthesize(cleanText);
      const audioBlob = response.data;
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.playbackRate = 0.95; // Artikulasi vokal lebih jelas
      audioRef.current = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      console.error("Edge TTS failed, falling back to Web Speech API", error);
      
      // Fallback logic using Web Speech API
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      
      // Find native Indonesian female voice
      const idVoice = voices.find(v => v.lang.includes('id-ID') && (v.name.includes('Gadis') || v.name.includes('Damayanti'))) || 
                      voices.find(v => v.lang.includes('id-ID'));
      
      if (idVoice) {
        utterance.voice = idVoice;
        utterance.lang = 'id-ID';
      }
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Pre-load voices for browsers that load them asynchronously
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("voice_enabled", JSON.stringify(isVoiceEnabled));
  }, [isVoiceEnabled]);

  // Stop speech when component unmounts or page refreshes
  useEffect(() => {
    const handleUnload = () => {
      window.speechSynthesis.cancel();
    };

    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      window.speechSynthesis.cancel();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const sampleImages = [
    { src: sample1, alt: "Batik sample 1" },
    { src: sample2, alt: "Batik sample 2" },
    { src: sample3, alt: "Batik sample 3" },
    { src: sample4, alt: "Batik sample 4" },
    { src: sample5, alt: "Batik sample 5" },
    { src: sample6, alt: "Batik sample 6" },
  ];

  const loadSampleImage = async (src: string) => {
    try {
      setError(null);
      setLoadingSample(true);
      const response = await fetch(src);
      const blob = await response.blob();
      const file = new File([blob], "sample.jpg", { type: blob.type || "image/jpeg" });
      processImageFile(file);
    } catch (err) {
      console.error("Failed to load sample image", err);
      setError("Gagal memuat sample image. Silakan coba lagi.");
    } finally {
      setLoadingSample(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  if (!user && !loading) {
    return <DetectionIntro />;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError(t("detection.fileMustBeImage"));
      return;
    }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleCameraClick = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.style.position = 'fixed';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.zIndex = '9999';
        video.style.objectFit = 'cover';
        
        const canvas = document.createElement('canvas');
        const captureBtn = document.createElement('button');
        captureBtn.textContent = 'Capture Photo';
        captureBtn.style.position = 'fixed';
        captureBtn.style.bottom = '20px';
        captureBtn.style.left = '50%';
        captureBtn.style.transform = 'translateX(-50%)';
        captureBtn.style.zIndex = '10000';
        captureBtn.style.padding = '12px 24px';
        captureBtn.style.backgroundColor = '#d97706';
        captureBtn.style.color = 'white';
        captureBtn.style.border = 'none';
        captureBtn.style.borderRadius = '8px';
        captureBtn.style.cursor = 'pointer';
        captureBtn.style.fontSize = '16px';
        captureBtn.style.fontWeight = 'bold';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.position = 'fixed';
        closeBtn.style.top = '20px';
        closeBtn.style.right = '20px';
        closeBtn.style.zIndex = '10000';
        closeBtn.style.padding = '10px 15px';
        closeBtn.style.backgroundColor = 'rgba(0,0,0,0.5)';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '20px';
        
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        overlay.style.zIndex = '9998';
        
        const cleanup = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(video);
          document.body.removeChild(overlay);
          document.body.removeChild(captureBtn);
          document.body.removeChild(closeBtn);
        };
        
        captureBtn.onclick = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
                processImageFile(file);
              }
              cleanup();
            }, 'image/jpeg', 0.95);
          }
        };
        
        closeBtn.onclick = cleanup;
        
        document.body.appendChild(overlay);
        document.body.appendChild(video);
        document.body.appendChild(captureBtn);
        document.body.appendChild(closeBtn);
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (cameraInputRef.current) {
          cameraInputRef.current.click();
        }
      }
    } else {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const resetImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setMotifData(null);
  };

  const fetchMotifByPrediction = async (predictionName: string) => {
    if (!predictionName) return null;
    
    setLoadingMotif(true);
    const normalizedPrediction = predictionName.toLowerCase().trim();
    const predictionWithoutBatik = normalizedPrediction.replace(/^batik\s+/, '').trim();
    
    try {
      const response = await motifService.getAll();
      const motifs = Array.isArray(response.data) ? response.data : [];
      
      const matchedMotif = motifs.find((motif: any) => {
        const motifNameLower = motif.name.toLowerCase().trim();
        const motifNameWithoutBatik = motifNameLower.replace(/^batik\s+/, '').trim();
        
        if (motifNameLower === normalizedPrediction) return true;
        if (motifNameWithoutBatik === predictionWithoutBatik) return true;
        
        if (motifNameLower.includes(normalizedPrediction)) return true;
        if (normalizedPrediction.includes(motifNameLower)) return true;
        if (motifNameWithoutBatik.includes(predictionWithoutBatik)) return true;
        if (predictionWithoutBatik.includes(motifNameWithoutBatik)) return true;
        
        return false;
      });
      
      if (matchedMotif) {
        // Jika data dari DB, sudah dalam format MotifData
        // Pastikan path image konsisten dengan /gallery/
        const motifWithGalleryImage = {
          ...matchedMotif,
          image: matchedMotif.image.startsWith('/gallery/') 
            ? matchedMotif.image 
            : `/gallery/${getExactImageName(matchedMotif.name)}.jpg`
        };
        setMotifData(motifWithGalleryImage);
        return motifWithGalleryImage;
      }
      return null;
    } catch (err: any) {
      console.error("Error fetching motifs from database:", err);
      // Fallback terakhir ke galleryService jika DB gagal
      try {
        const galleryRes = await galleryService.getAll();
        const galleryMotifs = Array.isArray(galleryRes.data) ? galleryRes.data : [];
        const matched = galleryMotifs.find((item: any) => {
          const name = item.name.toLowerCase();
          return name.includes(predictionWithoutBatik) || predictionWithoutBatik.includes(name.replace('batik ', ''));
        });
        if (matched) {
          const mapped = {
            id: `gallery-${matched.index}`,
            name: matched.name,
            description: matched.philosophy,
            image: `/gallery/${getExactImageName(matched.name)}.jpg`,
            region: matched.location.split(",")[0].trim(),
            province: matched.location,
            tags: ["Batik", "Tradisional"]
          };
          setMotifData(mapped);
          return mapped;
        }
      } catch (e) {
        console.error("All fallback failed");
      }
      return null;
    } finally {
      setLoadingMotif(false);
    }
  };

  // Helper to get exact image name (copied from MotifExplorer for consistency)
  const getExactImageName = (name: string) => {
    const withoutBatik = name.replace("Batik ", "");
    
    if (withoutBatik.startsWith("Jakarta Ondelondel")) return "Jakarta_OndelOndel";
    if (withoutBatik.startsWith("Jawa Barat")) return "JawaBarat_Megamendung";
    if (withoutBatik.startsWith("Jawa Tengah")) {
      const motifPart = withoutBatik.replace("Jawa Tengah ", "");
      const complexMap: Record<string, string> = {
        "Asemarang": "AsemArang", "Asemsinom": "AsemSinom", "Asemwarak": "AsemWarak",
        "Cindewilis": "CindeWilis", "Gambangsemarangan": "GambangSemarangan",
        "Ikankerang": "IkanKerang", "Jagunglombok": "JagungLombok",
        "Jambubelimbing": "JambuBelimbing", "Jambucitra": "JambuCitra",
        "Jayakusuma": "JayaKusuma", "Kembangsepatu": "KembangSepatu",
        "Luriksemangka": "LurikSemangka", "Masjidagungdemak": "MasjidAgungDemak",
        "Parangkusumo": "ParangKusumo", "Parangslobog": "ParangSlobog",
        "Sarimulat": "SariMulat", "Sekargudhe": "SekarGudhe",
        "Tanjunggunung": "TanjungGunung", "Tebubambu": "TebuBambu",
        "Tugumuda": "TuguMuda", "Warakberasutah": "WarakBerasUtah",
        "Worawarirumpuk": "WorawariRumpuk"
      };
      return `JawaTengah_${complexMap[motifPart] || motifPart}`;
    }
    if (withoutBatik.startsWith("Jawa Timur")) return `JawaTimur_${withoutBatik.replace("Jawa Timur ", "")}`;
    if (withoutBatik.startsWith("Kalimantan Barat")) return `KalimantanBarat_${withoutBatik.replace("Kalimantan Barat ", "")}`;
    if (withoutBatik.startsWith("Kalimantan Dayak")) return "Kalimantan_Dayak";
    if (withoutBatik.startsWith("Lampunggajah")) return "Lampung_Gajah";
    if (withoutBatik.startsWith("Lampung Kacang Hijau")) return "Lampung_KacangHijau";
    if (withoutBatik.startsWith("Lampung Bledheg")) return "Lampung_Bledheg";
    if (withoutBatik.startsWith("Malukupala")) return "Maluku_Pala";
    if (withoutBatik.startsWith("NTB Lumbung")) return "NTB_Lumbung";
    if (withoutBatik.startsWith("Papua")) return `Papua_${withoutBatik.replace("Papua ", "")}`;
    if (withoutBatik.startsWith("Sulawesi Selatan")) return `SulawesiSelatan_${withoutBatik.replace("Sulawesi Selatan ", "")}`;
    if (withoutBatik.startsWith("Sumatera Barat")) return `SumateraBarat_${withoutBatik.replace("Sumatera Barat ", "").replace(/\s/g, '')}`;
    if (withoutBatik.startsWith("Sumatera Utara")) return `SumateraUtara_${withoutBatik.replace("Sumatera Utara ", "").replace(/\s/g, '')}`;
    if (withoutBatik.startsWith("Yogyakarta")) {
      const motifPart = withoutBatik.replace("Yogyakarta ", "");
      const complexMap: Record<string, string> = {
        "Cakarayam": "CakarAyam", "Ceplokliring": "CeplokLiring", "Jayakirana": "JayaKirana",
        "Klampokarum": "KlampokArum", "Kuncupkanthil": "KuncupKanthil",
        "Parangcurigo": "ParangCurigo", "Parangrusak": "ParangRusak", "Parangtuding": "ParangTuding",
        "Sekarandhong": "SekarAndhong", "Sekarblimbing": "SekarBlimbing", "Sekarcengkeh": "SekarCengkeh",
        "Sekardangan": "SekarDangan", "Sekardhuku": "SekarDhuku", "Sekardlima": "SekarDlima",
        "Sekarduren": "SekarDuren", "Sekargambir": "SekarGambir", "Sekargayam": "SekarGayam",
        "Sekarjagung": "SekarJagung", "Sekarjali": "SekarJali", "Sekarjeruk": "SekarJeruk",
        "Sekarkeben": "SekarKeben", "Sekarkemuning": "SekarKemuning", "Sekarkenanga": "SekarKenanga",
        "Sekarkenikir": "SekarKenikir", "Sekarkenthang": "SekarKenthang", "Sekarkepel": "SekarKepel",
        "Sekarketongkeng": "SekarKetongkeng", "Sekarlintang": "SekarLintang", "Sekarmanggis": "SekarManggis",
        "Sekarmenur": "SekarMenur", "Sekarmindi": "SekarMindi", "Sekarmlathi": "SekarMlathi",
        "Sekarmrica": "SekarMrica", "Sekarmundhu": "SekarMundhu", "Sekarnangka": "SekarNangka",
        "Sekarpacar": "SekarPacar", "Sekarpala": "SekarPala", "Sekarpijetan": "SekarPijetan",
        "Sekarpudhak": "SekarPudhak", "Sekarrandhu": "SekarRandhu", "Sekarsawo": "SekarSawo",
        "Sekarsoka": "SekarSoka", "Sekarsrengenge": "SekarSrengenge", "Sekarsrigadhing": "SekarSrigadhing",
        "Sekartanjung": "SekarTanjung", "Sekartebu": "SekarTebu"
      };
      return `Yogyakarta_${complexMap[motifPart] || motifPart}`;
    }
    return withoutBatik.replace(" ", "_");
  };

  const handleProcess = async () => {
    if (!selectedImage) {
      setError("Pilih gambar terlebih dahulu!");
      return;
    }

    setProcessing(true);
    setError(null);
    setRetryMessage(null);
    
    // Silent trigger for speech synthesis to "unlock" on mobile/Chrome
    if (isVoiceEnabled) {
      const silent = new SpeechSynthesisUtterance("");
      window.speechSynthesis.speak(silent);
    }

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Kamu harus login terlebih dahulu!");

      const onRetry = (attempt: number) => {
        const messageKey = `detection.retry${attempt}`;
        setRetryMessage(t(messageKey) || `Menghubungkan ke server... (${attempt}/3)`);
      };
      const response = await predictionService.predict(formData, 3, onRetry) as any;
      const json: DetectionResponse = response.data;
      console.log("=== API PREDICTION RESPONSE ===", json);

      if (json.success && json.data) {
        console.log("Setting result to:", json.data);
        
        // 1. Fetch static data immediately to have it ready
        const staticData = await fetchMotifByPrediction(json.data.prediction);

        // 2. Cek apakah Gemini mengembalikan narasi yang valid
        const aiText = json.data.aiNarrative || "";
        const isInvalid = aiText.includes("belum tersedia") || 
                         aiText.includes("database") || 
                         aiText.includes("limit") || 
                         aiText.length < 20;

        if (isInvalid && staticData) {
          console.log("Gemini narrative is invalid or missing, using static fallback");
          json.data.aiNarrative = staticData.description;
        }

        setResult(json.data);
        setRetryMessage(null);
        
        // Speak result
        const confidencePercent = (json.data.confidence * 100).toFixed(0);
        const narrative = json.data.aiNarrative || "";
        const speechText = t("lang") === "id" 
          ? `Hasil deteksi: ${json.data.prediction}. Tingkat keyakinan ${confidencePercent} persen. ${narrative}`
          : `Detection result: ${json.data.prediction}. Confidence level ${confidencePercent} percent. ${narrative}`;
        speakResult(speechText);
      } else {
        setError("Response backend tidak valid");
      }
    } catch (err: unknown) {
      console.error("Prediction error:", err);
      setRetryMessage(null);

      if (err instanceof Error && err.message) {
        // Handle timeout errors
        if (err.message.includes("timeout") || err.message.includes("504")) {
          setError("Prediksi memakan waktu terlalu lama. Silakan coba lagi dengan gambar yang lebih kecil atau tunggu beberapa saat.");
        } else if (err.message.includes("503")) {
          // Don't show technical error, show user-friendly message
          setError("Sistem sedang dalam tahap maintenance. Silakan coba lagi nanti.");
        } else if (err.message.includes("Request failed")) {
          // Generic network error - show user-friendly message
          setError("Terjadi kesalahan saat menghubungi server. Silakan coba lagi.");
        } else {
          // For other errors, show the message if it's user-friendly, otherwise show generic message
          const isTechnicalError = err.message.includes("status code") || 
                                  err.message.includes("ECONNREFUSED") ||
                                  err.message.includes("ERR_");
          setError(isTechnicalError 
            ? "Terjadi kesalahan saat memproses permintaan. Silakan coba lagi." 
            : err.message);
        }
      } else if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { 
          response?: { 
            status?: number; 
            data?: { 
              message?: string;
              suggestion?: string;
              maintenance?: boolean;
            } 
          };
          code?: string;
          message?: string;
        };
        
        if (axiosError.code === "ECONNABORTED" || axiosError.message?.includes("timeout")) {
          setError("Prediksi memakan waktu terlalu lama setelah beberapa percobaan. Service mungkin sedang dalam proses wake-up. Silakan coba lagi dalam beberapa saat.");
        } else if (axiosError.response?.status === 503) {
          // Check if it's maintenance mode
          if (axiosError.response?.data?.maintenance === true) {
            setError(axiosError.response?.data?.message || "Sistem sedang dalam tahap maintenance. Silakan coba lagi nanti.");
          } else {
            setError("Layanan sedang memulai. Silakan coba lagi dalam beberapa detik.");
          }
        } else if (axiosError.response?.status === 504) {
          setError("Layanan sedang memulai. Silakan coba lagi dalam beberapa detik.");
        } else if (axiosError.response?.status === 404) {
          setError("Fitur yang diminta tidak ditemukan. Silakan hubungi administrator.");
        } else if (axiosError.response?.status === 500) {
          setError("Terjadi kesalahan pada server. Silakan coba lagi nanti atau hubungi administrator.");
        } else if (axiosError.response?.status === 401) {
          setError("Sesi Anda telah berakhir. Silakan login kembali.");
        } else if (axiosError.response?.status === 403) {
          setError("Anda tidak memiliki izin untuk melakukan aksi ini.");
        } else {
          // Use backend message if available and user-friendly, otherwise show generic message
          const backendMessage = axiosError.response?.data?.message;
          if (backendMessage && !backendMessage.includes("status code") && !backendMessage.includes("Request failed")) {
            setError(backendMessage);
          } else {
            setError("Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.");
          }
        }
      } else {
        setError("Terjadi kesalahan tak terduga");
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="grid-hero-bg relative">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl font-bold text-center mb-3 text-gray-800 dark:text-white">
            Batik Motif Detection
          </h1>
          <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-10">
            Upload your batik photo and let our AI recognize its motif and origin.
          </p>

        <div
          className={`relative z-10 border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
            isDragging
              ? "border-amber-600 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/30"
              : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 hover:border-amber-600 dark:hover:border-amber-600 hover:shadow-lg"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="mx-auto max-h-64 object-contain rounded-lg mb-4 shadow"
            />
            {processing && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-lg">
                <svg
                  className="animate-spin h-10 w-10 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
              </div>
            )}
            <button
              onClick={resetImage}
              className="absolute top-3 right-3 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-full shadow-lg backdrop-blur-sm transition"
              aria-label="Reset Image"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-300 mb-2 font-medium">
                {isDragging ? "Drop image here" : "Drag & drop image here"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">or</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <label className="inline-flex items-center px-6 py-3 bg-amber-600 dark:bg-amber-700 text-white rounded-lg cursor-pointer hover:bg-amber-700 dark:hover:bg-amber-600 transition shadow-md">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Select Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleCameraClick}
                className="inline-flex items-center px-6 py-3 bg-amber-600 dark:bg-amber-700 text-white rounded-lg cursor-pointer hover:bg-amber-700 dark:hover:bg-amber-600 transition shadow-md"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Use Camera
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">
          Or Try a Sample Image
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 justify-center">
          {sampleImages.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => loadSampleImage(img.src)}
              disabled={loadingSample}
              className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-600"
              aria-label={`Sample image ${idx + 1}`}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-20 object-cover transition-transform duration-200 hover:scale-105"
              />
            </button>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div className="text-center mt-6">
          <button
            onClick={handleProcess}
            disabled={processing}
            className={`px-6 py-3 rounded-lg text-white font-medium transition shadow-md ${
              processing
                ? "bg-gray-400 dark:bg-gray-900 cursor-not-allowed"
                : "bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-600"
            }`}
          >
            {processing ? "Processing..." : "Start Detection"}
          </button>
        </div>
      )}

      {retryMessage && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-2 w-2 rounded-full bg-amber-600 animate-ping"></div>
            <p className="text-amber-700 dark:text-amber-400 font-semibold text-sm md:text-base text-center leading-relaxed">
              {retryMessage}
            </p>
          </div>
          <div className="w-48 h-1 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
            <div className="h-full bg-amber-600 animate-pulse rounded-full"></div>
          </div>
        </div>
      )}
      
      {error && (
        <p className="mt-4 text-center text-red-500 dark:text-red-400 font-semibold">{error}</p>
      )}

      {result && (
        <div className="mt-8 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white order-1">
              {result.prediction}
            </h2>
            
            <div className="flex items-center gap-3 order-2">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-1.5 pr-3 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
                <button
                  onClick={() => {
                    const newState = !isVoiceEnabled;
                    setIsVoiceEnabled(newState);
                    if (!newState) {
                      if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current = null;
                      }
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                    isVoiceEnabled ? "bg-amber-600" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      isVoiceEnabled ? "translate-x-5" : "translate-x-1"
                    } flex items-center justify-center`}
                  >
                    {isVoiceEnabled ? (
                      <Volume2 className="w-2.5 h-2.5 text-amber-600" />
                    ) : (
                      <VolumeX className="w-2.5 h-2.5 text-gray-400" />
                    )}
                  </span>
                </button>
                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${isVoiceEnabled ? "text-amber-600" : "text-gray-400"}`}>
                  Voice
                </span>
              </div>

              {isVoiceEnabled && (
                <button
                  onClick={() => {
                    const confidencePercent = (result.confidence * 100).toFixed(0);
                    const narrative = result.aiNarrative || "";
                    const speechText = t("lang") === "id" 
                      ? `Hasil deteksi: ${result.prediction}. Tingkat keyakinan ${confidencePercent} persen. ${narrative}`
                      : `Detection result: ${result.prediction}. Confidence level ${confidencePercent} percent. ${narrative}`;
                    speakResult(speechText);
                  }}
                  disabled={isSynthesizing}
                  className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
                    isSynthesizing
                      ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 animate-pulse"
                      : "bg-amber-600 text-white hover:bg-amber-700 shadow-md active:scale-90"
                  }`}
                  title={t("lang") === "id" ? "Putar ulang suara" : "Play again"}
                >
                  {isSynthesizing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
              )}

              <span className="px-3 py-1.5 bg-amber-600/10 text-amber-600 dark:text-amber-400 text-sm font-bold rounded-full border border-amber-600/20 whitespace-nowrap">
                {(result.confidence * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          {(motifData?.image || previewUrl) && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                {t("detection.arTitle")}
              </h3>

              <Suspense fallback={<div className="text-sm text-gray-500 dark:text-gray-400 mt-4">Memuat tampilan AR...</div>}>
                <BatikArViewer
                  textureUrl={(previewUrl as string) || (motifData?.image as string)}
                  className="rounded-xl overflow-hidden"
                />
              </Suspense>
            </div>
          )}

          {/* Filosofi & Cerita Motif */}
          {result.aiNarrative ? (
            <div className="mb-6 p-5 bg-amber-600/10 dark:bg-amber-600/10 rounded-xl shadow-sm border border-amber-600/30">
              <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-400 mb-3">
                Filosofi & cerita motif
              </h3>
              
              <div className="text-gray-800 dark:text-gray-200 leading-relaxed prose prose-amber dark:prose-invert max-w-none">
                <Suspense fallback={<div className="text-sm text-gray-500 dark:text-gray-400">Memuat deskripsi motif...</div>}>
                  <RichMarkdown markdown={result.aiNarrative} />
                </Suspense>
              </div>

              {/* Tampilkan Region & Province di dalam blok yang sama jika ada di motifData */}
              {motifData && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-amber-600/20 flex-wrap">
                  {motifData.region && (
                    <span className="px-3 py-1 bg-amber-600/20 dark:bg-amber-600/20 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full uppercase tracking-wider">
                      {motifData.region}
                    </span>
                  )}
                  {motifData.province && (
                    <span className="px-3 py-1 bg-amber-600/20 dark:bg-amber-600/20 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-full uppercase tracking-wider">
                      {motifData.province}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* Hapus blok "Tentang Motif" dan blok error limit yang lama */}
          {loadingMotif && !result.aiNarrative && (
            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <p className="text-amber-700 dark:text-amber-400 text-sm">Mencari detail motif di database...</p>
              </div>
            </div>
          )}

          {Array.isArray(result.top_predictions) &&
          result.top_predictions.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">
                Top-3 Predictions:
              </h3>
              <ul className="space-y-2">
                {result.top_predictions.map((p, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center bg-amber-600/5 dark:bg-amber-600/10 px-4 py-2 rounded-lg border border-amber-600/10"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">{p.class_name}</span>
                    <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      {(p.confidence * 100).toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 mt-2">Belum ada prediksi top-3</p>
          )}
        </div>
      )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DetectionPage;
