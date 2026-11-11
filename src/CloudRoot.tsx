import {
  lazy,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import App from "./App";
import { SuggestionsProvider } from "./lib/suggestions";
import {
  AccountProvider,
  AccountSettings,
  SignIn,
  useAccount,
} from "./lib/cloud/auth";
import { subscribeSync, syncSnapshot } from "./lib/cloud/sync";
import "./pages/landing.css";
const Research = lazy(() => import("./pages/Research"));
const Landing = lazy(() => import("./pages/Landing"));
function Privacy() {
  return (
    <main className="privacy-page">
      <a href="#today">Back to Oftly</a>
      <h1>Privacy & data</h1>
      <p>
        Oftly is a flashcard app built by Vivan and Ashvant. Guest study works
        without an account. Account sync is optional.
      </p>
      <h2>On this device</h2>
      <p>
        Cards, sources, media and review history are stored in this browser. We
        also keep your study-planner answers and preferences. Clearing site
        storage can erase unsynced work. The app caches its public files for
        offline use.
      </p>
      <h2>When you sign in</h2>
      <p>
        Supabase provides authentication and stores your library in its Ireland
        region. Google sign-in shares your email and basic profile with
        Supabase. Email links are delivered through Resend. Your library is
        private to your account, protected by access rules. This is not
        end-to-end encryption: service operators can administer the backend.
      </p>
      <h2>Sync and sign-out</h2>
      <p>
        Each account has a separate offline library in this browser. Signing out
        hides it but leaves the offline copy here. On a shared device, sign out
        and clear this site’s storage. Conflicting edits are preserved for you
        to resolve; download both versions before choosing.
      </p>
      <h2>Export and deletion</h2>
      <p>
        Download your cards, history and media from Settings → Backups. Account
        deletion is available in Account and removes the server library and
        sign-in identity. Other devices may retain offline copies until their
        site data is cleared.
      </p>
      <h2>No advertising or analytics</h2>
      <p>
        Oftly does not include advertising trackers or analytics. Hosting and
        authentication providers process operational logs, such as request IP
        addresses, for delivery and security. Your planner answers are used for
        the study plan, not for advertising.
      </p>
      <p>
        <a href="https://github.com/vivantaneja/oftly">
          Project source and documentation
        </a>
      </p>
    </main>
  );
}
function Content() {
  const { session, ready, error } = useAccount(),
    [route, setRoute] = useState(location.hash.slice(1));
  const sync = useSyncExternalStore(subscribeSync, syncSnapshot);
  useEffect(() => {
    const fn = () => {
      setRoute(location.hash.slice(1));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  if (!ready)
    return (
      <main className="loading-account" role="status">
        Opening your study space…
      </main>
    );
  if (error)
    return (
      <main className="loading-account">
        <h1>Couldn’t open this library.</h1>
        <p role="alert">{error}</p>
        <button className="primary" onClick={() => location.reload()}>
          Try again
        </button>
      </main>
    );
  if (route === "research")
    return (
      <Suspense
        fallback={
          <main className="loading-account">Opening the research…</main>
        }
      >
        <Research />
      </Suspense>
    );
  if (route === "privacy") return <Privacy />;
  const authError = new URLSearchParams(location.hash.slice(1)).get(
    "error_description",
  );
  if (authError)
    return (
      <main className="auth-page">
        <h1>This sign-in link couldn’t be used.</h1>
        <p role="alert">{authError}</p>
        <a href="#account">Request a new link</a>
      </main>
    );
  if (route === "welcome" || (!route && !session))
    return (
      <Suspense
        fallback={<main className="loading-account">Opening Oftly…</main>}
      >
        <Landing />
      </Suspense>
    );
  if (route === "account" && !session)
    return (
      <main className="auth-page">
        <a href="#welcome" className="landing-brand" aria-label="Oftly home">
          <img src="/brand/oftly-icon.svg" alt="" />
          <img src="/brand/oftly-wordmark-ink.svg" alt="oftly" />
        </a>
        <h1 className="sr-only">Sign in to Oftly</h1>
        <SignIn onGuest={() => (location.hash = "today")} />
      </main>
    );
  return (
    <SuggestionsProvider key={session?.user.id ?? "guest"}>
      {session && (
        <div className="cloud-status">
          <a href="#account">{sync.message}</a>
        </div>
      )}
      <App account={<AccountSettings />} />
    </SuggestionsProvider>
  );
}
export default function CloudRoot() {
  return (
    <AccountProvider>
      <Content />
    </AccountProvider>
  );
}
