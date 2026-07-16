// Coordonnées et métadonnées des tables, dans le système de coordonnées du plan SVG (viewBox 0 0 1000 600)
const TABLES = {
  "1": { label: "Table des mariés", capacity: 13, shape: "rect", x: 519, y: 428, w: 172, h: 44, note: "" },
  "2": { label: "Amour secret", capacity: 7, shape: "circle", x: 390, y: 392, r: 27, note: "" },
  "3": { label: "Chessy / Gwada", capacity: 7, shape: "circle", x: 328, y: 456, r: 26, note: "" },
  "4": { label: "Copines filles + cousines", capacity: 10, shape: "circle", x: 390, y: 502, r: 30, note: "" },
  "5": { label: "Fleurs", capacity: 8, shape: "circle", x: 452, y: 448, r: 28, note: "" },
  "6": { label: "Couples Inès", capacity: 10, shape: "circle", x: 504, y: 505, r: 30, note: "" },
  "7": { label: "Oncles 77", capacity: 8, shape: "circle", x: 802, y: 501, r: 28, note: "" },
  "8": { label: "Mi", capacity: 9, shape: "circle", x: 748, y: 425, r: 29, note: "" },
  "9": { label: "Maman & co", capacity: 10, shape: "circle", x: 705, y: 501, r: 30, note: "" },
  "10": { label: "Cousins", capacity: 9, shape: "circle", x: 853, y: 425, r: 29, note: "" },
  "11": { label: "93", capacity: 10, shape: "circle", x: 821, y: 77, r: 30, note: "" },
  "12": { label: "Copains R", capacity: 7, shape: "circle", x: 762, y: 117, r: 26, note: "+ 3 prestataires" },
  "13": { label: "Sœurs R", capacity: 9, shape: "circle", x: 699, y: 77, r: 28, note: "" },
  "14": { label: "Oncles E 1", capacity: 10, shape: "circle", x: 638, y: 115, r: 30, note: "" },
  "15": { label: "Oncles E 2", capacity: 8, shape: "circle", x: 569, y: 77, r: 27, note: "" },
  "16": { label: "Basket", capacity: 10, shape: "circle", x: 509, y: 115, r: 30, note: "" },
  "17": { label: "Jeunes chessy", capacity: 9, shape: "circle", x: 440, y: 77, r: 28, note: "" },
  "18": { label: "Ado", capacity: 10, shape: "circle", x: 378, y: 115, r: 30, note: "" },
  "19": { label: "Enfants", capacity: 10, shape: "rect", x: 293, y: 86, w: 138, h: 46, note: "" }
};

// Points d'entrée de la salle (sur le mur de gauche)
const ENTRANCES = [
  { id: "haut", x: 234, y: 254 },
  { id: "bas", x: 234, y: 410 }
];
