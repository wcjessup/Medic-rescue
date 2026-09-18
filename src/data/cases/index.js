import { leoAsthma } from "./leo_asthma.js";
import { belindaVtArrest } from "./belinda_vt_arrest.js";
import { billDissection } from "./bill_dissection.js";

export const CASES = [leoAsthma, belindaVtArrest, billDissection];

export function getCase(id) {
  return CASES.find((c) => c.id === id);
}
