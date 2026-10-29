import { useEffect, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole, X } from "lucide-react";
import { unlockCatalog } from "./protected-catalog";
import envelope from "./data/protected-catalog.json";

export default function PrivateAccess({ onClose, onUnlock, allowedRepos }) {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const generation = useRef(0);
  const [pin, setPin] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    dialogRef.current.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      generation.current += 1;
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function close() {
    generation.current += 1;
    setPin("");
    onClose();
  }

  async function submit(event) {
    event.preventDefault();
    if (working || !/^\d{6}$/.test(pin)) return;
    const attempt = ++generation.current;
    setWorking(true);
    setError("");
    try {
      const projects = await unlockCatalog(pin, envelope);
      if (attempt !== generation.current) return;
      if (projects.some((app) => !allowedRepos.includes(app.repo))) {
        throw new Error("Unexpected private project");
      }
      setPin("");
      onUnlock(projects);
    } catch {
      if (attempt !== generation.current) return;
      setError("PIN non corretto. Riprova.");
      setPin("");
      setWorking(false);
      inputRef.current?.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="private-dialog"
      aria-labelledby="private-title"
      aria-describedby="private-description"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) close();
      }}
    >
      <button
        className="close-dialog"
        onClick={close}
        aria-label="Chiudi area riservata"
      >
        <X size={20} />
      </button>
      <span className="private-lock">
        <LockKeyhole size={26} strokeWidth={1.5} />
      </span>
      <span className="section-eyebrow">UN PICCOLO SPAZIO, SOLO TUO</span>
      <h2 id="private-title">Area riservata.</h2>
      <p id="private-description">
        Inserisci il PIN per sbloccare i progetti riservati in questa sessione.
      </p>
      <form onSubmit={submit} aria-busy={working}>
        <label htmlFor="private-pin">PIN di accesso</label>
        <input
          ref={inputRef}
          id="private-pin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]{6}"
          minLength={6}
          maxLength={6}
          value={pin}
          onChange={(event) => {
            setPin(event.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          placeholder="••••••"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          required
          readOnly={working}
          aria-invalid={!!error}
          aria-describedby={error ? "private-error" : "private-hint"}
        />
        <div className="private-feedback">
          {error ? (
            <p id="private-error" role="alert">
              {error}
            </p>
          ) : (
            <p id="private-hint">
              6 cifre. Lo sblocco termina quando ricarichi la pagina.
            </p>
          )}
        </div>
        <button
          className="private-submit"
          type="submit"
          disabled={working || pin.length !== 6}
        >
          {working ? (
            <>
              <LoaderCircle className="pin-spinner" size={17} />
              Sblocco in corso…
            </>
          ) : (
            <>
              Sblocca la collezione
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
    </dialog>
  );
}
