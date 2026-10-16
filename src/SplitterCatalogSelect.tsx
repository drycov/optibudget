import React, { useMemo, useState } from "react";
import { CatalogItem, STARTER_CATALOG } from "./catalog";
import { LineElement } from "./domain";

const CATALOG_KEY = "optibudget.catalog.v1";

function readCatalog(): CatalogItem[] {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as CatalogItem[];
      const byId = new Map(saved.map(item => [item.id, item]));
      return [
        ...STARTER_CATALOG.map(seed => byId.get(seed.id) ?? { ...seed }),
        ...saved.filter(item => !STARTER_CATALOG.some(seed => seed.id === item.id))
      ];
    }
  } catch {
    // Use the built-in catalog if local data is invalid.
  }
  return STARTER_CATALOG.map(item => ({ ...item }));
}

type Props = {
  element: LineElement;
  onChange: (patch: Partial<LineElement>) => void;
};

export default function SplitterCatalogSelect({ element, onChange }: Props) {
  const [catalog] = useState<CatalogItem[]>(readCatalog);
  const options = useMemo(
    () => catalog.filter(item => item.category === (element.kind === "plc" ? "PLC" : "FBT")),
    [catalog, element.kind]
  );

  function selectItem(id: string) {
    if (!id) {
      const defaultLabel = element.kind === "plc" ? "PLC сплиттер 1:N" : "FBT сплиттер";
      onChange({ catalogItemId: undefined, label: defaultLabel });
      return;
    }
    const item = options.find(entry => entry.id === id);
    if (!item) return;
    onChange({
      catalogItemId: item.id,
      label: [item.vendor, item.model].filter(Boolean).join(" ") || (element.kind === "plc" ? "PLC сплиттер" : "FBT сплиттер"),
      ...(item.insertionLossDb !== null && item.insertionLossDb !== undefined
        ? { insertionLossDb: item.insertionLossDb }
        : {})
    });
  }

  return (
    <label className="splitter-catalog-select">
      <span>Модель из каталога</span>
      <select
        aria-label={element.kind === "plc" ? "PLC сплиттер из каталога" : "FBT сплиттер из каталога"}
        value={element.catalogItemId ?? ""}
        onChange={event => selectItem(event.target.value)}
      >
        <option value="">Ручная настройка / не выбрано</option>
        {options.map(item => (
          <option key={item.id} value={item.id}>
            {item.vendor} {item.model || "(модель не указана)"}{item.insertionLossDb == null ? "" : ` · ${item.insertionLossDb} dB`}
          </option>
        ))}
      </select>
    </label>
  );
}
