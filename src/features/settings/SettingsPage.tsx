import { useState, type FormEvent } from "react";
import { Lock, Unlock, AlertCircle, Download, Trash2, Shield, Check } from "lucide-react";
import { useVault } from "../../hooks/useVault";
import { useAtmosphereSetting } from "../../hooks/useAtmosphereSetting";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Section } from "../../components/ornament/Section";
import { Card } from "../../components/ornament/Card";
import { Divider } from "../../components/ornament/Divider";

export function SettingsPage() {
  const { isLocked, isUnlocked, isUninitialized, metadata, changePassphrase, setAutoLock, lock, setup } = useVault();
  const { level: atmosphereLevel, setLevel: setAtmosphereLevel } = useAtmosphereSetting();

  const [activeTab, setActiveTab] = useState<"vault" | "appearance" | "data">("vault");

  const [currentPassphrase, setCurrentPassphrase] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirmPassphrase, setConfirmPassphrase] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passphraseError, setPassphraseError] = useState("");
  const [passphraseSuccess, setPassphraseSuccess] = useState("");

  const [initPassphrase, setInitPassphrase] = useState("");
  const [initConfirmPassphrase, setInitConfirmPassphrase] = useState("");
  const [initAutoLockMinutes, setInitAutoLockMinutes] = useState(15);
  const [initAcknowledged, setInitAcknowledged] = useState(false);
  const [initError, setInitError] = useState("");
  const [initShowPassphrase, setInitShowPassphrase] = useState(false);

  const [autoLockMinutes, setAutoLockMinutes] = useState(metadata?.autoLockMinutes ?? 15);

  const handleInitialize = async (e: FormEvent) => {
    e.preventDefault();
    setInitError("");

    if (!initPassphrase || !initConfirmPassphrase) {
      setInitError("All fields are required");
      return;
    }
    if (initPassphrase.length < 8) {
      setInitError("Passphrase must be at least 8 characters");
      return;
    }
    if (initPassphrase !== initConfirmPassphrase) {
      setInitError("Passphrases do not match");
      return;
    }
    if (!initAcknowledged) {
      setInitError("You must acknowledge that lost passphrase means unrecoverable data");
      return;
    }

    try {
      await setup(initPassphrase, initAutoLockMinutes);
      setInitPassphrase("");
      setInitConfirmPassphrase("");
      setInitAcknowledged(false);
    } catch (err) {
      setInitError(err instanceof Error ? err.message : "Failed to initialize vault");
    }
  };

  const handleChangePassphrase = async (e: FormEvent) => {
    e.preventDefault();
    setPassphraseError("");
    setPassphraseSuccess("");

    if (!currentPassphrase || !newPassphrase || !confirmPassphrase) {
      setPassphraseError("All fields are required");
      return;
    }
    if (newPassphrase.length < 8) {
      setPassphraseError("New passphrase must be at least 8 characters");
      return;
    }
    if (newPassphrase !== confirmPassphrase) {
      setPassphraseError("New passphrases do not match");
      return;
    }

    try {
      await changePassphrase(currentPassphrase, newPassphrase, autoLockMinutes);
      setPassphraseSuccess("Passphrase changed successfully");
      setCurrentPassphrase("");
      setNewPassphrase("");
      setConfirmPassphrase("");
    } catch (err) {
      setPassphraseError(err instanceof Error ? err.message : "Failed to change passphrase");
    }
  };

  const handleSetAutoLock = async () => {
    try {
      await setAutoLock(autoLockMinutes);
    } catch (err) {
      console.error("Failed to set auto-lock:", err);
    }
  };

  const handleLock = () => {
    lock();
  };

  const handleExport = async () => {
    if (isLocked || isUninitialized) return;
    try {
      const db = (await import("../../lib/db")).db;
      const [accounts, journalEntries, journalLines, contacts, interactions] = await Promise.all([
        db.accounts.toArray(),
        db.journalEntries.toArray(),
        db.journalLines.toArray(),
        db.contacts.toArray(),
        db.interactions.toArray(),
      ]);

      const data = {
        accounts,
        journalEntries,
        journalLines,
        contacts,
        interactions,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blackcash-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm("This will delete ALL financial data. This cannot be undone. Are you sure?")) return;
    if (!confirm("FINAL WARNING: All accounts, journal entries, contacts, and interactions will be permanently deleted.")) return;

    try {
      const db = (await import("../../lib/db")).db;
      await db.transaction("rw", db.accounts, db.journalEntries, db.journalLines, db.contacts, db.interactions, async () => {
        await db.accounts.clear();
        await db.journalEntries.clear();
        await db.journalLines.clear();
        await db.contacts.clear();
        await db.interactions.clear();
      });
    } catch (err) {
      console.error("Clear data failed:", err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Section n={1} title="Settings">
        <div className="flex flex-col lg:flex-row gap-8">
          <nav className="lg:w-48 flex-shrink-0">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab("vault")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-caps transition-colors ${
                    activeTab === "vault"
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-text hover:bg-white/5"
                  }`}
                >
                  <Lock className="h-4 w-4 inline-block mr-2" />
                  Vault
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("appearance")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-caps transition-colors ${
                    activeTab === "appearance"
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-text hover:bg-white/5"
                  }`}
                >
                  <Shield className="h-4 w-4 inline-block mr-2" />
                  Appearance
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("data")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-caps transition-colors ${
                    activeTab === "data"
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-text hover:bg-white/5"
                  }`}
                >
                  <Download className="h-4 w-4 inline-block mr-2" />
                  Data
                </button>
              </li>
            </ul>
          </nav>

          <div className="flex-1">
            {activeTab === "vault" && (
              <div className="space-y-6">
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Lock className="h-6 w-6 text-accent" />
                    <div>
                      <h2 className="font-display font-semibold">Vault Status</h2>
                      <p className="text-sm text-muted">
                        {isUninitialized
                          ? "No vault configured. Your data is stored unencrypted."
                          : isLocked
                          ? "Vault is locked. Financial data is encrypted and inaccessible."
                          : "Vault is unlocked. Financial data is decrypted and accessible."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-caps text-[10px] ${
                      isUnlocked ? "bg-green-500/10 text-green-400" :
                      isLocked ? "bg-red-500/10 text-red-400" : "bg-muted/10 text-muted"
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isUnlocked ? "bg-green-400" : isLocked ? "bg-red-400" : "bg-muted"}`} />
                      {isUnlocked ? "UNLOCKED" : isLocked ? "LOCKED" : "UNINITIALIZED"}
                    </span>
                    {isUnlocked && (
                      <Button variant="ghost" className="px-3 py-1.5 text-sm" onClick={handleLock}>
                        <Lock className="h-3.5 w-3.5 mr-1.5" />
                        Lock Now
                      </Button>
                    )}
                  </div>
                </Card>

                {isUninitialized && (
                  <Card className="p-4">
                    <h3 className="font-caps text-sm tracking-wider text-muted mb-3">Initialize Vault</h3>
                    <p className="text-sm text-muted mb-4">
                      Set a passphrase to encrypt your financial data. This passphrase is required each time you open the app.
                    </p>
                    <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">No Recovery</p>
                          <p className="text-xs mt-1">
                            There is no server, no backup, and no way to recover your data if you forget this passphrase.
                            Your encrypted data will be permanently unrecoverable.
                          </p>
                        </div>
                      </div>
                    </div>
                    <form onSubmit={handleInitialize} className="space-y-3">
                      <div>
                        <label className="block text-xs font-caps text-muted mb-1">Passphrase</label>
                        <Input
                          type={initShowPassphrase ? "text" : "password"}
                          value={initPassphrase}
                          onChange={(e) => setInitPassphrase(e.target.value)}
                          placeholder="Enter passphrase (min 8 characters)"
                          required
                        />
                        <div className="flex items-center justify-end mt-1">
                          <button type="button" onClick={() => setInitShowPassphrase(!initShowPassphrase)} className="text-xs text-muted hover:text-text">
                            {initShowPassphrase ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-caps text-muted mb-1">Confirm Passphrase</label>
                        <Input
                          type={initShowPassphrase ? "text" : "password"}
                          value={initConfirmPassphrase}
                          onChange={(e) => setInitConfirmPassphrase(e.target.value)}
                          placeholder="Confirm passphrase"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-caps text-muted mb-1">Auto-lock after (minutes)</label>
                        <select
                          value={initAutoLockMinutes}
                          onChange={(e) => setInitAutoLockMinutes(Number(e.target.value))}
                          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-2 focus:outline-accent"
                        >
                          <option value="0">Never</option>
                          <option value="5">5</option>
                          <option value="15">15</option>
                          <option value="30">30</option>
                          <option value="60">60</option>
                        </select>
                      </div>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={initAcknowledged}
                          onChange={(e) => setInitAcknowledged(e.target.checked)}
                          className="mt-1 rounded border-border"
                          required
                        />
                        <span className="text-sm text-text">
                          I understand that <strong>losing this passphrase means my data is permanently unrecoverable</strong>.
                        </span>
                      </label>
                      {initError && <p className="text-sm text-danger">{initError}</p>}
                      <Button type="submit" className="w-full" disabled={!initAcknowledged}>
                        Initialize Vault
                      </Button>
                    </form>
                  </Card>
                )}

                {!isUninitialized && isUnlocked && (
                  <>
                    <Divider />
                    <Card className="p-4">
                      <h3 className="font-caps text-sm tracking-wider text-muted mb-3">Change Passphrase</h3>
                      <form onSubmit={handleChangePassphrase} className="space-y-3">
                        <div>
                          <label className="block text-xs font-caps text-muted mb-1">Current Passphrase</label>
                          <Input
                            type={showCurrent ? "text" : "password"}
                            value={currentPassphrase}
                            onChange={(e) => setCurrentPassphrase(e.target.value)}
                            placeholder="Current passphrase"
                            required
                          />
                          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-xs text-muted mt-1">
                            {showCurrent ? "Hide" : "Show"}
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs font-caps text-muted mb-1">New Passphrase</label>
                          <Input
                            type={showNew ? "text" : "password"}
                            value={newPassphrase}
                            onChange={(e) => setNewPassphrase(e.target.value)}
                            placeholder="New passphrase (min 8 characters)"
                            required
                          />
                          <button type="button" onClick={() => setShowNew(!showNew)} className="text-xs text-muted mt-1">
                            {showNew ? "Hide" : "Show"}
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs font-caps text-muted mb-1">Confirm New Passphrase</label>
                          <Input
                            type={showConfirm ? "text" : "password"}
                            value={confirmPassphrase}
                            onChange={(e) => setConfirmPassphrase(e.target.value)}
                            placeholder="Confirm new passphrase"
                            required
                          />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-xs text-muted mt-1">
                            {showConfirm ? "Hide" : "Show"}
                          </button>
                        </div>
                        {passphraseError && <p className="text-sm text-danger">{passphraseError}</p>}
                        {passphraseSuccess && <p className="text-sm text-green-400">{passphraseSuccess}</p>}
                        <Button type="submit" className="w-full">
                          Change Passphrase
                        </Button>
                      </form>
                    </Card>

                    <Divider />
                    <Card className="p-4">
                      <h3 className="font-caps text-sm tracking-wider text-muted mb-3">Auto-Lock</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-caps text-muted mb-1">Lock after minutes of inactivity</label>
                          <select
                            value={autoLockMinutes}
                            onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
                            onBlur={handleSetAutoLock}
                            className="w-full max-w-xs rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:outline-2 focus:outline-accent"
                          >
                            <option value={0}>Never (stay unlocked until manual lock)</option>
                            <option value={5}>5 minutes</option>
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                          </select>
                        </div>
                        <p className="text-xs text-muted">
                          {autoLockMinutes === 0
                            ? "Vault will remain unlocked until you manually lock it or close the tab."
                            : `Vault will automatically lock after ${autoLockMinutes} minutes of inactivity.`}
                        </p>
                      </div>
                    </Card>
                  </>
                )}

                {!isUninitialized && isLocked && (
                  <Card className="p-4 text-center">
                    <Unlock className="h-8 w-8 mx-auto text-muted mb-3" />
                    <h3 className="font-caps text-sm tracking-wider text-muted mb-2">Vault is Locked</h3>
                    <p className="text-sm text-muted mb-4">
                      Your financial data is encrypted. Unlock the vault to access your accounts and journal.
                    </p>
                    <p className="text-xs text-muted">
                      Close this tab or wait for auto-lock to secure your data.
                    </p>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <Card className="p-4">
                  <h3 className="font-caps text-sm tracking-wider text-muted mb-3">Atmosphere</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["full", "lite", "off"] as const).map((level) => (
                      <button
                        key={level}
                        onClick={() => setAtmosphereLevel(level)}
                        className={`p-4 rounded-xl border-2 transition-colors ${
                          atmosphereLevel === level
                            ? "border-accent bg-accent/10 shadow-[0_0_0_2px_var(--accent)]"
                            : "border-border bg-surface hover:border-border/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-caps text-sm text-text capitalize">
                          {atmosphereLevel === level && <Check className="h-4 w-4 text-accent" />}
                          {level}
                        </div>
                        <div className="text-xs text-muted mt-1">
                          {level === "full" && "Full fog, dust, lantern, grain"}
                          {level === "lite" && "Fog, vignette, warm light"}
                          {level === "off" && "Vignette and grain only"}
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-6">
                <Card className="p-4">
                  <h3 className="font-caps text-sm tracking-wider text-muted mb-3">Backup & Restore</h3>
                  <p className="text-sm text-muted mb-4">
                    Export an encrypted backup of all your financial data, or restore from a previous backup.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={handleExport} disabled={isLocked || isUninitialized}>
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Export Backup (JSON)
                    </Button>
                  </div>
                </Card>

                <Divider />

                <Card className="p-4">
                  <h3 className="font-caps text-sm tracking-wider text-muted mb-3">Danger Zone</h3>
                  <p className="text-sm text-muted mb-4">
                    Irreversible actions. Use with extreme caution.
                  </p>
                  <Button variant="danger" onClick={handleClearAllData} disabled={isLocked || isUninitialized}>
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Clear All Financial Data
                  </Button>
                  <p className="mt-2 text-xs text-danger">
                    This will permanently delete all accounts, journal entries, contacts, and interactions.
                  </p>
                </Card>

                <Divider />

                <Card className="p-4">
                  <h3 className="font-caps text-sm tracking-wider text-muted mb-3">App Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted">Version</dt>
                      <dd className="text-text font-mono">{import.meta.env.VITE_APP_VERSION || "0.1.0"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Build</dt>
                      <dd className="text-text font-mono">{import.meta.env.VITE_BUILD_TIME || new Date().toISOString().split("T")[0]}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Environment</dt>
                      <dd className="text-text font-mono capitalize">{import.meta.env.MODE}</dd>
                    </div>
                  </dl>
                </Card>
              </div>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}

export default SettingsPage;