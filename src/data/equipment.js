// Procedures / equipment. Each has an id used by meds.js `requiresProcedure`
// and by case rubrics. `minutes` = simulated time cost.

export const EQUIPMENT = [
  { id: "monitor", name: "Attach Cardiac Monitor (3/5-lead)", minutes: 1, category: "monitoring" },
  { id: "spo2", name: "Attach SpO2 Probe", minutes: 0.5, category: "monitoring" },
  { id: "12lead", name: "Acquire 12-Lead ECG", minutes: 2, category: "monitoring", requires: ["monitor"] },
  {
    id: "iv",
    name: "IV Cannulation",
    minutes: 4,
    category: "access",
    options: {
      site: ["Right hand", "Left hand", "Right forearm", "Left forearm", "Right AC", "Left AC", "External jugular"],
      gauge: ["24G", "22G", "20G", "18G", "16G", "14G"],
    },
  },
  {
    id: "io",
    name: "Intraosseous (IO) Access",
    minutes: 2,
    category: "access",
    options: { site: ["Proximal tibia (L)", "Proximal tibia (R)", "Proximal humerus"] },
  },
  {
    id: "o2",
    name: "Apply Oxygen",
    minutes: 0.5,
    category: "airway",
    options: { device: ["Nasal cannula", "Hudson mask", "Non-rebreather mask", "Bag-valve-mask"], flow: ["2L", "4L", "6L", "8L", "10L", "15L"] },
  },
  { id: "opa", name: "Insert Oropharyngeal Airway", minutes: 1, category: "airway" },
  { id: "npa", name: "Insert Nasopharyngeal Airway", minutes: 1, category: "airway" },
  { id: "sga", name: "Insert Supraglottic Airway (LMA)", minutes: 2, category: "airway" },
  { id: "ett", name: "Endotracheal Intubation", minutes: 3, category: "airway" },
  { id: "neb-mask", name: "Set Up Nebuliser Mask", minutes: 1, category: "airway" },
  { id: "bgl", name: "Blood Glucose Test (BGL)", minutes: 1, category: "assessment" },
  { id: "temp", name: "Temperature Probe", minutes: 0.5, category: "assessment" },
  { id: "cpr", name: "Chest Compressions (2 min cycle)", minutes: 2, category: "resus" },
  {
    id: "defib",
    name: "Defibrillation (Shock)",
    minutes: 0.5,
    category: "resus",
    options: { energy: ["120J", "150J", "200J", "360J"] },
    requires: ["monitor"],
  },
  {
    id: "cardioversion",
    name: "Synchronised Cardioversion",
    minutes: 1,
    category: "resus",
    options: { energy: ["50J", "100J", "150J", "200J"] },
    requires: ["monitor"],
  },
  { id: "pacing", name: "Transcutaneous Pacing", minutes: 1, category: "resus", requires: ["monitor"] },
];

export function getEquipment(id) {
  return EQUIPMENT.find((e) => e.id === id);
}
