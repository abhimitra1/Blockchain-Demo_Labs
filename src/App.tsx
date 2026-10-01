import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Box,
  Check,
  ChevronRight,
  CircleHelp,
  Code2,
  Coins,
  Copy,
  Cpu,
  ExternalLink,
  Fingerprint,
  FlaskConical,
  Hash,
  Info,
  Link2,
  Menu,
  Network,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  computeChain,
  hashText,
  matchingPeers,
  type Block,
  type ComputedBlock,
} from "./engine";
import seeds from "./seeds.json";

type Lab = "hash" | "block" | "blockchain" | "distributed" | "tokens";
const labs = [
  {
    id: "hash",
    title: "Hash",
    subtitle: "Digital fingerprints",
    icon: Hash,
    description:
      "Any input. One unique fingerprint. Experiment with SHA-256 in real time.",
  },
  {
    id: "block",
    title: "Block",
    subtitle: "Proof of work",
    icon: Box,
    description: "Change the data, adjust the nonce, and mine your own block.",
  },
  {
    id: "blockchain",
    title: "Blockchain",
    subtitle: "Connected by hashes",
    icon: Blocks,
    description:
      "Five blocks. One connected history. See how a change travels down the chain.",
  },
  {
    id: "distributed",
    title: "Distributed",
    subtitle: "A shared ledger",
    icon: Network,
    description:
      "Explore three independent copies of the same chain. Change one and compare.",
  },
  {
    id: "tokens",
    title: "Tokens",
    subtitle: "Value in motion",
    icon: Coins,
    description:
      "Put transfers on the chain. Edit a transaction and see what happens to the ledger.",
  },
] as const;
const getLab = (): Lab => {
  const last = window.location.pathname.split("/").filter(Boolean).at(-1);
  return labs.some((l) => l.id === last) ? (last as Lab) : "hash";
};
const clone = <T,>(value: T): T => structuredClone(value);
const makeStores = (): Record<Exclude<Lab, "hash">, Block[][]> => ({
  block: [[clone(seeds.standard[0])]],
  blockchain: [clone(seeds.standard)],
  distributed: [
    clone(seeds.standard),
    clone(seeds.standard),
    clone(seeds.standard),
  ],
  tokens: [clone(seeds.tokens), clone(seeds.tokens), clone(seeds.tokens)],
});
const fmt = (number: number) => number.toLocaleString();

function CopyButton({
  text,
  label = "Copy hash",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false),
    [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);
    } catch {
      setFailed(true);
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 2000);
  }
  return (
    <button
      className="icon-button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      title={
        failed
          ? "Select the hash and copy manually"
          : copied
            ? "Copied!"
            : label
      }
    >
      {copied ? <Check size={16} /> : <Copy size={16} />}
      <span className="sr-only" role="status">
        {failed
          ? "Copy unavailable. Select the hash and copy manually."
          : copied
            ? "Copied to clipboard"
            : ""}
      </span>
    </button>
  );
}
function HashValue({
  value,
  difficulty = 0,
  compare,
}: {
  value: string;
  difficulty?: number;
  compare?: string;
}) {
  return (
    <code className="hash-value">
      {value.split("").map((c, i) => (
        <span
          key={i}
          className={
            compare && c !== compare[i]
              ? "changed-digit"
              : i < difficulty && value.startsWith("0".repeat(difficulty))
                ? "zero-digit"
                : ""
          }
        >
          {c}
        </span>
      ))}
    </code>
  );
}
function HashLab({
  data,
  setData,
  comparison,
  setComparison,
  compare,
  setCompare,
}: {
  data: string;
  setData: (s: string) => void;
  comparison: string;
  setComparison: (s: string) => void;
  compare: boolean;
  setCompare: (b: boolean) => void;
}) {
  const hash = hashText(data),
    secondHash = hashText(comparison);
  const differentBits = [...hash].reduce(
    (total, c, i) =>
      total +
      (parseInt(c, 16) ^ parseInt(secondHash[i], 16))
        .toString(2)
        .replaceAll("0", "").length,
    0,
  );
  return (
    <>
      <div className="workspace-heading">
        <div>
          <span className="live-dot" /> Live playground{" "}
          <span className="muted-label">SHA-256</span>
        </div>
        <button
          className={`button small ${compare ? "active" : "secondary"}`}
          onClick={() => setCompare(!compare)}
        >
          <ArrowLeftRight size={15} />
          {compare ? "Close comparison" : "Compare inputs"}
        </button>
      </div>
      <div className={`hash-layout ${compare ? "comparing" : ""}`}>
        <div className="hash-main panel">
          <div className="panel-heading">
            <div className="number-label">01</div>
            <h2>Input data</h2>
            <span className="tag">EDITABLE</span>
          </div>
          <div className="editor-wrap">
            <textarea
              aria-label="Input data"
              spellCheck={false}
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder="Type anything here…"
            />
            <div className="editor-bottom">
              <span>Plain text</span>
              <span>{fmt(new TextEncoder().encode(data).length)} bytes</span>
            </div>
          </div>
          <div className="sample-row">
            <span>Try an input</span>
            {["Hello, blockchain!", "hello, blockchain!", ""].map(
              (sample, i) => (
                <button
                  key={i}
                  className="sample-button"
                  onClick={() => setData(sample)}
                >
                  {["Hello, blockchain!", "Change a letter", "Empty string"][i]}
                </button>
              ),
            )}
          </div>
          <div className="hash-bridge">
            <span />
            <div>
              <Fingerprint size={18} /> SHA-256 <ArrowDown size={14} />
            </div>
            <span />
          </div>
          <div className="output-heading">
            <div className="number-label">02</div>
            <h2>Hash output</h2>
            <span className="live-label">
              <span className="live-dot" /> Live
            </span>
            <CopyButton text={hash} />
          </div>
          <div className="hash-output" key={hash}>
            <HashValue value={hash} />
          </div>
          <div className="output-footer">
            <ShieldCheck size={14} />
            <span>256 bits</span>
            <span className="separator-dot">·</span>
            <span>64 hexadecimal characters</span>
            <span className="output-algo">SHA-256</span>
          </div>
        </div>
        {compare ? (
          <div className="panel comparison-panel">
            <div className="panel-heading">
              <div className="number-label">B</div>
              <h2>Compare input</h2>
              <span className="tag">EDITABLE</span>
            </div>
            <div className="editor-wrap">
              <textarea
                aria-label="Comparison input"
                value={comparison}
                onChange={(e) => setComparison(e.target.value)}
                spellCheck={false}
              />
              <div className="editor-bottom">
                <span>Plain text</span>
                <span>
                  {fmt(new TextEncoder().encode(comparison).length)} bytes
                </span>
              </div>
            </div>
            <div className="comparison-description">
              <ArrowLeftRight size={16} />
              {data === comparison
                ? "Identical input, identical hash."
                : "Changed hash characters are highlighted below."}
            </div>
            <div className="hash-bridge">
              <span />
              <div>
                <Fingerprint size={18} /> SHA-256 <ArrowDown size={14} />
              </div>
              <span />
            </div>
            <div className="output-heading">
              <div className="number-label">02</div>
              <h2>Hash output</h2>
              <CopyButton text={secondHash} />
            </div>
            <div className="hash-output">
              <HashValue value={secondHash} compare={hash} />
            </div>
            <div className="output-footer">
              <Sparkles size={14} />
              <strong>{differentBits} / 256</strong>
              <span>
                bits differ ({Math.round((differentBits / 256) * 100)}%)
              </span>
            </div>
          </div>
        ) : (
          <aside className="hash-aside">
            <div className="fingerprint-art">
              <div className="orbit orbit-one" />
              <div className="orbit orbit-two" />
              <div className="orbit orbit-three" />
              <div className="fingerprint-core">
                <Fingerprint size={62} strokeWidth={1.25} />
              </div>
              <span className="floating-tag tag-top">input</span>
              <span className="floating-tag tag-bottom">0x7f…a2</span>
              <div className="art-dot dot-one" />
              <div className="art-dot dot-two" />
            </div>
            <div className="aside-copy">
              <span className="eyebrow">THE DIGITAL FINGERPRINT</span>
              <h2>
                Small change.
                <br />
                Entirely new hash.
              </h2>
              <p>
                A single character changes the output. The fingerprint stays the
                same length, every time.
              </p>
              <button className="text-button" onClick={() => setCompare(true)}>
                See it side by side <ArrowRight size={16} />
              </button>
            </div>
            <div className="aside-note">
              <div className="mini-icon">
                <Code2 size={16} />
              </div>
              <div>
                <strong>Real cryptography. Real time.</strong>
                <p>Computed right here in your browser.</p>
              </div>
            </div>
          </aside>
        )}
      </div>
      <div className="facts-grid">
        <Fact
          icon={Fingerprint}
          title="Deterministic"
          text="The same input always produces the same hash."
        />
        <Fact
          icon={ArrowRight}
          title="One-way by design"
          text="A hash is a fingerprint, not encrypted data to decode."
        />
        <Fact
          icon={Zap}
          title="The avalanche effect"
          text="A tiny input change produces a very different output."
        />
      </div>
    </>
  );
}
function Fact({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Hash;
  title: string;
  text: string;
}) {
  return (
    <div className="fact">
      <div className="fact-icon">
        <Icon size={19} />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function BlockCard({
  block,
  index,
  single,
  tokens,
  busy,
  progress,
  disabled,
  difficulty,
  update,
  mine,
  cancel,
}: {
  block: ComputedBlock;
  index: number;
  single: boolean;
  tokens: boolean;
  busy: boolean;
  progress: number;
  disabled: boolean;
  difficulty: number;
  update: (b: Partial<Block>) => void;
  mine: () => void;
  cancel: () => void;
}) {
  return (
    <article
      className={`block-card panel ${block.valid ? "valid" : "invalid"} ${single ? "single-block" : ""}`}
      id={`block-${index}`}
    >
      <div className="block-card-heading">
        <div className="block-icon">
          <Box size={19} />
        </div>
        <h2>Block {index + 1}</h2>
        <span className={`status-badge ${block.valid ? "" : "danger"}`}>
          {block.valid ? <Check size={12} /> : <Info size={12} />}{" "}
          {block.valid ? "Valid" : "Invalid"}
        </span>
      </div>
      <fieldset disabled={disabled}>
        <div className="two-fields">
          <label>
            Block number
            <input
              aria-label={`Block ${index + 1} number`}
              type="number"
              min="1"
              max="999999999"
              step="1"
              value={block.number}
              onChange={(e) =>
                update({
                  number: Math.min(
                    999999999,
                    Math.max(1, Math.trunc(Number(e.target.value))),
                  ),
                })
              }
            />
          </label>
          <label>
            Nonce
            <input
              aria-label={`Block ${index + 1} nonce`}
              type="number"
              min="0"
              max="999999999"
              step="1"
              value={busy ? progress : block.nonce}
              onChange={(e) =>
                update({
                  nonce: Math.min(
                    999999999,
                    Math.max(0, Math.trunc(Number(e.target.value))),
                  ),
                })
              }
            />
          </label>
        </div>
        {tokens ? (
          <div className="transactions">
            <div className="field-heading">
              <span>Transactions</span>
              <span>{block.transactions!.length} transfers</span>
            </div>
            <div className="transaction-labels">
              <span>From</span>
              <span>To</span>
              <span>Amount</span>
              <span />
            </div>
            {block.transactions!.map((tx, ti) => (
              <div className="transaction" key={ti}>
                <input
                  aria-label={`Block ${index + 1} transaction ${ti + 1} sender`}
                  value={tx.from}
                  onChange={(e) =>
                    update({
                      transactions: block.transactions!.map((t, j) =>
                        j === ti ? { ...t, from: e.target.value } : t,
                      ),
                    })
                  }
                />
                <input
                  aria-label={`Block ${index + 1} transaction ${ti + 1} recipient`}
                  value={tx.to}
                  onChange={(e) =>
                    update({
                      transactions: block.transactions!.map((t, j) =>
                        j === ti ? { ...t, to: e.target.value } : t,
                      ),
                    })
                  }
                />
                <input
                  aria-label={`Block ${index + 1} transaction ${ti + 1} amount`}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={tx.amount}
                  onChange={(e) =>
                    update({
                      transactions: block.transactions!.map((t, j) =>
                        j === ti ? { ...t, amount: e.target.value } : t,
                      ),
                    })
                  }
                />
                <button
                  aria-label={`Remove transaction ${ti + 1} from block ${index + 1}`}
                  className="icon-button"
                  onClick={() =>
                    update({
                      transactions: block.transactions!.filter(
                        (_, j) => j !== ti,
                      ),
                    })
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              className="text-button add-transfer"
              onClick={() =>
                update({
                  transactions: [
                    ...block.transactions!,
                    { from: "Alice", to: "Bob", amount: "1" },
                  ],
                })
              }
            >
              <Plus size={14} /> Add transfer
            </button>
          </div>
        ) : (
          <label className="data-field">
            Data
            <textarea
              aria-label={`Block ${index + 1} data`}
              value={block.data}
              spellCheck={false}
              onChange={(e) => update({ data: e.target.value })}
            />
          </label>
        )}
      </fieldset>
      {!single && (
        <div className="block-hash previous-hash">
          <div className="field-heading">
            <span>
              <Link2 size={12} /> Previous hash
            </span>
            {index === 0 && <span>GENESIS</span>}
          </div>
          <HashValue value={block.previous} />
        </div>
      )}
      <div className="block-hash">
        <div className="field-heading">
          <span>Block hash</span>
          <CopyButton text={block.hash} />
        </div>
        <HashValue value={block.hash} difficulty={difficulty} />
      </div>
      <div className="block-status-text">
        {busy
          ? `Testing nonces · ${fmt(progress)} attempts`
          : block.valid
            ? `Hash begins with ${"0".repeat(difficulty)}. Proof of work satisfied.`
            : block.proof
              ? "Proof is valid, but an earlier block is invalid."
              : `Hash must begin with ${"0".repeat(difficulty)}. Mine to find a nonce.`}
      </div>
      <button
        className={`button mine-button ${busy ? "secondary" : "primary"}`}
        disabled={disabled && !busy}
        onClick={busy ? cancel : mine}
      >
        {busy ? <Square size={15} /> : <Cpu size={16} />}{" "}
        {busy ? "Stop mining" : "Mine block"}
        {!busy && <ArrowRight size={15} />}
      </button>
    </article>
  );
}

export default function App() {
  const [lab, setLab] = useState<Lab>(getLab),
    [stores, setStores] = useState(makeStores);
  const [data, setData] = useState("Hello, blockchain!"),
    [comparison, setComparison] = useState("hello, blockchain!"),
    [compare, setCompare] = useState(false);
  const [difficulty, setDifficulty] = useState(4),
    [peer, setPeer] = useState(0),
    [help, setHelp] = useState(false),
    [mobileMenu, setMobileMenu] = useState(false);
  const [mining, setMining] = useState<{
    lab: Exclude<Lab, "hash">;
    peer: number;
    index: number;
    attempts: number;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const worker = useRef<Worker | null>(null),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const helpDialog = useRef<HTMLDialogElement>(null);
  const info = labs.find((l) => l.id === lab)!;
  const isNetwork = lab === "distributed" || lab === "tokens";
  const currentPeers = lab === "hash" ? [] : stores[lab];
  const currentPeer = isNetwork ? peer : 0;
  const chain =
    lab === "hash" ? [] : computeChain(currentPeers[currentPeer], difficulty);
  const validCount = chain.filter((b) => b.valid).length;
  function announce(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 5000);
  }
  function cancelMining() {
    worker.current?.terminate();
    worker.current = null;
    setMining(null);
  }
  function navigate(next: Lab) {
    cancelMining();
    setLab(next);
    setPeer(0);
    setMobileMenu(false);
    window.history.pushState({}, "", `/${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  useEffect(() => {
    const onPop = () => {
      cancelMining();
      setLab(getLab());
      setPeer(0);
    };
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      worker.current?.terminate();
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);
  useEffect(() => {
    document.title = `${info.title} · Blockchain Lab · ApexDevs`;
    document
      .querySelector('link[rel="canonical"]')
      ?.setAttribute("href", `https://blockchaindemo.apexdevs.io/${lab}`);
  }, [lab, info.title]);
  useEffect(() => {
    if (help) helpDialog.current?.showModal();
    else helpDialog.current?.close();
  }, [help]);
  function reset() {
    cancelMining();
    if (lab === "hash") {
      setData("Hello, blockchain!");
      setComparison("hello, blockchain!");
      setCompare(false);
    } else {
      setStores((s) => ({ ...s, [lab]: makeStores()[lab] }));
      setDifficulty(4);
      setPeer(0);
    }
    announce(`${info.title} demo reset.`);
  }
  function update(index: number, patch: Partial<Block>) {
    if (lab === "hash") return;
    setStores((s) => ({
      ...s,
      [lab]: s[lab].map((p, pi) =>
        pi === currentPeer
          ? p.map((b, i) => (i === index ? { ...b, ...patch } : b))
          : p,
      ),
    }));
  }
  function mine(index: number) {
    if (lab === "hash") return;
    cancelMining();
    const activeLab = lab,
      activePeer = currentPeer;
    const b = chain[index];
    try {
      const miner = new Worker(new URL("./miner.worker.ts", import.meta.url), {
        type: "module",
      });
      worker.current = miner;
      setMining({ lab: activeLab, peer: activePeer, index, attempts: 0 });
      miner.onmessage = (e) => {
        if (worker.current !== miner) return;
        if (e.data.type === "progress") {
          setMining({
            lab: activeLab,
            peer: activePeer,
            index,
            attempts: e.data.attempts,
          });
        } else {
          setStores((s) => ({
            ...s,
            [activeLab]: s[activeLab].map((p, pi) =>
              pi === activePeer
                ? p.map((block, i) =>
                    i === index ? { ...block, nonce: e.data.nonce } : block,
                  )
                : p,
            ),
          }));
          announce(
            `Block ${index + 1} mined in ${fmt(e.data.attempts)} attempts (${(e.data.elapsed / 1000).toFixed(2)}s).`,
          );
          cancelMining();
        }
      };
      miner.onerror = () => {
        cancelMining();
        announce(
          "Mining could not start. Please reload the demo and try again.",
        );
      };
      miner.postMessage({ block: b, previous: b.previous, difficulty });
    } catch {
      cancelMining();
      announce(
        "This browser could not start the mining worker. Try a current browser.",
      );
    }
  }
  const agreement = isNetwork ? matchingPeers(currentPeers, difficulty) : 0;
  const Icon = info.icon;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to sandbox
      </a>
      <aside
        className={`sidebar ${mobileMenu ? "open" : ""}`}
        id="sandbox-navigation"
      >
        <a
          className="brand"
          href="https://apexdevs.io"
          target="_blank"
          rel="noreferrer"
        >
          <img src="/brand/apexdevs-mark.svg" width="28" height="28" alt="" />
          <span className="brand-wordmark">
            Apex<span>Devs</span>
          </span>
        </a>
        <div className="product-name">
          <span className="product-icon">
            <Box size={16} />
          </span>
          Blockchain Lab<span className="version">v1.0</span>
        </div>
        <div className="sidebar-divider" />
        <div className="nav-caption">EXPLORE THE SANDBOX</div>
        <nav aria-label="Demo labs">
          {labs.map((l, i) => (
            <a
              key={l.id}
              href={`/${l.id}`}
              aria-label={`${l.title} demo`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                navigate(l.id);
              }}
              aria-current={lab === l.id ? "page" : undefined}
              className={`nav-item ${lab === l.id ? "selected" : ""}`}
            >
              <l.icon size={20} strokeWidth={1.7} />
              <span>
                <strong>{l.title}</strong>
                <small>{l.subtitle}</small>
              </span>
              <span className="nav-index">0{i + 1}</span>
              {lab === l.id && (
                <ChevronRight size={15} className="nav-chevron" />
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sandbox-note">
            <FlaskConical size={21} />
            <strong>
              A little curiosity.
              <br />A lot to discover.
            </strong>
            <p>
              Change things. Break things.
              <br />
              See how blockchain works.
            </p>
            <span>
              <span className="live-dot" /> All experiments run locally
            </span>
          </div>
          <a
            className="sidebar-link"
            href="https://apexdevs.io"
            target="_blank"
            rel="noreferrer"
          >
            Made for curious builders <ArrowUpRight size={13} />
          </a>
        </div>
      </aside>
      {mobileMenu && (
        <button
          className="menu-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-toggle"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenu}
            aria-controls="sandbox-navigation"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            <span>Sandbox</span>
            <ChevronRight size={13} />
            <span>{info.title}</span>
          </div>
          <div className="topbar-right">
            <span className="browser-status">
              <span className="live-dot" /> Runs in your browser
            </span>
            <a href="https://apexdevs.io" target="_blank" rel="noreferrer">
              apexdevs.io <ArrowUpRight size={13} />
            </a>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-dash" /> INTERACTIVE BLOCKCHAIN SANDBOX
              </div>
              <h1>
                {info.title}
                <span className="title-dot">.</span>
              </h1>
              <p>{info.description}</p>
            </div>
            <div className="page-actions">
              <button className="button secondary" onClick={reset}>
                <RotateCcw size={15} /> Reset demo
              </button>
              <button
                className="help-button"
                onClick={() => setHelp(true)}
                aria-label="How this demo works"
                title="How this demo works"
              >
                <CircleHelp size={19} />
              </button>
            </div>
          </div>
          <div className="lab-content" key={lab}>
            {lab === "hash" ? (
              <HashLab
                data={data}
                setData={setData}
                comparison={comparison}
                setComparison={setComparison}
                compare={compare}
                setCompare={setCompare}
              />
            ) : (
              <>
                <div className="workspace-heading">
                  <div>
                    <span
                      className={`live-dot ${validCount === chain.length ? "" : "warning"}`}
                    />
                    {lab === "block"
                      ? "Block playground"
                      : isNetwork
                        ? "Network playground"
                        : "Chain playground"}
                    <span className="muted-label">
                      {lab === "block"
                        ? "PROOF OF WORK"
                        : `${chain.length} BLOCKS`}
                    </span>
                  </div>
                  <label className="difficulty-select">
                    Difficulty
                    <select
                      aria-label="Mining difficulty"
                      disabled={!!mining}
                      value={difficulty}
                      onChange={(e) => setDifficulty(Number(e.target.value))}
                    >
                      <option value={2}>2 leading zeros</option>
                      <option value={3}>3 leading zeros</option>
                      <option value={4}>4 leading zeros</option>
                    </select>
                  </label>
                </div>
                {isNetwork && (
                  <>
                    <div className="peer-overview">
                      {currentPeers.map((p, i) => {
                        const c = computeChain(p, difficulty),
                          matches =
                            c.at(-1)!.hash ===
                              computeChain(
                                currentPeers[(i + 1) % 3],
                                difficulty,
                              ).at(-1)!.hash ||
                            c.at(-1)!.hash ===
                              computeChain(
                                currentPeers[(i + 2) % 3],
                                difficulty,
                              ).at(-1)!.hash;
                        return (
                          <button
                            key={i}
                            className={`peer-card ${peer === i ? "selected" : ""}`}
                            onClick={() => {
                              cancelMining();
                              setPeer(i);
                            }}
                            aria-pressed={peer === i}
                          >
                            <div className="peer-title">
                              <span className="peer-avatar">
                                <Network size={17} />
                              </span>
                              <strong>
                                Peer {String.fromCharCode(65 + i)}
                              </strong>
                              <span
                                className={`status-badge ${c.every((b) => b.valid) && matches ? "" : "danger"}`}
                              >
                                {c.every((b) => b.valid)
                                  ? matches
                                    ? "In sync"
                                    : "Diverged"
                                  : "Invalid"}
                              </span>
                            </div>
                            <div className="mini-chain">
                              {c.map((b, j) => (
                                <span
                                  key={j}
                                  className={b.valid ? "" : "broken"}
                                >
                                  <Box size={14} />
                                  {j + 1}
                                </span>
                              ))}
                            </div>
                            <div className="peer-bottom">
                              <span>
                                {c.filter((b) => b.valid).length}/5 valid blocks
                              </span>
                              <ChevronRight size={14} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div
                      className={`network-message ${agreement === 3 ? "" : "network-warning"}`}
                    >
                      <Network size={16} />
                      <span>
                        {agreement === 3
                          ? "All 3 peers agree on the same valid chain."
                          : agreement >= 2
                            ? `${agreement} of 3 peers share the same valid chain. One copy differs.`
                            : "No two peers share the same valid chain."}
                      </span>
                      <span className="network-message-detail">
                        Independent copies · no automatic synchronization
                      </span>
                    </div>
                  </>
                )}
                <div className={lab === "block" ? "single-layout" : ""}>
                  <div>
                    {lab !== "block" && (
                      <div className="chain-toolbar">
                        <h2>
                          {isNetwork
                            ? `Peer ${String.fromCharCode(65 + peer)}’s chain`
                            : "Your blockchain"}
                        </h2>
                        <span>
                          <span
                            className={`live-dot ${validCount === chain.length ? "" : "warning"}`}
                          />
                          {validCount} of {chain.length} blocks valid
                        </span>
                        <span className="scroll-hint">
                          Scroll to explore <ArrowRight size={14} />
                        </span>
                      </div>
                    )}
                    <div
                      className={`chain-track ${lab === "block" ? "solo" : ""}`}
                      aria-label="Blocks"
                      tabIndex={lab === "block" ? undefined : 0}
                    >
                      {chain.map((b, i) => (
                        <div className="chain-item" key={i}>
                          <BlockCard
                            block={b}
                            index={i}
                            single={lab === "block"}
                            tokens={lab === "tokens"}
                            busy={
                              mining?.index === i &&
                              mining.peer === currentPeer &&
                              mining.lab === lab
                            }
                            progress={mining?.attempts ?? 0}
                            disabled={!!mining}
                            difficulty={difficulty}
                            update={(patch) => update(i, patch)}
                            mine={() => mine(i)}
                            cancel={() => {
                              cancelMining();
                              announce(
                                "Mining stopped. Your original nonce is unchanged.",
                              );
                            }}
                          />
                          {i < chain.length - 1 && (
                            <div
                              className={`chain-connector ${chain[i + 1].valid ? "" : "broken"}`}
                            >
                              <Link2 size={17} />
                              <ArrowRight size={13} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {lab === "block" && (
                    <aside className="block-aside panel">
                      <div className="aside-icon">
                        <Cpu size={27} />
                      </div>
                      <span className="eyebrow">FIND THE RIGHT NONCE</span>
                      <h2>
                        A valid hash
                        <br />
                        takes a little work.
                      </h2>
                      <p>
                        Mining tries different nonces until the hash starts with
                        the required number of zeros.
                      </p>
                      <div className="target-display">
                        <span>YOUR TARGET</span>
                        <code>
                          {"0".repeat(difficulty)}
                          <span>{"x".repeat(12 - difficulty)}</span>
                        </code>
                      </div>
                      <div className="block-aside-note">
                        <Info size={17} />
                        <p>
                          Editing the data changes the hash. Mine again to find
                          a new valid nonce.
                        </p>
                      </div>
                      <p className="small-note">
                        This simplified block also includes a fixed all-zero
                        previous hash.
                      </p>
                    </aside>
                  )}
                </div>
                <div className="context-strip">
                  <Info size={18} />
                  <p>
                    {lab === "block"
                      ? "The nonce is a number you can change. The hash includes the block number, nonce, data, and previous hash."
                      : lab === "blockchain"
                        ? "Each block includes the previous block’s hash. Edit an earlier block, then mine from left to right to restore the chain."
                        : lab === "distributed"
                          ? "Editing one peer leaves the others untouched. Re-mining a changed chain can make it valid, but it still differs from the other peers."
                          : "Transfers are demo data stored in blocks. Proof of work checks the hash; this sandbox does not verify signatures, balances, or ownership."}
                  </p>
                </div>
                {lab === "tokens" && (
                  <div className="token-footnote">
                    <Coins size={15} /> Sandbox tokens have no monetary value. A
                    matching-peer count illustrates agreement, not a full
                    consensus protocol.
                  </div>
                )}
              </>
            )}
          </div>
          <footer>
            <span>
              Built for exploration. Powered by{" "}
              <a href="https://apexdevs.io" target="_blank" rel="noreferrer">
                ApexDevs
              </a>
              .
            </span>
            <a
              href="https://andersbrownworth.com/blockchain/"
              target="_blank"
              rel="noreferrer"
            >
              Inspired by Anders Brownworth <ExternalLink size={12} />
            </a>
          </footer>
        </main>
      </div>
      <div className={`toast ${notice ? "visible" : ""}`} role="status">
        <Check size={17} />
        {notice}
      </div>
      <dialog
        ref={helpDialog}
        onCancel={() => setHelp(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setHelp(false);
        }}
        className="help-dialog"
      >
        <div className="dialog-heading">
          <span className="aside-icon">
            <Icon size={24} />
          </span>
          <button
            className="icon-button"
            aria-label="Close explanation"
            onClick={() => setHelp(false)}
          >
            <X size={21} />
          </button>
        </div>
        <span className="eyebrow">A QUICK LOOK UNDER THE HOOD</span>
        <h2>How {info.title.toLowerCase()} works</h2>
        <p>
          {lab === "hash"
            ? "SHA-256 turns UTF-8 text into a 256-bit fingerprint, displayed as 64 hexadecimal characters. The same input always produces the same output. Compare inputs to see how changing a character affects the hash."
            : lab === "block"
              ? "A block groups data with a block number and a nonce. Mining searches for a nonce whose SHA-256 hash starts with the selected number of zeros. More zeros usually means more attempts. You can stop mining at any time."
              : lab === "blockchain"
                ? "Each block’s hash depends on its contents and the previous block’s hash. Changing a block updates every hash after it. Restore proof of work by mining the changed block and each following block, in order."
                : lab === "distributed"
                  ? "Peers A, B, and C start with identical ledgers. Changes stay on the selected peer, so you can compare an altered chain with the other copies. A valid chain may still disagree with the others. This is a local illustration, not a live network or complete consensus algorithm."
                  : "Token transfers replace freeform block data. Sender, recipient, and amount all affect the hash. Editing or adding a transfer changes the block and its successors on that peer only. These are illustrative records: the demo does not check balances or digital signatures."}
        </p>
        <div className="dialog-note">
          <Info size={18} />
          <p>
            {lab === "hash"
              ? "Hashing is not encryption. There is no decryption key. For short or predictable inputs, an attacker can still guess and compare hashes."
              : "All hashing uses real SHA-256. Block fields are serialized as a JSON array: [number, nonce, data or transfers, previous hash]. The demo’s leading-zero target is a simplified proof-of-work rule."}
          </p>
        </div>
        <button className="button primary" onClick={() => setHelp(false)}>
          Back to the sandbox <ArrowRight size={16} />
        </button>
      </dialog>
    </div>
  );
}
