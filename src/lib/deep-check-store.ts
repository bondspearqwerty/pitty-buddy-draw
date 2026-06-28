import { useCallback, useEffect, useState } from "react";
import {
  ACTIVE_TAB_KEY,
  OPEN_TABS_KEY,
  STORAGE_KEY,
  type DeepCheckModule,
} from "./deep-check-types";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function useDeepCheckStore() {
  const [modules, setModules] = useState<DeepCheckModule[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = readJSON<DeepCheckModule[]>(STORAGE_KEY, []);
    setModules(
      raw.map((m) => ({
        ...m,
        subforms: m.subforms ?? [],
        sections: (m.sections ?? []).map((s) => ({ ...s, layout: s.layout ?? [] })),
        fields: (m.fields ?? []).map((f) => ({ ...f, subformId: f.subformId ?? null })),
      })),
    );

    setOpenTabs(readJSON<string[]>(OPEN_TABS_KEY, []));
    setActiveTab(readJSON<string | null>(ACTIVE_TAB_KEY, null));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) writeJSON(STORAGE_KEY, modules);
  }, [modules, hydrated]);
  useEffect(() => {
    if (hydrated) writeJSON(OPEN_TABS_KEY, openTabs);
  }, [openTabs, hydrated]);
  useEffect(() => {
    if (hydrated) writeJSON(ACTIVE_TAB_KEY, activeTab);
  }, [activeTab, hydrated]);

  const createModule = useCallback((label: string) => {
    const m: DeepCheckModule = {
      id: uid(),
      label: label.trim() || "Новый модуль",
      description: "",
      state: "В разработке",
      understanding: "Среднее",
      questions: [],
      sections: [],
      subforms: [],
      fields: [],
      processes: [],
      createdAt: Date.now(),
    };
    setModules((prev) => [...prev, m]);
    setOpenTabs((prev) => (prev.includes(m.id) ? prev : [...prev, m.id]));
    setActiveTab(m.id);
    return m;
  }, []);

  const deleteModule = useCallback((id: string) => {
    setModules((prev) => prev.filter((m) => m.id !== id));
    setOpenTabs((prev) => prev.filter((t) => t !== id));
    setActiveTab((cur) => (cur === id ? null : cur));
  }, []);

  const updateModule = useCallback(
    (id: string, patch: Partial<DeepCheckModule>) => {
      setModules((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
    },
    [],
  );

  const openTab = useCallback((id: string) => {
    setOpenTabs((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveTab(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t !== id);
      setActiveTab((cur) => {
        if (cur !== id) return cur;
        const idx = prev.indexOf(id);
        return next[idx] ?? next[idx - 1] ?? next[0] ?? null;
      });
      return next;
    });
  }, []);

  return {
    hydrated,
    modules,
    openTabs,
    activeTab,
    setActiveTab,
    createModule,
    deleteModule,
    updateModule,
    openTab,
    closeTab,
    uid,
  };
}

export { uid };
