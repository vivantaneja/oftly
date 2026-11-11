import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { savedPlanLabel } from "../plan";
import { cloud, cloudConfigured, redirectURL, clientFor } from "./client";
import {
  selectStorage,
  readCollection,
  allMedia,
  saveCollection,
  readMeta,
  writeMeta,
  storageScope,
  savePlan,
  forgetAccountCache,
} from "../browser/storage";
import {
  startSync,
  syncNow,
  syncSnapshot,
  subscribeSync,
  resolveConflict,
  exportRecovery,
  scheduleSync,
} from "./sync";
const Context = createContext<{
  session: Session | null;
  ready: boolean;
  error: string;
}>({ session: null, ready: false, error: "" });
export const useAccount = () => useContext(Context);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState({
    session: null as Session | null,
    ready: false,
    error: "",
  });
  useEffect(() => {
    let mounted = true,
      sequence = 0;
    async function accept(session: Session | null) {
      const ticket = ++sequence;
      setValue((v) => ({ ...v, ready: false }));
      startSync(null);
      try {
        await selectStorage(session?.user.id ?? null);
        if (!mounted || ticket !== sequence) return;
        const draft = sessionStorage.getItem("oftly-onboarding");
        if (session && draft) {
          await savePlan(JSON.parse(draft), session.user.id);
          if (!mounted || ticket !== sequence) return;
          sessionStorage.removeItem("oftly-onboarding");
          sessionStorage.removeItem("oftly-setup");
        }
        if (!mounted || ticket !== sequence) return;
        startSync(session);
        setValue({ session, ready: true, error: "" });
      } catch (error) {
        if (mounted && ticket === sequence)
          setValue({
            session: null,
            ready: true,
            error: (error as Error).message,
          });
      }
    }
    if (!cloud) {
      void accept(null);
      return () => {
        mounted = false;
        startSync(null);
      };
    }
    const { data } = cloud.auth.onAuthStateChange((_event, session) => {
      // Do not await Supabase operations inside its auth callback (SDK lock).
      queueMicrotask(() => {
        if (!mounted) return;
        if (
          storageScope() === (session?.user.id ?? "guest") &&
          _event === "TOKEN_REFRESHED"
        ) {
          startSync(session);
          setValue((v) => ({ ...v, session }));
          return;
        }
        void accept(session);
      });
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
      startSync(null);
    };
  }, []);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function SignIn({ onGuest }: { onGuest: () => void }) {
  const [email, setEmail] = useState(""),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (!cooldown) return;
    const id = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);
  async function google() {
    if (!cloud) return;
    setBusy(true);
    setError("");
    try {
      const { error } = await cloud.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: redirectURL() },
      });
      if (error) throw error;
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <section className="account-form" aria-labelledby="account-title">
      <h2 id="account-title">Take your learning with you.</h2>
      <p>Save your decks and progress. Pick up on another device.</p>
      {!cloudConfigured ? (
        <p role="status">
          Accounts are being connected on this installation. You can study on
          this device now.
        </p>
      ) : (
        <>
          <button className="secondary" disabled={busy} onClick={google}>
            Continue with Google
          </button>
          <div className="account-divider">or use your email</div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!cloud || busy || cooldown) return;
              setBusy(true);
              setError("");
              try {
                const { error } = await cloud.auth.signInWithOtp({
                  email: email.trim(),
                  options: {
                    emailRedirectTo: redirectURL(),
                    shouldCreateUser: true,
                  },
                });
                if (error) throw error;
                setSent(true);
                setCooldown(60);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="signin-email">Email address</label>
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setSent(false);
              }}
              placeholder="you@example.com"
            />
            <button className="primary" disabled={busy || cooldown > 0}>
              {busy
                ? "Connecting…"
                : cooldown
                  ? `Send again in ${cooldown}s`
                  : sent
                    ? "Send another sign-in link"
                    : "Email me a sign-in link"}
            </button>
          </form>
          {sent && (
            <p role="status" className="success">
              Check your inbox. Open the link in this browser to finish signing
              in. You can close this page and return.
            </p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <p className="account-privacy">
        Signing in stores your cards, imported media, study plan and review
        history in your private account.{" "}
        <a href="/privacy.html">Privacy & data</a>
      </p>
      <button className="text-button" onClick={onGuest}>
        Continue on this device without an account
      </button>
    </section>
  );
}
export function AccountSettings() {
  const { session } = useAccount();
  const sync = useSyncExternalStore(subscribeSync, syncSnapshot);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [guestCount, setGuestCount] = useState(0),
    [recovery, setRecovery] = useState(false),
    [plan, setPlan] = useState<Record<string, unknown> | null>(null),
    [deletion, setDeletion] = useState("");
  useEffect(() => {
    void readCollection("guest").then((s) => setGuestCount(s.notes.length));
    void readMeta("recovery").then((v) => setRecovery(Boolean(v)));
    void readMeta<Record<string, unknown>>("plan").then((v) =>
      setPlan(v ?? null),
    );
  }, [sync.lastSynced]);
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!session) return <SignIn onGuest={() => (location.hash = "today")} />;
  return (
    <section className="narrow-page account-settings">
      <h1>Your account</h1>
      <p>{session.user.email}</p>
      <p role="status">
        {sync.message}
        {sync.status === "saved" && sync.lastSynced
          ? ` · ${new Date(sync.lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : ""}
      </p>
      <div className="actions">
        <button
          className="secondary"
          disabled={busy || sync.status === "syncing"}
          onClick={() => run(syncNow)}
        >
          Sync now
        </button>
        <button
          className="text-button"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const { error } = await cloud!.auth.signOut({ scope: "local" });
              if (error) throw error;
              location.hash = "welcome";
            })
          }
        >
          Sign out
        </button>
      </div>
      {sync.status === "conflict" && (
        <div className="sync-conflict">
          <h2>Keep both copies first.</h2>
          <p>
            Different edits reached the same material. Download both versions,
            then choose the library to continue with. Your previous versions
            also stay recoverable on this device.
          </p>
          <button
            className="secondary"
            disabled={busy}
            onClick={() => run(exportRecovery)}
          >
            Download both versions
          </button>
          <div className="actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => run(() => resolveConflict("local"))}
            >
              Keep this device’s library
            </button>
            <button
              className="secondary"
              disabled={busy}
              onClick={() => run(() => resolveConflict("remote"))}
            >
              Use the cloud library
            </button>
          </div>
        </div>
      )}
      {recovery && (
        <button className="text-button" onClick={() => run(exportRecovery)}>
          Download previous conflict versions
        </button>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {guestCount > 0 && (
        <div className="data-section">
          <h2>Cards from guest study</h2>
          <p>
            {guestCount} notes are saved in this browser’s guest library. They
            have not been uploaded.
          </p>
          <button
            className="secondary"
            disabled={busy || sync.status !== "saved"}
            onClick={() =>
              run(async () => {
                await navigator.locks.request("oftly-collection", async () => {
                  if (storageScope() !== session.user.id)
                    throw Error("Sign in again before copying cards.");
                  const own = await readCollection(),
                    guest = await readCollection("guest");
                  // Require an empty destination so an imported Anki ID never replaces a different card.
                  if (own.notes.length || own.cards.length || own.decks.length)
                    throw Error(
                      "This account already has a library. Export both libraries before combining them. Restoring an Oftly backup can replace matching notes and progress.",
                    );
                  guest.revision = own.revision;
                  const media = await allMedia("guest");
                  await saveCollection(
                    guest,
                    await Promise.all(
                      media.map(async (x) => ({
                        name: x.name,
                        data: new Uint8Array(await x.blob.arrayBuffer()),
                        type: x.blob.type,
                      })),
                    ),
                  );
                });
                scheduleSync(0);
                setGuestCount(0);
                window.dispatchEvent(new Event("oftly-remote"));
              })
            }
          >
            Copy guest cards into this account
          </button>
        </div>
      )}
      {plan && (
        <div className="data-section">
          <h2>Your starting rhythm</h2>
          <p>{savedPlanLabel(plan)}</p>
          <a href="#welcome">Revisit the study planner</a>
        </div>
      )}
      <details className="data-section">
        <summary>Delete account</summary>
        <p>
          This permanently deletes your cloud library, uploaded media and
          sign-in identity. Download a backup first. Offline copies on other
          devices must be cleared there.
        </p>
        <label htmlFor="confirm-delete">
          Type delete my account to confirm
        </label>
        <input
          id="confirm-delete"
          value={deletion}
          onChange={(e) => setDeletion(e.target.value)}
        />
        <button
          className="danger"
          disabled={busy || deletion !== "delete my account"}
          onClick={() =>
            run(async () => {
              const { error } = await clientFor(session).functions.invoke(
                "delete-account",
                { body: { confirm: deletion } },
              );
              if (error)
                throw Error(
                  "Account deletion did not finish. Please retry; attachments may already have been removed.",
                );
              const userId = session.user.id;
              if (storageScope() === userId)
                await cloud!.auth.signOut({ scope: "local" });
              await forgetAccountCache(userId);
              location.hash = "welcome";
            })
          }
        >
          Delete my account permanently
        </button>
      </details>
      <div className="data-section">
        <h2>Your data</h2>
        <p>
          Each browser keeps an offline copy. Sign-out hides this account’s
          library; it does not erase that copy. On a shared device, clear this
          site’s data after signing out. Download backups from Settings.
        </p>
        <a href="/privacy.html">How account data is stored</a>
      </div>
    </section>
  );
}
