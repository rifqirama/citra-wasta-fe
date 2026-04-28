import React, { useEffect, useRef, useState, useCallback } from "react";
import "@google/model-viewer";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../components/elements/select";

// --- Types ---
type BaseColorTexture = { setTexture: (tex: unknown) => void; };
type PbrMetallicRoughness = { baseColorTexture?: BaseColorTexture; };
type ModelMaterial = { name?: string; pbrMetallicRoughness?: PbrMetallicRoughness; };
type ModelViewerModel = { materials?: ModelMaterial[]; };
type ModelViewerElement = HTMLElement & {
  model?: ModelViewerModel;
  src?: string;
  createTexture?: (uri: string) => Promise<unknown>;
};

type ModelViewerProps = {
  src: string;
  ar?: boolean;
  "camera-controls"?: boolean;
  "touch-action"?: string;
  crossorigin?: string;
  exposure?: string;
  style?: React.CSSProperties;
};

const ModelViewerEl = React.forwardRef<ModelViewerElement, ModelViewerProps>(
  (props, ref) => React.createElement("model-viewer", { ...props, ref })
);

const BatikArViewer: React.FC<{ textureUrl: string; className?: string; modelSrc?: string }> = ({ textureUrl, className, modelSrc }) => {
  const ref = useRef<ModelViewerElement | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState(modelSrc || "/models/kemejawanita.glb");
  
  useEffect(() => {
    setResolvedSrc(modelSrc || "/models/kemejawanita.glb");
  }, [modelSrc]);
  
  const [modelReady, setModelReady] = useState(false);
  const textureRef = useRef<unknown>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const models = [
    { name: "Dress", src: "/models/kemejawanita.glb" },
    { name: "Shirt", src: "/models/kemejapria.glb" },
    { name: "Shoe", src: "/models/sepatu.glb" },
  ];

  // Menerapkan tekstur ke semua material model
  const applyTextureToModel = useCallback((model: ModelViewerModel, tex: unknown) => {
    if (!tex || !model) return false;
    const mats = model.materials || [];
    mats.forEach((m: any) => {
      if (m.pbrMetallicRoughness) {
        try {
          // Reset warna dasar ke putih agar tekstur tidak tercampur dengan warna bawaan model (seperti pink/abu-abu)
          if (typeof m.pbrMetallicRoughness.setBaseColorFactor === 'function') {
            m.pbrMetallicRoughness.setBaseColorFactor([1, 1, 1, 1]); // Set to white
          }
          
          if (m.pbrMetallicRoughness.baseColorTexture) {
            m.pbrMetallicRoughness.baseColorTexture.setTexture(tex);
          } else {
            console.warn("BaseColorTexture property not found on material:", m.name || 'Unnamed Material');
          }
        } catch (e) {
          console.warn("Gagal setTexture pada material:", m.name || 'Unnamed Material', e);
        }
      }
    });
    return true;
  }, []);

  // Memaksa penerapan tekstur (dipanggil berkala)
  const forceApplyTexture = useCallback(() => {
    if (!ref.current?.model || !textureRef.current) return false;
    return applyTextureToModel(ref.current.model, textureRef.current);
  }, [applyTextureToModel]);

  // Buat tekstur dari URL saat model siap
  useEffect(() => {
    if (!modelReady || !ref.current || !textureUrl) {
      if (!textureUrl) textureRef.current = null;
      return;
    }

    let active = true;
    const loadTexture = async () => {
      if (!ref.current?.createTexture) {
        console.warn("createTexture tidak tersedia");
        return;
      }
      try {
        const tex = await ref.current.createTexture(textureUrl);
        if (active) {
          textureRef.current = tex;
          forceApplyTexture(); // langsung terapkan sekali
        }
      } catch (e) {
        console.error("Gagal membuat tekstur:", e);
      }
    };
    loadTexture();

    return () => {
      active = false;
    };
  }, [modelReady, textureUrl, forceApplyTexture]);

  // Interval untuk memastikan tekstur tetap terpasang (atasi overwrite)
  useEffect(() => {
    if (!modelReady || !textureRef.current) return;

    // Bersihkan interval sebelumnya jika ada
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    let retryCount = 0;
    const maxRetries = 15; // jumlah percobaan
    intervalRef.current = setInterval(() => {
      forceApplyTexture();
      retryCount++;
      if (retryCount >= maxRetries && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 150); // interval 150ms

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [modelReady, textureRef.current, forceApplyTexture]); // eslint-disable-line

  // Event listener untuk model load
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onLoad = () => setModelReady(true);
    el.addEventListener("load", onLoad);
    if (el.model) setModelReady(true);

    return () => el.removeEventListener("load", onLoad);
  }, [resolvedSrc]);

  // Reset saat model diganti
  useEffect(() => {
    setModelReady(false);
    textureRef.current = null;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [resolvedSrc]);

  return (
    <div className={className}>
      <div className="mb-4 flex gap-2 items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Model:</span>
        <div className="w-32">
          <Select value={resolvedSrc} onValueChange={setResolvedSrc}>
            <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
              {models.map((m) => (
                <SelectItem key={m.src} value={m.src}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

     <div className="rounded-xl border bg-gray-50 dark:bg-gray-900 dark:border-gray-800 overflow-hidden">
        <ModelViewerEl
          ref={ref}
          src={resolvedSrc}
          ar
          camera-controls
          touch-action="pan-y"
          crossorigin="anonymous"
          exposure="1.2"
          style={{ width: "100%", height: "450px" }}
        />
      </div>
    </div>
  );
};

export default BatikArViewer;