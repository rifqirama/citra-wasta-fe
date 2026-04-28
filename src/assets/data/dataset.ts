import { motifImages } from "../images";

export type Island =
  | "Sumatra"
  | "Jawa"
  | "Kalimantan"
  | "Sulawesi"
  | "Bali"
  | "Nusa Tenggara"
  | "Papua"
  | "Maluku";

export interface MotifItem {
  id: string;
  name: string;
  region: Island;
  province: string;
  image: string;
  description: string;
  tags?: string[];
  createdAt: string;
}

export const MOTIFS: MotifItem[] = [
  {
    id: "batik-bali",
    name: "Batik Bali",
    region: "Bali",
    province: "Bali",
    image: motifImages.bali,
    description: "Motif khas Bali dengan ornamen flora-fauna yang penuh warna.",
    tags: ["bali", "flora", "warna"],
    createdAt: "2025-01-01T09:00:00Z",
  },
  {
    id: "batik-betawi",
    name: "Batik Betawi",
    region: "Jawa",
    province: "DKI Jakarta",
    image: motifImages.betawi,
    description: "Motif Batik Betawi penuh simbol budaya Betawi seperti ondel-ondel.",
    tags: ["betawi", "budaya"],
    createdAt: "2025-01-02T09:00:00Z",
  },
  {
    id: "batik-cendrawasih",
    name: "Batik Cendrawasih",
    region: "Papua",
    province: "Papua",
    image: motifImages.cendrawasih,
    description: "Motif yang terinspirasi dari burung Cendrawasih khas Papua.",
    tags: ["papua", "burung"],
    createdAt: "2025-01-03T09:00:00Z",
  },
  {
    id: "batik-dayak",
    name: "Batik Dayak",
    region: "Kalimantan",
    province: "Kalimantan Tengah",
    image: motifImages.dayak,
    description: "Motif dengan ukiran khas suku Dayak yang penuh makna spiritual.",
    tags: ["kalimantan", "dayak"],
    createdAt: "2025-01-04T09:00:00Z",
  },
  {
    id: "batik-geblek-renteng",
    name: "Batik Geblek Renteng",
    region: "Jawa",
    province: "Yogyakarta",
    image: motifImages.geblekRenteng,
    description: "Motif khas Yogyakarta dengan pola lingkaran yang berulang.",
    tags: ["yogyakarta", "geblek"],
    createdAt: "2025-01-05T09:00:00Z",
  },
  {
    id: "batik-ikat-celup",
    name: "Batik Ikat Celup",
    region: "Sumatra",
    province: "Sumatra Utara",
    image: motifImages.ikatCelup,
    description: "Motif ikat celup dengan teknik pewarnaan tradisional.",
    tags: ["sumatra", "ikat"],
    createdAt: "2025-01-06T09:00:00Z",
  },
  {
    id: "batik-insang",
    name: "Batik Insang",
    region: "Sumatra",
    province: "Riau",
    image: motifImages.insang,
    description: "Motif Batik dengan pola insang ikan, melambangkan kelautan.",
    tags: ["sumatra", "laut"],
    createdAt: "2025-01-07T09:00:00Z",
  },
  {
    id: "batik-kawung",
    name: "Batik Kawung",
    region: "Jawa",
    province: "Jawa Tengah",
    image: motifImages.kawung,
    description: "Motif geometris berbentuk bulatan yang melambangkan kesempurnaan.",
    tags: ["jawa", "geometris"],
    createdAt: "2025-01-08T09:00:00Z",
  },
  {
    id: "batik-lasem",
    name: "Batik Lasem",
    region: "Jawa",
    province: "Jawa Tengah",
    image: motifImages.lasem,
    description: "Motif pesisir Lasem dengan warna merah khas.",
    tags: ["lasem", "pesisir"],
    createdAt: "2025-01-09T09:00:00Z",
  },
  {
    id: "batik-megamendung",
    name: "Batik Megamendung",
    region: "Jawa",
    province: "Jawa Barat",
    image: motifImages.megamendung,
    description: "Motif awan bergelombang khas Cirebon.",
    tags: ["cirebon", "awan"],
    createdAt: "2025-01-10T09:00:00Z",
  },
  {
    id: "batik-pala",
    name: "Batik Pala",
    region: "Maluku",
    province: "Maluku",
    image: motifImages.pala,
    description: "Motif pala sebagai simbol rempah-rempah khas Maluku.",
    tags: ["maluku", "rempah"],
    createdAt: "2025-01-11T09:00:00Z",
  },
  {
    id: "batik-parang",
    name: "Batik Parang",
    region: "Jawa",
    province: "Yogyakarta",
    image: motifImages.parang,
    description: "Motif Parang dengan pola miring berulang, simbol kekuatan.",
    tags: ["jawa", "kekuatan"],
    createdAt: "2025-01-12T09:00:00Z",
  },
  {
    id: "batik-poleng",
    name: "Batik Poleng",
    region: "Bali",
    province: "Bali",
    image: motifImages.poleng,
    description: "Motif kotak hitam-putih khas Bali, simbol keseimbangan hidup.",
    tags: ["bali", "keseimbangan"],
    createdAt: "2025-01-13T09:00:00Z",
  },
  {
    id: "batik-sekar-jagad",
    name: "Batik Sekar Jagad",
    region: "Jawa",
    province: "Jawa Tengah",
    image: motifImages.sekarJagad,
    description: "Motif peta dunia penuh warna, simbol keragaman budaya.",
    tags: ["jawa", "keragaman"],
    createdAt: "2025-01-14T09:00:00Z",
  },
  {
    id: "batik-tambal",
    name: "Batik Tambal",
    region: "Jawa",
    province: "Jawa Tengah",
    image: motifImages.tambal,
    description: "Motif tambal berisi campuran berbagai pola batik.",
    tags: ["jawa", "campuran"],
    createdAt: "2025-01-15T09:00:00Z",
  },
];
