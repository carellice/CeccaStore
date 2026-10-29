import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Command,
  Compass,
  Download,
  ExternalLink,
  Gamepad2,
  Github,
  Globe,
  Grid2X2,
  Heart,
  Layers3,
  LayoutGrid,
  List,
  LockKeyhole,
  MapPin,
  Monitor,
  Moon,
  PackageOpen,
  Search,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Sun,
  Terminal,
  Volume2,
  Wallet,
  X,
} from "lucide-react";
import catalog from "./data/catalog.json";
import catalogPolicy from "./data/catalog-policy.json";
import PrivateAccess from "./PrivateAccess";
import { assetUrl } from "./asset-url";

const categoryIcons = {
  Giochi: Gamepad2,
  Media: AudioLines,
  Strumenti: Layers3,
  Produttività: LayoutGrid,
  Benessere: Heart,
  Finanza: Wallet,
  Viaggi: Compass,
  Sviluppo: Code2,
  Web: Globe,
};
const palettes = [
  ["#f1eafb", "#77639a"],
  ["#e7efdf", "#526b39"],
  ["#f8e8dd", "#af6f44"],
  ["#e1edf2", "#456c82"],
  ["#f3e5e8", "#a05670"],
  ["#e8e9f5", "#666caa"],
];
const featuredOrder = [
  "Mappinando",
  "chiarella",
  "money",
  "IPTVISION",
  "piccole-gioie",
  "brieffo",
  "Topperia",
  "MonitorSwitch",
  "Castino",
  "arcade-classici",
  "MemShot",
  "easy-crypt",
];
const baseApps = catalog.map((app, i) => ({
  ...app,
  palette: palettes[i % palettes.length],
}));
const allowedFavoriteRepos = new Set([
  ...catalog.map((app) => app.repo),
  ...catalogPolicy.protectedRepos,
]);
const categories = [
  "Tutte",
  "Produttività",
  "Media",
  "Giochi",
  "Strumenti",
  "Benessere",
  "Finanza",
  "Viaggi",
  "Sviluppo",
  "Web",
];
function safeRead(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function AppIcon({ app, size = "", className = "" }) {
  const [broken, setBroken] = useState(false);
  const Icon = categoryIcons[app.category] || Code2;
  return (
    <div
      className={`app-icon ${size} ${className}`}
      style={{
        "--icon-bg": app.palette?.[0] || "#e8ecde",
        "--icon-fg": app.palette?.[1] || "#476440",
      }}
    >
      {app.icon && !broken ? (
        <img
          src={assetUrl(app.icon)}
          alt=""
          decoding="async"
          onError={() => setBroken(true)}
          loading="lazy"
        />
      ) : (
        <Icon strokeWidth={1.5} />
      )}
    </div>
  );
}
function Platform({ name }) {
  const Icon = /Android|iOS/.test(name)
    ? Smartphone
    : /Web|Browser/.test(name)
      ? Globe
      : /macOS|Windows|Linux/.test(name)
        ? Monitor
        : Terminal;
  return (
    <span className="platform">
      <Icon size={12} />
      {name}
    </span>
  );
}
function Brand({ small = false }) {
  return (
    <span className={`brand ${small ? "small" : ""}`}>
      <span className="brand-symbol">
        <span />
      </span>
      {!small && (
        <span>
          cecca<span className="brand-light">store</span>
          <span className="brand-period">.</span>
        </span>
      )}
    </span>
  );
}
function AppCard({ app, onOpen, favorite, onFavorite, index, list, ref }) {
  return (
    <motion.article
      ref={ref}
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.025, 0.2) }}
      className={`app-card ${list ? "list-card" : ""}`}
    >
      <button
        className={`favorite-button ${favorite ? "is-favorite" : ""}`}
        onClick={() => onFavorite(app.repo)}
        aria-pressed={favorite}
        aria-label={`${favorite ? "Rimuovi" : "Aggiungi"} ${app.title} ${favorite ? "dai" : "ai"} preferiti`}
      >
        <Bookmark size={17} fill={favorite ? "currentColor" : "none"} />
      </button>
      <button className="app-card-main" onClick={() => onOpen(app)}>
        <div className="card-top">
          <AppIcon app={app} />
          <span className="card-category">{app.category}</span>
        </div>
        <div className="card-copy">
          <h3>{app.title}</h3>
          <p>{app.description}</p>
        </div>
        <div className="card-bottom">
          <span className="card-platforms">
            {app.platforms?.slice(0, 2).map((p) => (
              <Platform key={p} name={p} />
            ))}
          </span>
          <span className="card-arrow">
            <ArrowUpRight size={17} />
          </span>
        </div>
      </button>
      <div className="card-status">
        {app.downloads?.length ? (
          <>
            <span className="status-dot" />
            Disponibile
            {app.isPrivate && app.downloads.every((d) => d.private)
              ? " · accesso GitHub"
              : ""}
          </>
        ) : app.demo ? (
          <>
            <Globe size={11} />
            Prova nel browser
          </>
        ) : (
          <>
            <span className="status-dot muted" />
            {app.kind === "support"
              ? "Libreria e risorse"
              : "Esplora il progetto"}
          </>
        )}
        {app.isPrivate && (
          <LockKeyhole size={11} aria-label="Sorgente privato" />
        )}
      </div>
    </motion.article>
  );
}
function FeatureArtwork({ type }) {
  if (type === "map")
    return (
      <div className="map-art" aria-hidden="true">
        <div className="map-grid" />
        <svg className="map-roads" viewBox="0 0 360 340">
          <path d="M-20 185 Q75 95 145 150 T390 90 M70-20 Q115 90 85 160 T160 370 M-20 290 Q180 180 390 260" />
          <path className="map-river" d="M220-30 Q145 65 238 150 T235 370" />
        </svg>
        <div className="map-park park-one" />
        <div className="map-park park-two" />
        <div className="map-route">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="map-marker marker-one">
          <MapPin fill="currentColor" size={38} />
          <span>Il tuo posto del cuore</span>
        </div>
        <div className="map-marker marker-two">
          <Heart fill="currentColor" size={19} />
        </div>
        <div className="map-marker marker-three">
          <MapPin fill="currentColor" size={27} />
        </div>
        <div className="map-coordinate">41°54′ N · 12°29′ E</div>
        <div className="map-mini-label">
          <span className="status-dot" />
          Un mondo di posti da ricordare
        </div>
      </div>
    );
  if (type === "sound")
    return (
      <div className="sound-art" aria-hidden="true">
        <div className="sound-orbit o1" />
        <div className="sound-orbit o2" />
        <div className="sound-orbit o3" />
        <div className="sound-core">
          <AudioLines size={54} strokeWidth={1.2} />
        </div>
        <div className="sound-chip">
          <Volume2 size={15} />
          Un momento per te
        </div>
      </div>
    );
  return (
    <div className="tv-art" aria-hidden="true">
      <div className="tv-screen">
        <span className="tv-play">▶</span>
        <div className="tv-lines">
          <i />
          <i />
          <i />
        </div>
      </div>
      <div className="tv-stand" />
      <span className="tv-chip">Il tuo cinema, ovunque.</span>
    </div>
  );
}
function Feature({ onOpen }) {
  const [slide, setSlide] = useState(0);
  const names = ["Mappinando", "chiarella", "IPTVISION"];
  const app = baseApps.find((a) => a.repo === names[slide]) || baseApps[0];
  const money = baseApps.find((a) => a.repo === "money");
  const details = [
    {
      eyebrow: "PER CHI HA SEMPRE UN POSTO IN MENTE",
      title: (
        <>
          I tuoi posti.
          <br />
          Le tue prossime storie.
        </>
      ),
      text: "Un piccolo atlante personale, pieno di possibilità.",
      type: "map",
    },
    {
      eyebrow: "ABBASSA IL VOLUME DEL MONDO",
      title: (
        <>
          Trova il tuo
          <br />
          angolo di calma.
        </>
      ),
      text: "Suoni da mescolare. Pensieri da lasciare andare.",
      type: "sound",
    },
    {
      eyebrow: "IL TUO INTRATTENIMENTO, A CASA",
      title: (
        <>
          Una finestra sul
          <br />
          tuo mondo in streaming.
        </>
      ),
      text: "TV, film e serie. In un unico spazio.",
      type: "tv",
    },
  ][slide];
  if (!app) return null;
  return (
    <section className="showcase" aria-label="Progetti in evidenza">
      <div className={`feature-banner feature-${details.type}`}>
        <AnimatePresence mode="wait">
          <motion.div
            className="feature-inner"
            key={slide}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3 }}
          >
            <div className="feature-copy">
              <span className="eyebrow">{details.eyebrow}</span>
              <h2>{details.title}</h2>
              <p>{details.text}</p>
              <button className="feature-cta" onClick={() => onOpen(app)}>
                Scopri {app.title}
                <ArrowUpRight size={16} />
              </button>
            </div>
            <FeatureArtwork type={details.type} />
          </motion.div>
        </AnimatePresence>
        <div className="feature-footer">
          <span>
            <Sparkles size={13} />
            SCELTO DAL LABORATORIO
          </span>
          <div className="slide-controls">
            <div className="slide-dots">
              {names.map((n, i) => (
                <button
                  key={n}
                  aria-label={`Mostra ${n}`}
                  aria-pressed={i === slide}
                  onClick={() => setSlide(i)}
                  className={i === slide ? "active" : ""}
                />
              ))}
            </div>
            <button
              aria-label="Prossimo progetto in evidenza"
              onClick={() => setSlide((slide + 1) % 3)}
            >
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
      <button className="side-feature" onClick={() => money && onOpen(money)}>
        <span className="eyebrow">MENO PENSIERI, PIÙ CONTROLLO</span>
        <div className="money-art" aria-hidden="true">
          <div className="money-card back" />
          <div className="money-card front">
            <Wallet size={22} />
            <span>
              Ogni spesa,
              <br />
              al suo posto.
            </span>
            <div className="money-chart">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="money-coin">€</div>
          <div className="money-coin small">+</div>
        </div>
        <div className="side-feature-bottom">
          <div>
            <span className="side-feature-kicker">
              FAI SPAZIO ALLE COSE IMPORTANTI
            </span>
            <h3>Piacere, Money.</h3>
            <p>Il tuo denaro, un po’ più chiaro.</p>
          </div>
          <span className="round-arrow">
            <ArrowUpRight size={20} />
          </span>
        </div>
      </button>
    </section>
  );
}
function Details({ app, onClose, favorite, onFavorite, onToast, toast }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prior;
    };
  }, []);
  const sizeLabel = (size) =>
    size > 1024 * 1024
      ? `${(size / 1024 / 1024).toFixed(1)} MB`
      : size
        ? `${Math.ceil(size / 1024)} KB`
        : "";
  return (
    <dialog
      ref={ref}
      className="detail-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby="detail-title"
    >
      <div className="detail-content">
        <div className="detail-cover" style={{ background: app.palette[0] }}>
          <span className="detail-cover-label">
            CECCASTORE / {app.category.toUpperCase()}
          </span>
          <div className="detail-cover-decoration" />
          <button
            className="close-dialog"
            onClick={onClose}
            aria-label="Chiudi dettagli"
          >
            <X size={21} />
          </button>
          <AppIcon app={app} size="large" />
        </div>
        <div className="detail-body">
          <div className="detail-heading">
            <div>
              <div className="detail-category">
                {app.category}
                {app.ageRating && (
                  <span className="age-rating">{app.ageRating}</span>
                )}
                {app.isPrivate && (
                  <span>
                    <LockKeyhole size={12} />
                    Sorgente privato
                  </span>
                )}
              </div>
              <h2 id="detail-title">{app.title}</h2>
              <p>
                di Flavio Ceccarelli <span>·</span> @
                {catalog.length ? "carellice" : ""}
              </p>
            </div>
            <button
              aria-pressed={favorite}
              className={`detail-save ${favorite ? "saved" : ""}`}
              onClick={() => onFavorite(app.repo)}
              aria-label={
                favorite ? "Rimuovi dai preferiti" : "Salva nei preferiti"
              }
            >
              <Bookmark size={21} fill={favorite ? "currentColor" : "none"} />
            </button>
          </div>
          <p className="detail-description">{app.description}</p>
          <div className="detail-meta">
            <div>
              <span>PIATTAFORMA</span>
              <strong>
                {app.platforms.join(" · ") || "Progetto software"}
              </strong>
            </div>
            <div>
              <span>REALIZZATO CON</span>
              <strong>{app.language || "Risorse digitali"}</strong>
            </div>
            <div>
              <span>{app.version ? "VERSIONE" : "ULTIMO AGGIORNAMENTO"}</span>
              <strong>
                {app.version ||
                  new Intl.DateTimeFormat("it-IT", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(app.updatedAt))}
              </strong>
            </div>
          </div>
          {app.features?.length > 0 && (
            <div className="detail-section">
              <h3>Dentro il progetto</h3>
              <ul className="feature-list">
                {app.features.map((f) => (
                  <li key={f}>
                    <Check size={15} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {app.screenshots?.length > 0 && (
            <div className="detail-section">
              <h3>Uno sguardo da vicino</h3>
              <div className="screenshots">
                {app.screenshots.map((s, i) => (
                  <a
                    key={s}
                    href={assetUrl(s)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={assetUrl(s)}
                      alt={`${app.title}: schermata ${i + 1}`}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.closest("a").style.display = "none";
                      }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="detail-section">
            <h3>
              {app.downloads?.length ? "Portalo con te" : "Esplora il progetto"}
            </h3>
            {app.downloads?.length > 0 ? (
              <div className="download-list">
                {app.downloads.map((d, i) => (
                  <a
                    href={d.url}
                    key={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`download-link ${i === 0 ? "primary-download" : ""}`}
                  >
                    <span className="download-icon">
                      <Download size={20} />
                    </span>
                    <span>
                      <strong>{d.label || d.name}</strong>
                      <small>
                        {d.private
                          ? "Richiede accesso al repository GitHub"
                          : sizeLabel(d.size) ||
                            "Download dalla release ufficiale"}
                      </small>
                    </span>
                    <ArrowUpRight size={17} />
                  </a>
                ))}
              </div>
            ) : (
              <p className="no-download">
                {app.isPrivate
                  ? "Questo progetto è privato e non ha un download pubblico. Puoi consultarne il repository con un account autorizzato."
                  : "Questo progetto non ha un pacchetto da installare. Scopri il codice e le istruzioni su GitHub."}
              </p>
            )}
            {app.installNotes && (
              <p className="install-notes">{app.installNotes}</p>
            )}
            <div className="detail-links">
              {app.demo && (
                <a href={app.demo} target="_blank" rel="noreferrer">
                  <Globe size={16} />
                  Apri nel browser
                  <ArrowUpRight size={14} />
                </a>
              )}
              <a href={app.url} target="_blank" rel="noreferrer">
                <Github size={16} />
                {app.isPrivate ? "Repository privato" : "Codice su GitHub"}
                <ArrowUpRight size={14} />
              </a>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${location.origin}${location.pathname}#app=${encodeURIComponent(app.repo)}`,
                    );
                    onToast("Link al progetto copiato");
                  } catch {
                    onToast("Copia il link dalla barra degli indirizzi");
                  }
                }}
              >
                <ExternalLink size={15} />
                Copia link
              </button>
            </div>
          </div>
          {toast && (
            <div role="status" className="dialog-toast">
              <Check size={15} />
              {toast}
            </div>
          )}
          <div className="detail-source">
            <span className="status-dot" />
            Informazioni verificate su GitHub · 29 ottobre 2026
          </div>
        </div>
      </div>
    </dialog>
  );
}
export default function App() {
  const [privateApps, setPrivateApps] = useState([]);
  const [pinOpen, setPinOpen] = useState(false);
  const allApps = useMemo(() => [...baseApps, ...privateApps], [privateApps]);
  const [view, setView] = useState("discover");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tutte");
  const [platform, setPlatform] = useState("Tutte");
  const [visibility, setVisibility] = useState("all");
  const [sort, setSort] = useState("featured");
  const [favorites, setFavorites] = useState(() => {
    const stored = safeRead("ceccastore-favorites", []);
    return Array.isArray(stored)
      ? stored.filter((repo) => allowedFavoriteRepos.has(repo))
      : [];
  });
  const [theme, setTheme] = useState(() =>
    safeRead("ceccastore-theme", "light"),
  );
  const [selected, setSelected] = useState(null);
  const [limit, setLimit] = useState(12);
  const [layout, setLayout] = useState("grid");
  const [filters, setFilters] = useState(false);
  const [toast, setToast] = useState("");
  const searchRef = useRef(null),
    catalogRef = useRef(null),
    loadMoreRef = useRef(null);
  const reduced = useReducedMotion();
  const visibleFavoriteCount = favorites.filter((repo) =>
    allApps.some((app) => app.repo === repo),
  ).length;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    save("ceccastore-theme", theme);
  }, [theme]);
  useEffect(() => {
    save("ceccastore-favorites", favorites);
  }, [favorites]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2800);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    function key(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    function hash() {
      const repo = new URLSearchParams(location.hash.slice(1)).get("app");
      const app = allApps.find((a) => a.repo === repo);
      setSelected(app || null);
      if (!app && catalogPolicy.protectedRepos.includes(repo)) setPinOpen(true);
    }
    hash();
    window.addEventListener("hashchange", hash);
    return () => window.removeEventListener("hashchange", hash);
  }, [allApps]);
  useEffect(
    () => setLimit(12),
    [view, query, category, platform, visibility, sort],
  );
  const toggleFavorite = (repo) =>
    setFavorites((f) =>
      f.includes(repo) ? f.filter((x) => x !== repo) : [...f, repo],
    );
  const openApp = (app) => {
    setSelected(app);
    history.replaceState(null, "", `#app=${encodeURIComponent(app.repo)}`);
  };
  const closeApp = () => {
    setSelected(null);
    history.replaceState(null, "", location.pathname + location.search);
  };
  const closePrivateAccess = () => {
    setPinOpen(false);
    if (
      catalogPolicy.protectedRepos.includes(
        new URLSearchParams(location.hash.slice(1)).get("app"),
      )
    ) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  };
  const unlockPrivateAccess = (projects) => {
    const apps = projects.map((app, index) => ({
      ...app,
      palette: palettes[(baseApps.length + index) % palettes.length],
    }));
    setPrivateApps(apps);
    setPinOpen(false);
    const requestedRepo = new URLSearchParams(location.hash.slice(1)).get(
      "app",
    );
    openApp(apps.find((app) => app.repo === requestedRepo) || apps[0]);
  };
  const togglePrivateAccess = () => {
    if (!privateApps.length) {
      setPinOpen(true);
      return;
    }
    if (selected && catalogPolicy.protectedRepos.includes(selected.repo))
      closeApp();
    setPrivateApps([]);
    setToast("Area riservata bloccata");
  };
  const navigate = (next, p = "Tutte") => {
    setView(next);
    setPlatform(p);
    setCategory("Tutte");
    setQuery("");
    setVisibility("all");
    if (next !== "discover")
      setTimeout(
        () =>
          catalogRef.current?.scrollIntoView({
            behavior: reduced ? "instant" : "smooth",
            block: "start",
          }),
        50,
      );
    else window.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" });
  };
  const visible = useMemo(() => {
    let items = allApps.filter(
      (a) =>
        (view !== "favorites" || favorites.includes(a.repo)) &&
        (view !== "downloads" || a.downloads?.length) &&
        (category === "Tutte" || a.category === category) &&
        (platform === "Tutte" ||
          a.platforms.some((p) =>
            p.toLowerCase().includes(platform.toLowerCase()),
          )) &&
        (visibility === "all" ||
          (visibility === "private" ? a.isPrivate : !a.isPrivate)),
    );
    const words = query.toLocaleLowerCase("it").trim().split(/\s+/);
    if (query.trim())
      items = items.filter((a) =>
        words.every((w) =>
          [
            a.title,
            a.repo,
            a.description,
            a.category,
            a.language,
            ...a.platforms,
            ...(a.features || []),
          ]
            .join(" ")
            .toLocaleLowerCase("it")
            .includes(w),
        ),
      );
    return items.sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title, "it")
        : sort === "updated"
          ? new Date(b.updatedAt) - new Date(a.updatedAt)
          : (featuredOrder.indexOf(a.repo) < 0
              ? 999
              : featuredOrder.indexOf(a.repo)) -
              (featuredOrder.indexOf(b.repo) < 0
                ? 999
                : featuredOrder.indexOf(b.repo)) ||
            a.title.localeCompare(b.title, "it"),
    );
  }, [view, query, category, platform, visibility, sort, favorites, allApps]);
  useEffect(() => {
    if (selected || pinOpen || limit >= visible.length) return;
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    if (!("IntersectionObserver" in window)) {
      setLimit(visible.length);
      return;
    }
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled || !entries.some((entry) => entry.isIntersecting)) return;
        cancelled = true;
        observer.disconnect();
        setLimit((current) => Math.min(current + 12, visible.length));
      },
      { rootMargin: "220px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [limit, visible, selected, pinOpen]);
  const downloading = allApps.filter((a) => a.downloads?.length).length;
  const isDiscover =
    view === "discover" &&
    !query &&
    category === "Tutte" &&
    platform === "Tutte" &&
    visibility === "all";
  const clear = () => {
    setQuery("");
    setCategory("Tutte");
    setPlatform("Tutte");
    setVisibility("all");
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#"
          className="brand-link"
          onClick={(e) => {
            e.preventDefault();
            navigate("discover");
          }}
          aria-label="CeccaStore, pagina iniziale"
        >
          <Brand />
        </a>
        <div className="sidebar-label">IL TUO PROSSIMO CLICK</div>
        <nav className="main-nav" aria-label="Navigazione principale">
          {[
            { id: "discover", label: "Scopri", icon: Compass },
            { id: "all", label: "Tutti i progetti", icon: Grid2X2 },
            { id: "downloads", label: "Da scaricare", icon: ArrowDownToLine },
            { id: "favorites", label: "Preferiti", icon: Bookmark },
          ].map((n) => (
            <button
              key={n.id}
              aria-current={
                view === n.id && platform === "Tutte" ? "page" : undefined
              }
              className={view === n.id && platform === "Tutte" ? "active" : ""}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={18} />
              <span>{n.label}</span>
              {n.id === "favorites" && visibleFavoriteCount > 0 && (
                <span className="nav-count">{visibleFavoriteCount}</span>
              )}
              {n.id === "all" && (
                <span className="nav-count">{allApps.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-label">UN MONDO DA ESPLORARE</div>
        <nav className="platform-nav" aria-label="Piattaforme">
          {[
            { label: "Android", icon: Smartphone },
            { label: "Windows", icon: Monitor },
            { label: "macOS", icon: Command },
            { label: "Web", icon: Globe },
          ].map((p) => (
            <button
              key={p.label}
              className={platform === p.label ? "active" : ""}
              onClick={() => navigate("all", p.label)}
            >
              <p.icon size={17} />
              {p.label}
              <ChevronRight size={13} />
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="note-sparkle">✳</div>
          <span>
            Una buona idea
            <br />
            merita di essere aperta.
          </span>
          <p>
            Progetti indipendenti,
            <br />
            curiosità senza limiti.
          </p>
        </div>
        <div className="sidebar-bottom">
          <a
            className="creator-link"
            href="https://flavioceccarelli.org"
            target="_blank"
            rel="noreferrer"
          >
            <span className="avatar">
              fc
              <span />
            </span>
            <span>
              <strong>Flavio Ceccarelli</strong>
              <small>Il creatore, dietro le app</small>
            </span>
            <ArrowUpRight size={15} />
          </a>
          <div className="sidebar-footer">
            <a
              href="https://github.com/carellice"
              target="_blank"
              rel="noreferrer"
            >
              <Github size={15} />
              <span>GitHub</span>
              <ArrowUpRight size={12} />
            </a>
            <button
              aria-label={`Attiva tema ${theme === "light" ? "scuro" : "chiaro"}`}
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <div className="breadcrumb">
            La collezione <span>/</span>{" "}
            <strong>
              {view === "favorites"
                ? "Preferiti"
                : view === "downloads"
                  ? "Da scaricare"
                  : view === "all"
                    ? "Tutti i progetti"
                    : "Scopri"}
            </strong>
          </div>
          <div className="search-box">
            <Search size={18} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Un’app, un’idea, qualcosa di utile…"
              aria-label="Cerca nei progetti"
            />
            <kbd>Ctrl K</kbd>
          </div>
          <button
            className={`private-access-button ${privateApps.length ? "is-unlocked" : ""}`}
            aria-label={
              privateApps.length
                ? "Blocca area riservata"
                : "Sblocca area riservata"
            }
            title={
              privateApps.length ? "Blocca area riservata" : "Area riservata"
            }
            onClick={togglePrivateAccess}
          >
            <LockKeyhole size={17} />
            <span>{privateApps.length ? "Blocca area" : "Area riservata"}</span>
          </button>
          <button
            className="mobile-theme"
            aria-label={`Attiva tema ${theme === "light" ? "scuro" : "chiaro"}`}
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
          <a
            className="topbar-github"
            href="https://github.com/carellice"
            target="_blank"
            rel="noreferrer"
            aria-label="Profilo GitHub di Flavio Ceccarelli"
          >
            <Github size={19} />
          </a>
        </header>
        <main>
          <AnimatePresence mode="wait">
            {isDiscover && (
              <motion.div
                key="discovery"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <section className="intro">
                  <div>
                    <span className="intro-kicker">
                      <span className="status-dot" />
                      IL LABORATORIO DI FLAVIO CECCARELLI
                    </span>
                    <h1>
                      Idee da aprire<span>.</span>
                    </h1>
                  </div>
                  <p>
                    App, giochi e piccoli esperimenti.
                    <br /> Tutto quello che creo, in un solo posto.
                  </p>
                </section>
                <Feature onOpen={openApp} />
                <div className="collection-note">
                  <span>
                    <span className="mini-symbol">✳</span> Fatte per risolvere.
                    Create per curiosità.
                  </span>
                  <span>
                    {allApps.length} progetti <i /> {downloading} da scaricare{" "}
                    <i /> Infinite possibilità
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <section className="catalog-section" ref={catalogRef}>
            <div className="section-heading">
              <div>
                <span className="section-eyebrow">
                  {view === "favorites"
                    ? "LA TUA PICCOLA COLLEZIONE"
                    : view === "downloads"
                      ? "PRONTI PER IL PROSSIMO PASSO"
                      : "ESPLORA LA COLLEZIONE"}
                </span>
                <h2>
                  {query
                    ? `Risultati per “${query}”`
                    : view === "favorites"
                      ? "Le tue app del cuore."
                      : view === "downloads"
                        ? "Scegli. Scarica. Apri."
                        : platform !== "Tutte"
                          ? `Un mondo di app per ${platform}.`
                          : isDiscover
                            ? "Trova il tuo prossimo indispensabile."
                            : "Tutti i progetti, una sola casa."}
                </h2>
              </div>
              <span className="results-count">
                {visible.length}{" "}
                {visible.length === 1 ? "progetto" : "progetti"}
              </span>
            </div>
            <div className="catalog-toolbar">
              <div className="category-tabs" aria-label="Categorie">
                {categories
                  .filter(
                    (c) =>
                      c === "Tutte" || allApps.some((a) => a.category === c),
                  )
                  .map((c) => (
                    <button
                      key={c}
                      aria-pressed={category === c}
                      className={category === c ? "active" : ""}
                      onClick={() => setCategory(c)}
                    >
                      {c === "Tutte" && <Grid2X2 size={14} />}
                      <span>{c}</span>
                    </button>
                  ))}
              </div>
              <button
                className={`filter-button ${filters || visibility !== "all" || platform !== "Tutte" ? "active" : ""}`}
                onClick={() => setFilters(!filters)}
                aria-expanded={filters}
                aria-label="Mostra filtri"
              >
                <SlidersHorizontal size={17} />
              </button>
            </div>
            <AnimatePresence>
              {filters && (
                <motion.div
                  className="filter-panel"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label>
                    Piattaforma
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                    >
                      {[
                        "Tutte",
                        "Android",
                        "Windows",
                        "macOS",
                        "Web",
                        "Linux",
                      ].map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Visibilità
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                    >
                      <option value="all">Tutti i repository</option>
                      <option value="public">Solo pubblici</option>
                      <option value="private">Solo privati</option>
                    </select>
                  </label>
                  <label>
                    Ordina per
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="featured">Scelti dal laboratorio</option>
                      <option value="updated">Ultimo aggiornamento</option>
                      <option value="name">Nome A–Z</option>
                    </select>
                  </label>
                  <div className="layout-switch">
                    <button
                      aria-label="Vista griglia"
                      aria-pressed={layout === "grid"}
                      onClick={() => setLayout("grid")}
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button
                      aria-label="Vista elenco"
                      aria-pressed={layout === "list"}
                      onClick={() => setLayout("list")}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {(query ||
              category !== "Tutte" ||
              platform !== "Tutte" ||
              visibility !== "all") && (
              <div className="active-filters">
                <span>
                  {[
                    category !== "Tutte" ? category : null,
                    platform !== "Tutte" ? platform : null,
                    visibility === "private"
                      ? "Privati"
                      : visibility === "public"
                        ? "Pubblici"
                        : null,
                  ]
                    .filter(Boolean)
                    .join(" / ") || "Ricerca nella collezione"}
                </span>
                <button onClick={clear}>
                  Azzera filtri
                  <X size={12} />
                </button>
              </div>
            )}
            <motion.div
              layout
              className={`app-grid ${layout === "list" ? "list-view" : ""}`}
            >
              <AnimatePresence mode="popLayout">
                {visible.slice(0, limit).map((a, i) => (
                  <AppCard
                    key={a.repo}
                    app={a}
                    index={i}
                    onOpen={openApp}
                    favorite={favorites.includes(a.repo)}
                    onFavorite={toggleFavorite}
                    list={layout === "list"}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
            {visible.length === 0 && (
              <div className="empty-state">
                <PackageOpen size={42} strokeWidth={1} />
                <h3>
                  {view === "favorites" && !query
                    ? "La tua collezione inizia da qui."
                    : "Nessun progetto da queste parti."}
                </h3>
                <p>
                  {view === "favorites" && !query
                    ? "Tocca il segnalibro sulle app che ti piacciono: le ritroverai tutte qui."
                    : "Prova con un altro nome, una piattaforma o una categoria."}
                </p>
                <button
                  onClick={() =>
                    view === "favorites" ? navigate("all") : clear()
                  }
                >
                  {view === "favorites"
                    ? "Esplora i progetti"
                    : "Azzera la ricerca"}
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
            {visible.length > 0 && (
              <div
                className="load-more"
                ref={loadMoreRef}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <span>
                  {visible.length > limit ? (
                    <ArrowDown size={14} aria-hidden="true" />
                  ) : (
                    <Check size={14} aria-hidden="true" />
                  )}
                  {Math.min(limit, visible.length)} di {visible.length}{" "}
                  {visible.length === 1 ? "progetto" : "progetti"}
                </span>
                <small>
                  {visible.length > limit
                    ? "Continua a scorrere, al resto pensiamo noi."
                    : "Hai visto tutti i progetti della lista."}
                </small>
              </div>
            )}
          </section>
          {isDiscover && (
            <section className="maker-strip">
              <div className="maker-art">
                <Code2 size={46} strokeWidth={1.1} />
                <span>:) </span>
              </div>
              <div>
                <span className="section-eyebrow">
                  DIETRO OGNI ICONA, UN’IDEA
                </span>
                <h2>Ciao, sono Flavio.</h2>
                <p>
                  Questo è il posto dove raccolgo ciò che costruisco.
                  <br /> Soluzioni quotidiane, esperimenti e qualche gioco.
                  Benvenuto nel mio laboratorio.
                </p>
              </div>
              <a
                href="https://flavioceccarelli.org"
                target="_blank"
                rel="noreferrer"
              >
                Conosciamoci
                <ArrowUpRight size={16} />
              </a>
            </section>
          )}
          <footer className="page-footer">
            <Brand />
            <span>Creato con curiosità, da Flavio Ceccarelli.</span>
            <a
              href="https://github.com/carellice"
              target="_blank"
              rel="noreferrer"
            >
              Dalle idee al codice
              <ArrowUpRight size={13} />
            </a>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navigazione mobile">
        {[
          { id: "discover", label: "Scopri", icon: Compass },
          { id: "all", label: "Progetti", icon: Grid2X2 },
          { id: "downloads", label: "Download", icon: Download },
          { id: "favorites", label: "Salvati", icon: Bookmark },
        ].map((n) => (
          <button
            key={n.id}
            aria-current={view === n.id ? "page" : undefined}
            className={view === n.id ? "active" : ""}
            onClick={() => navigate(n.id)}
          >
            <n.icon size={20} />
            <span>{n.label}</span>
          </button>
        ))}
      </nav>
      {pinOpen && (
        <PrivateAccess
          onClose={closePrivateAccess}
          onUnlock={unlockPrivateAccess}
          allowedRepos={catalogPolicy.protectedRepos}
        />
      )}
      {selected && !pinOpen && (
        <Details
          key={selected.repo}
          app={selected}
          onClose={closeApp}
          favorite={favorites.includes(selected.repo)}
          onFavorite={toggleFavorite}
          onToast={setToast}
          toast={toast}
        />
      )}
      <AnimatePresence>
        {toast && !selected && (
          <motion.div
            role="status"
            className="toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Check size={16} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
