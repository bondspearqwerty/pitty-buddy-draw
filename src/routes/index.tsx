import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Plus,
  Trash2,
  X,
  Layers,
  HelpCircle,
  ListTree,
  Workflow,
  FileText,
  Search,
} from "lucide-react";
import { useDeepCheckStore, uid } from "@/lib/deep-check-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CHECK_STATUSES,
  MODULE_STATES,
  UNDERSTANDING_LEVELS,
  type DeepCheckModule,
  type Field,
  type Process,
  type Question,
  type Section,
} from "@/lib/deep-check-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Deep Check — рабочее пространство модулей" },
      {
        name: "description",
        content:
          "Создавайте модули, открывайте их во вкладках и фиксируйте поля, секции, процессы и открытые вопросы.",
      },
    ],
  }),
  component: DeepCheckApp,
});

/* ───────── App shell ───────── */

function DeepCheckApp() {
  const store = useDeepCheckStore();
  const {
    hydrated,
    modules,
    openTabs,
    activeTab,
    setActiveTab,
    createModule,
    deleteModule,
    openTab,
    closeTab,
    updateModule,
  } = store;

  const [query, setQuery] = useState("");
  const [draftLabel, setDraftLabel] = useState("");

  const activeModule = useMemo(
    () => modules.find((m) => m.id === activeTab) ?? null,
    [modules, activeTab],
  );

  const filtered = useMemo(
    () =>
      modules
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .filter((m) =>
          m.label.toLowerCase().includes(query.trim().toLowerCase()),
        ),
    [modules, query],
  );

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 border-r border-border bg-surface/60 backdrop-blur-sm flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-md bg-primary/15 grid place-items-center ring-1 ring-primary/30">
              <Layers className="size-4 text-primary" />
            </div>
            <div>
              <div className="display text-xl leading-none">Deep Check</div>
              <div className="text-xs text-muted-foreground mt-1">
                Информационные доски модулей
              </div>
            </div>
          </div>
        </div>

        <form
          className="p-4 border-b border-border flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draftLabel.trim()) return;
            createModule(draftLabel);
            setDraftLabel("");
          }}
        >
          <input
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            placeholder="Новый модуль…"
            className="flex-1 h-9 px-3 rounded-md bg-surface-2 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-1 hover:opacity-90"
          >
            <Plus className="size-4" />
          </button>
        </form>

        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск модулей"
            className="flex-1 h-7 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {hydrated && filtered.length === 0 && (
            <div className="px-3 py-6 text-xs text-muted-foreground">
              Модулей пока нет. Создайте первый сверху.
            </div>
          )}
          <ul className="space-y-0.5">
            {filtered.map((m) => {
              const isActive = m.id === activeTab;
              const isOpen = openTabs.includes(m.id);
              return (
                <li key={m.id}>
                  <button
                    onClick={() => openTab(m.id)}
                    className={
                      "group w-full text-left px-3 py-2 rounded-md transition flex items-start gap-2 " +
                      (isActive
                        ? "bg-primary/15 text-foreground"
                        : "hover:bg-surface-2 text-foreground/90")
                    }
                  >
                    <span
                      className={
                        "mt-1.5 size-1.5 rounded-full shrink-0 " +
                        stateDot(m.state)
                      }
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">
                        {m.label}
                      </span>
                      <span className="block text-[11px] text-muted-foreground truncate">
                        {m.state} · {m.fields.length} полей ·{" "}
                        {m.processes.length} процессов
                      </span>
                    </span>
                    {isOpen && (
                      <span className="text-[10px] text-primary/80 mt-1">●</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="p-3 text-[11px] text-muted-foreground border-t border-border">
          Локальное хранилище · ваш браузер
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Breadcrumbs / tabs */}
        <div className="h-12 border-b border-border bg-surface/40 backdrop-blur-sm flex items-center px-4 gap-1 overflow-x-auto">
          <BreadcrumbHome
            onClick={() => setActiveTab(null)}
            active={activeTab === null}
          />
          {openTabs.map((tabId) => {
            const m = modules.find((x) => x.id === tabId);
            if (!m) return null;
            const isActive = activeTab === tabId;
            return (
              <div key={tabId} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="size-3.5 text-muted-foreground" />
                <button
                  onClick={() => setActiveTab(tabId)}
                  className={
                    "group inline-flex items-center gap-2 h-8 pl-3 pr-1 rounded-md text-sm transition " +
                    (isActive
                      ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                      : "text-foreground/80 hover:bg-surface-2")
                  }
                >
                  <span
                    className={
                      "size-1.5 rounded-full " + stateDot(m.state)
                    }
                  />
                  <span className="truncate max-w-[180px]">{m.label}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tabId);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        closeTab(tabId);
                      }
                    }}
                    className="size-5 grid place-items-center rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive-foreground cursor-pointer"
                    aria-label="Закрыть вкладку"
                  >
                    <X className="size-3" />
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!hydrated ? null : activeModule ? (
            <ModuleEditor
              module={activeModule}
              onChange={(patch) => updateModule(activeModule.id, patch)}
              onDelete={() => deleteModule(activeModule.id)}
            />
          ) : (
            <EmptyState
              hasModules={modules.length > 0}
              onCreate={() => {
                const label = window.prompt("Название модуля?");
                if (label && label.trim()) createModule(label);
              }}
              onOpen={(id) => openTab(id)}
              modules={modules}
            />
          )}
        </div>
      </main>
    </div>
  );
}

/* ───────── UI bits ───────── */

function BreadcrumbHome({
  onClick,
  active,
}: {
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-2 h-8 px-3 rounded-md text-sm transition shrink-0 " +
        (active
          ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
          : "text-foreground/80 hover:bg-surface-2")
      }
    >
      <Layers className="size-3.5" />
      <span className="display">Deep Check</span>
    </button>
  );
}

function stateDot(s: string) {
  switch (s) {
    case "Канонично":
      return "bg-[var(--color-accent-emerald)]";
    case "Забагован":
    case "Забагованно":
      return "bg-[var(--color-accent-rose)]";
    case "В разработке":
      return "bg-[var(--color-primary)]";
    case "Устарело":
      return "bg-muted-foreground";
    default:
      return "bg-[var(--color-accent-sky)]";
  }
}

function EmptyState({
  hasModules,
  onCreate,
  onOpen,
  modules,
}: {
  hasModules: boolean;
  onCreate: () => void;
  onOpen: (id: string) => void;
  modules: DeepCheckModule[];
}) {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16">
      <div className="text-xs uppercase tracking-[0.18em] text-primary/80">
        Рабочее пространство
      </div>
      <h1 className="display text-5xl mt-3">
        Глубокая проверка модулей,
        <br />
        поле за полем.
      </h1>
      <p className="text-muted-foreground mt-4 max-w-xl">
        Создавайте информационные доски для каждого модуля, фиксируйте
        состояние, открытые вопросы, секции, поля и процессы. Доски открываются
        как вкладки в хлебных крошках сверху.
      </p>
      <div className="mt-6">
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90"
        >
          <Plus className="size-4" />
          Новый модуль
        </button>
      </div>

      {hasModules && (
        <div className="mt-12">
          <div className="text-sm text-muted-foreground mb-3">
            Последние модули
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modules
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 6)
              .map((m) => (
                <button
                  key={m.id}
                  onClick={() => onOpen(m.id)}
                  className="surface-card p-4 text-left hover:border-primary/40 transition"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={"size-1.5 rounded-full " + stateDot(m.state)}
                    />
                    <span className="font-medium truncate">{m.label}</span>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground line-clamp-2 min-h-8">
                    {m.description || "Описание не задано."}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <Tag>{m.state}</Tag>
                    <Tag>Понимание: {m.understanding}</Tag>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-2 border border-border text-muted-foreground">
      {children}
    </span>
  );
}

/* ───────── Module editor ───────── */

function ModuleEditor({
  module: m,
  onChange,
  onDelete,
}: {
  module: DeepCheckModule;
  onChange: (patch: Partial<DeepCheckModule>) => void;
  onDelete: () => void;
}) {
  const [section, setSection] = useState<
    "overview" | "questions" | "sections" | "fields" | "processes"
  >("overview");

  const navItems = [
    { key: "overview", label: "Обзор", icon: FileText, count: null as number | null },
    { key: "questions", label: "Вопросы", icon: HelpCircle, count: m.questions.length },
    { key: "sections", label: "Секции", icon: ListTree, count: m.sections.length },
    { key: "fields", label: "Поля", icon: Layers, count: m.fields.length },
    { key: "processes", label: "Процессы", icon: Workflow, count: m.processes.length },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="text-xs uppercase tracking-[0.18em] text-primary/80">
            Модуль
          </div>
          <input
            value={m.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="mt-2 display text-4xl bg-transparent w-full outline-none focus:bg-surface-2/40 rounded px-1 -mx-1"
          />
          <div className="mt-4 grid sm:grid-cols-2 gap-3 max-w-2xl">
            <SelectField
              label="Состояние"
              value={m.state}
              options={MODULE_STATES}
              onChange={(v) => onChange({ state: v as DeepCheckModule["state"] })}
              dot={stateDot(m.state)}
            />
            <SelectField
              label="Понимание модуля"
              value={m.understanding}
              options={UNDERSTANDING_LEVELS}
              onChange={(v) =>
                onChange({ understanding: v as DeepCheckModule["understanding"] })
              }
            />
          </div>
        </div>
        <button
          onClick={() => {
            if (window.confirm(`Удалить модуль «${m.label}»?`)) onDelete();
          }}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/15 hover:border-destructive/50"
        >
          <Trash2 className="size-4" />
          Удалить модуль
        </button>
      </div>

      {/* Description */}
      <div className="mt-6">
        <Label>Описание</Label>
        <textarea
          value={m.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Что это за модуль, что он делает, к чему привязан…"
          rows={3}
          className="mt-1 w-full resize-y rounded-md bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Subnav */}
      <div className="mt-8 flex flex-wrap gap-1 border-b border-border">
        {navItems.map((n) => {
          const Icon = n.icon;
          const active = section === n.key;
          return (
            <button
              key={n.key}
              onClick={() => setSection(n.key)}
              className={
                "inline-flex items-center gap-2 px-3 h-10 text-sm border-b-2 -mb-px transition " +
                (active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              <Icon className="size-4" />
              {n.label}
              {n.count !== null && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-2 border border-border">
                  {n.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="py-6">
        {section === "overview" && <OverviewPane module={m} />}
        {section === "questions" && (
          <QuestionsPane
            items={m.questions}
            onChange={(questions) => onChange({ questions })}
          />
        )}
        {section === "sections" && (
          <SectionsPane
            items={m.sections}
            onChange={(sections) => onChange({ sections })}
          />
        )}
        {section === "fields" && (
          <FieldsPane
            items={m.fields}
            sections={m.sections}
            onChange={(fields) => onChange({ fields })}
          />
        )}
        {section === "processes" && (
          <ProcessesPane
            items={m.processes}
            onChange={(processes) => onChange({ processes })}
          />
        )}
      </div>
    </div>
  );
}

function OverviewPane({ module: m }: { module: DeepCheckModule }) {
  const checked = m.fields.filter((f) => f.checkStatus === "Проверено").length;
  const needs = m.fields.filter((f) => f.checkStatus === "Требует Внимания").length;
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Stat label="Вопросов" value={m.questions.length} />
      <Stat label="Секций" value={m.sections.length} />
      <Stat
        label="Полей"
        value={m.fields.length}
        hint={`${checked} проверено · ${needs} требует внимания`}
      />
      <Stat label="Процессов" value={m.processes.length} />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="surface-card p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </div>
      <div className="display text-4xl mt-1">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

/* ───────── Panes ───────── */

function PaneHeader({
  title,
  onAdd,
  addLabel,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="display text-2xl">{title}</h2>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
      >
        <Plus className="size-4" />
        {addLabel}
      </button>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="surface-inset p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function checkStatusDot(s: string) {
  switch (s) {
    case "Проверено":
      return "bg-[var(--color-accent-emerald)]";
    case "Требует Внимания":
      return "bg-[var(--color-accent-rose)]";
    default:
      return "bg-muted-foreground";
  }
}

function CompactTile({
  onClick,
  onRemove,
  children,
}: {
  onClick: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className="w-full text-left surface-card px-3 py-2 hover:border-primary/40 transition"
      >
        {children}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-1 right-1 size-6 grid place-items-center rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive-foreground hover:bg-destructive/20"
        aria-label="Удалить"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

function ItemDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display text-xl">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

function QuestionsPane({
  items,
  onChange,
}: {
  items: Question[];
  onChange: (next: Question[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const add = () => {
    const q = { id: uid(), title: "Новый вопрос", topic: "" };
    onChange([...items, q]);
    setOpenId(q.id);
  };
  const update = (id: string, patch: Partial<Question>) =>
    onChange(items.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  const remove = (id: string) => {
    onChange(items.filter((q) => q.id !== id));
    if (openId === id) setOpenId(null);
  };

  const active = items.find((q) => q.id === openId) ?? null;

  return (
    <div>
      <PaneHeader title="Вопросы" onAdd={add} addLabel="Вопрос" />
      {items.length === 0 ? (
        <Empty>Открытых вопросов нет. Зафиксируйте то, что пока неясно.</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.map((q) => (
            <CompactTile
              key={q.id}
              onClick={() => setOpenId(q.id)}
              onRemove={() => remove(q.id)}
            >
              <div className="flex items-start gap-2">
                <HelpCircle className="size-3.5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {q.title || "—"}
                  </div>
                  {q.topic && (
                    <div className="text-[11px] text-muted-foreground truncate">
                      {q.topic}
                    </div>
                  )}
                </div>
              </div>
            </CompactTile>
          ))}
        </div>
      )}

      <ItemDialog
        open={!!active}
        onOpenChange={(v) => !v && setOpenId(null)}
        title="Вопрос"
      >
        {active && (
          <>
            <div>
              <Label>Заголовок</Label>
              <input
                value={active.title}
                onChange={(e) => update(active.id, { title: e.target.value })}
                className="mt-1 w-full h-9 px-3 rounded-md bg-surface-2 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <Label>Тема</Label>
              <textarea
                value={active.topic}
                onChange={(e) => update(active.id, { topic: e.target.value })}
                placeholder="О чём собираем информацию"
                rows={5}
                className="mt-1 w-full resize-y rounded-md bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => remove(active.id)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/15 hover:border-destructive/50"
              >
                <Trash2 className="size-4" />
                Удалить
              </button>
            </div>
          </>
        )}
      </ItemDialog>
    </div>
  );
}

function SectionsPane({
  items,
  onChange,
}: {
  items: Section[];
  onChange: (next: Section[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const add = () => {
    const s: Section = {
      id: uid(),
      label: "Новая секция",
      description: "",
      understanding: "Среднее",
      status: "В разработке",
    };
    onChange([...items, s]);
    setOpenId(s.id);
  };
  const update = (id: string, patch: Partial<Section>) =>
    onChange(items.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => {
    onChange(items.filter((s) => s.id !== id));
    if (openId === id) setOpenId(null);
  };

  const active = items.find((s) => s.id === openId) ?? null;

  return (
    <div>
      <PaneHeader title="Секции" onAdd={add} addLabel="Секция" />
      {items.length === 0 ? (
        <Empty>Секции группируют поля по смыслу. Например, «Developer».</Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.map((s) => (
            <CompactTile
              key={s.id}
              onClick={() => setOpenId(s.id)}
              onRemove={() => remove(s.id)}
            >
              <div className="flex items-start gap-2">
                <ListTree className="size-3.5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className={"size-1.5 rounded-full " + stateDot(s.status)} />
                    <span className="truncate">{s.status}</span>
                  </div>
                </div>
              </div>
            </CompactTile>
          ))}
        </div>
      )}

      <ItemDialog
        open={!!active}
        onOpenChange={(v) => !v && setOpenId(null)}
        title="Секция"
      >
        {active && (
          <>
            <div>
              <Label>Название</Label>
              <input
                value={active.label}
                onChange={(e) => update(active.id, { label: e.target.value })}
                className="mt-1 w-full h-9 px-3 rounded-md bg-surface-2 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <textarea
                value={active.description}
                onChange={(e) =>
                  update(active.id, { description: e.target.value })
                }
                rows={4}
                className="mt-1 w-full resize-y rounded-md bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <SelectField
                label="Понимание секции"
                value={active.understanding}
                options={UNDERSTANDING_LEVELS}
                onChange={(v) =>
                  update(active.id, {
                    understanding: v as Section["understanding"],
                  })
                }
              />
              <SelectField
                label="Статус"
                value={active.status}
                options={MODULE_STATES}
                onChange={(v) =>
                  update(active.id, { status: v as Section["status"] })
                }
                dot={stateDot(active.status)}
              />
            </div>
            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => remove(active.id)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/15 hover:border-destructive/50"
              >
                <Trash2 className="size-4" />
                Удалить
              </button>
            </div>
          </>
        )}
      </ItemDialog>
    </div>
  );
}

function FieldsPane({
  items,
  sections,
  onChange,
}: {
  items: Field[];
  sections: Section[];
  onChange: (next: Field[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const add = () => {
    const f: Field = {
      id: uid(),
      label: "Новое поле",
      description: "",
      sectionId: sections[0]?.id ?? null,
      processes: [],
      checkStatus: "Не Проверено",
      checkTime: "--",
    };
    onChange([...items, f]);
    setOpenId(f.id);
  };
  const update = (id: string, patch: Partial<Field>) =>
    onChange(items.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => {
    onChange(items.filter((f) => f.id !== id));
    if (openId === id) setOpenId(null);
  };

  const sectionOptions = [
    { id: "", label: "— без секции —" },
    ...sections.map((s) => ({ id: s.id, label: s.label })),
  ];
  const sectionName = (id: string | null) =>
    sections.find((s) => s.id === id)?.label ?? "— без секции —";

  const active = items.find((f) => f.id === openId) ?? null;

  return (
    <div>
      <PaneHeader title="Поля" onAdd={add} addLabel="Поле" />
      {items.length === 0 ? (
        <Empty>
          Поля — самая мелкая единица. Каждое поле можно отметить проверенным.
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.map((f) => (
            <CompactTile
              key={f.id}
              onClick={() => setOpenId(f.id)}
              onRemove={() => remove(f.id)}
            >
              <div className="flex items-start gap-2">
                <span
                  className={
                    "mt-1.5 size-1.5 rounded-full shrink-0 " +
                    checkStatusDot(f.checkStatus)
                  }
                  title={f.checkStatus}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{f.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {sectionName(f.sectionId)}
                    {f.processes.length > 0 && ` · ${f.processes.length} проц.`}
                  </div>
                </div>
              </div>
            </CompactTile>
          ))}
        </div>
      )}

      <ItemDialog
        open={!!active}
        onOpenChange={(v) => !v && setOpenId(null)}
        title="Поле"
      >
        {active && (
          <>
            <div>
              <Label>Лейбл</Label>
              <input
                value={active.label}
                onChange={(e) => update(active.id, { label: e.target.value })}
                className="mt-1 w-full h-9 px-3 rounded-md bg-surface-2 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <textarea
                value={active.description}
                onChange={(e) =>
                  update(active.id, { description: e.target.value })
                }
                rows={4}
                className="mt-1 w-full resize-y rounded-md bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <SelectField
                label="Секция"
                value={
                  sectionOptions.find((o) => o.id === (active.sectionId ?? ""))
                    ?.label ?? "— без секции —"
                }
                options={sectionOptions.map((o) => o.label)}
                onChange={(label) => {
                  const opt = sectionOptions.find((o) => o.label === label);
                  update(active.id, {
                    sectionId: opt && opt.id ? opt.id : null,
                  });
                }}
              />
              <SelectField
                label="Статус проверки"
                value={active.checkStatus}
                options={CHECK_STATUSES}
                onChange={(v) =>
                  update(active.id, {
                    checkStatus: v as Field["checkStatus"],
                    checkTime:
                      v === "Не Проверено"
                        ? "--"
                        : new Date().toLocaleString(),
                  })
                }
              />
              <div>
                <Label>Время проверки</Label>
                <div className="mt-1 h-9 px-3 rounded-md bg-surface-2 border border-border text-sm grid items-center font-mono text-muted-foreground">
                  {active.checkTime}
                </div>
              </div>
            </div>
            <ProcessChips
              value={active.processes}
              onChange={(processes) => update(active.id, { processes })}
            />
            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => remove(active.id)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/15 hover:border-destructive/50"
              >
                <Trash2 className="size-4" />
                Удалить
              </button>
            </div>
          </>
        )}
      </ItemDialog>
    </div>
  );
}

function ProcessChips({
  value,
  onChange,
}: {
  value: { id: string; name: string }[];
  onChange: (next: { id: string; name: string }[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <Label>Процессы, в которых участвует поле</Label>
      <div className="mt-1 flex flex-wrap gap-1.5 items-center">
        {value.map((p) => (
          <span
            key={p.id}
            className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded bg-primary/10 border border-primary/30 text-xs"
          >
            {p.name}
            <button
              onClick={() => onChange(value.filter((x) => x.id !== p.id))}
              className="size-4 grid place-items-center rounded hover:bg-destructive/20"
              aria-label="Убрать"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              onChange([...value, { id: uid(), name: draft.trim() }]);
              setDraft("");
            }
          }}
          placeholder="Добавить процесс + Enter"
          className="flex-1 min-w-[160px] h-7 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}

function ProcessesPane({
  items,
  onChange,
}: {
  items: Process[];
  onChange: (next: Process[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const add = () => {
    const p: Process = {
      id: uid(),
      label: "Новый процесс",
      description: "",
      understanding: "Среднее",
      status: "В разработке",
    };
    onChange([...items, p]);
    setOpenId(p.id);
  };
  const update = (id: string, patch: Partial<Process>) =>
    onChange(items.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const remove = (id: string) => {
    onChange(items.filter((p) => p.id !== id));
    if (openId === id) setOpenId(null);
  };

  const active = items.find((p) => p.id === openId) ?? null;

  return (
    <div>
      <PaneHeader title="Процессы" onAdd={add} addLabel="Процесс" />
      {items.length === 0 ? (
        <Empty>
          Процессы описывают, что происходит в модуле — триггеры, обновления,
          цепочки.
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {items.map((p) => (
            <CompactTile
              key={p.id}
              onClick={() => setOpenId(p.id)}
              onRemove={() => remove(p.id)}
            >
              <div className="flex items-start gap-2">
                <Workflow className="size-3.5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.label}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className={"size-1.5 rounded-full " + stateDot(p.status)} />
                    <span className="truncate">{p.status}</span>
                  </div>
                </div>
              </div>
            </CompactTile>
          ))}
        </div>
      )}

      <ItemDialog
        open={!!active}
        onOpenChange={(v) => !v && setOpenId(null)}
        title="Процесс"
      >
        {active && (
          <>
            <div>
              <Label>Название</Label>
              <input
                value={active.label}
                onChange={(e) => update(active.id, { label: e.target.value })}
                className="mt-1 w-full h-9 px-3 rounded-md bg-surface-2 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <textarea
                value={active.description}
                onChange={(e) =>
                  update(active.id, { description: e.target.value })
                }
                placeholder="Что делает процесс, что триггерит, что обновляет"
                rows={5}
                className="mt-1 w-full resize-y rounded-md bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <SelectField
                label="Понимание"
                value={active.understanding}
                options={UNDERSTANDING_LEVELS}
                onChange={(v) =>
                  update(active.id, {
                    understanding: v as Process["understanding"],
                  })
                }
              />
              <SelectField
                label="Статус"
                value={active.status}
                options={MODULE_STATES}
                onChange={(v) =>
                  update(active.id, { status: v as Process["status"] })
                }
                dot={stateDot(active.status)}
              />
            </div>
            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => remove(active.id)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-sm text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/15 hover:border-destructive/50"
              >
                <Trash2 className="size-4" />
                Удалить
              </button>
            </div>
          </>
        )}
      </ItemDialog>
    </div>
  );
}

/* ───────── form atoms ───────── */

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  dot,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  dot?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 relative">
        {dot && (
          <span
            className={
              "absolute left-3 top-1/2 -translate-y-1/2 size-1.5 rounded-full " +
              dot
            }
          />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={
            "h-9 w-full rounded-md bg-surface-2 border border-border text-sm outline-none focus:ring-2 focus:ring-primary/40 appearance-none pr-8 " +
            (dot ? "pl-7" : "pl-3")
          }
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-surface text-foreground">
              {o}
            </option>
          ))}
        </select>
        <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground rotate-90 pointer-events-none" />
      </div>
    </div>
  );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive-foreground hover:bg-destructive/15"
      aria-label="Удалить"
    >
      <Trash2 className="size-4" />
    </button>
  );
}
