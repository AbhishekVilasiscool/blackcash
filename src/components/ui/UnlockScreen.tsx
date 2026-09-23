import { useState } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { WaxSeal } from "../ornament/WaxSeal";
import { Button } from "./Button";
import { Input } from "./Input";

interface UnlockScreenProps {
  onUnlock: (passphrase: string) => Promise<void>;
  isUninitialized?: boolean;
}

export function UnlockScreen({ onUnlock, isUninitialized = false }: UnlockScreenProps) {
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [autoLockMinutes, setAutoLockMinutes] = useState(15);
  const [acknowledged, setAcknowledged] = useState(false);
  const [setupError, setSetupError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passphrase) return;
    setIsLoading(true);
    setError("");
    try {
      await onUnlock(passphrase);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSubmit = async (e: FormEvent<HTMLFormElement>, setupFn: (passphrase: string, autoLockMinutes: number) => Promise<void>) => {
    e.preventDefault();
    if (!passphrase || passphrase.length < 8) {
      setSetupError("Passphrase must be at least 8 characters");
      return;
    }
    if (passphrase !== confirmPassphrase) {
      setSetupError("Passphrases do not match");
      return;
    }
    if (!acknowledged) {
      setSetupError("You must acknowledge that lost passphrase means unrecoverable data");
      return;
    }
    setIsLoading(true);
    setSetupError("");
    try {
      await setupFn(passphrase, autoLockMinutes);
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "Failed to setup vault");
    } finally {
      setIsLoading(false);
    }
  };

  if (isUninitialized) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="setup"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur"
        >
          <div className="w-full max-w-md bg-[var(--bg-2)] border border-border rounded-xl p-8 shadow-xl">
            <div className="text-center mb-8">
              <WaxSeal size={48} tone="accent" aria-hidden="true" className="mx-auto mb-4" />
              <h1 className="font-display text-xl font-semibold">Initialize Vault</h1>
              <p className="mt-2 text-sm text-muted">
                Set a passphrase to encrypt your financial data locally.
              </p>
            </div>

            <div className="mb-6 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Important: No Recovery</p>
                  <p className="text-xs mt-1">
                    There is no server, no backup, and no way to recover your data if you forget this passphrase.
                    Your encrypted data will be permanently unrecoverable.
                  </p>
                </div>
              </div>
            </div>

            {setupError && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
                {setupError}
              </div>
            )}

            <form onSubmit={(e) => handleSetupSubmit(e, setupFn)} className="space-y-4">
              <div>
                <label className="block text-xs font-caps text-muted mb-1">Passphrase</label>
                <Input
                  type={showPassphrase ? "text" : "password"}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter passphrase (min 8 characters)"
                  required
                  disabled={isLoading}
                />
                <div className="flex items-center justify-end mt-1">
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="text-xs text-muted hover:text-text"
                  >
                    {showPassphrase ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-caps text-muted mb-1">Confirm Passphrase</label>
                <Input
                  type={showPassphrase ? "text" : "password"}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Confirm passphrase"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-caps text-muted mb-1">Auto-lock after (minutes)</label>
                <select
                  value={autoLockMinutes}
                  onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-2 focus:outline-accent"
                  disabled={isLoading}
                >
                  <option value={0}>Never</option>
                  <option value={5}>5</option>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={60}>60</option>
                </select>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-1 rounded border-border"
                  disabled={isLoading}
                />
                <span className="text-sm text-text">
                  I understand that <strong>losing this passphrase means my data is permanently unrecoverable</strong>.
                </span>
              </label>

              <Button type="submit" className="w-full" disabled={isLoading || !acknowledged}>
                {isLoading ? "Initializing..." : "Initialize Vault"}
              </Button>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="unlock"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur"
      >
        <div className="w-full max-w-md bg-[var(--bg-2)] border border-border rounded-xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <WaxSeal size={48} tone={isUninitialized ? "oxblood" : "accent"} aria-hidden="true" className="mx-auto mb-4" />
            <h1 className="font-display text-xl font-semibold">
              {isUninitialized ? "Initialize Vault" : "Unlock Vault"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {isUninitialized
                ? "Set a passphrase to encrypt your financial data locally."
                : "Enter your passphrase to decrypt your financial data."}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-caps text-muted mb-1">Passphrase</label>
              <Input
                type={showPassphrase ? "text" : "password"}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter your passphrase"
                required
                autoFocus
                disabled={isLoading}
              />
              <div className="flex items-center justify-end mt-1">
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="text-xs text-muted hover:text-text"
                >
                  {showPassphrase ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (isUninitialized ? "Initializing..." : "Unlocking...") : (isUninitialized ? "Initialize" : "Unlock")}
            </Button>
          </form>

          {isUninitialized && (
            <p className="mt-4 text-center text-xs text-muted">
              No vault configured yet. You'll be guided through setup.
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function setupFn(_passphrase: string, _autoLockMinutes: number): Promise<void> {
  throw new Error("setupFn not connected");
}