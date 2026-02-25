"use client";

import { getProcedureLabel } from "@/lib/utils";

const PROCEDURES = [
  "ALL",
  "SALARIE_PAYSIPS",
  "ETUDIANT_RENEWAL",
  "CHANGEMENT_STATUT_ETUDIANT_SALARIE",
  "VIE_FAMILIALE_MARIAGE",
  "ENTREPRENEUR",
  "DUPLICATA_PERDU",
  "RENEWAL_ANY",
];

interface Props {
  selected: string;
  onSelect: (procedure: string) => void;
}

export default function ProcedureFilter({ selected, onSelect }: Props) {
  return (
    <div className="glass rounded-xl p-4 border border-border">
      <h3 className="text-sm font-medium text-muted mb-3">Type de Procédure</h3>
      <div className="flex flex-wrap gap-2">
        {PROCEDURES.map((procedure) => (
          <button
            key={procedure}
            onClick={() => onSelect(procedure)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selected === procedure
                ? "bg-primary text-background"
                : "bg-surface text-muted hover:text-white hover:bg-surface-light"
            }`}
          >
            {procedure === "ALL" ? "Tous" : getProcedureLabel(procedure)}
          </button>
        ))}
      </div>
    </div>
  );
}
