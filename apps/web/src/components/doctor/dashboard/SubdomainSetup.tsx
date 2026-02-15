"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SubdomainSetupProps {
  doctorId: string;
  currentSubdomain: string | null;
  isEnabled: boolean;
  lang: string;
}

export function SubdomainSetup({
  doctorId,
  currentSubdomain,
  isEnabled,
  lang,
}: SubdomainSetupProps) {
  const router = useRouter();
  const [subdomain, setSubdomain] = useState(currentSubdomain || "");
  const [enabled, setEnabled] = useState(isEnabled);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validate subdomain format
  const validateSubdomain = (value: string): string | null => {
    if (!value) return null;
    if (value.length < 3) return "Subdomain must be at least 3 characters";
    if (value.length > 30) return "Subdomain must be at most 30 characters";
    if (!/^[a-z0-9-]+$/.test(value)) return "Only lowercase letters, numbers, and hyphens allowed";
    if (value.startsWith("-") || value.endsWith("-")) return "Cannot start or end with hyphen";
    if (value.includes("--")) return "Cannot contain consecutive hyphens";
    return null;
  };

  // Check availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!subdomain || subdomain === currentSubdomain) {
        setAvailable(null);
        return;
      }

      const validationError = validateSubdomain(subdomain);
      if (validationError) {
        setError(validationError);
        setAvailable(null);
        return;
      }

      setError(null);
      setChecking(true);

      try {
        const response = await fetch(`/api/doctor/subdomain/check?subdomain=${subdomain}`);
        const data = await response.json();
        setAvailable(data.available);
        if (!data.available) {
          setError("This subdomain is already taken");
        }
      } catch (err) {
        console.error("Error checking subdomain:", err);
        setError("Failed to check availability");
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    };

    const debounce = setTimeout(checkAvailability, 500);
    return () => clearTimeout(debounce);
  }, [subdomain, currentSubdomain]);

  const handleSave = async () => {
    if (!subdomain) {
      setError("Please enter a subdomain");
      return;
    }

    const validationError = validateSubdomain(subdomain);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (subdomain !== currentSubdomain && available === false) {
      setError("This subdomain is not available");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/doctor/subdomain/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain, enabled }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update subdomain");
      }

      setSuccessMessage("Subdomain updated successfully!");
      router.refresh();

      // Redirect to the new subdomain after a brief delay
      if (enabled) {
        setTimeout(() => {
          window.open(`https://${subdomain}.doctorsewa.org`, "_blank");
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update subdomain");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (!currentSubdomain) {
      setError("Please set a subdomain first");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/doctor/subdomain/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: currentSubdomain, enabled: !enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle subdomain");
      }

      setEnabled(!enabled);
      setSuccessMessage(`Subdomain ${!enabled ? "enabled" : "disabled"} successfully!`);
      router.refresh();
    } catch (err) {
      setError("Failed to toggle subdomain");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = subdomain !== currentSubdomain || enabled !== isEnabled;

  return (
    <div className="space-y-6">
      {/* Current Subdomain Status */}
      {currentSubdomain && (
        <div className="p-4 bg-foreground/5 border-2 border-black/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-foreground/70">Current Subdomain</div>
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`px-3 py-1 text-sm font-bold border-2 border-black transition-colors ${
                enabled
                  ? "bg-verified text-white"
                  : "bg-foreground/10"
              }`}
            >
              {enabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <div className="font-mono text-lg font-bold">
            {currentSubdomain}.doctorsewa.org
          </div>
          {enabled && (
            <a
              href={`https://${currentSubdomain}.doctorsewa.org`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-blue hover:underline text-sm mt-2 inline-block"
            >
              Visit your website →
            </a>
          )}
        </div>
      )}

      {/* Subdomain Input */}
      <div>
        <label className="block text-sm font-bold text-foreground mb-2">
          {currentSubdomain ? "Change Subdomain" : "Choose Subdomain"}
        </label>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
            placeholder="yourname"
            className="flex-1 px-4 py-2 border-2 border-black font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary-blue"
            disabled={saving}
          />
          <span className="font-mono text-lg text-foreground/70">.doctorsewa.org</span>
        </div>

        {/* Validation Messages */}
        {checking && (
          <div className="text-sm text-foreground/60">Checking availability...</div>
        )}
        {!checking && available === true && subdomain !== currentSubdomain && (
          <div className="text-sm text-verified font-medium">✓ Available!</div>
        )}
        {!checking && available === false && (
          <div className="text-sm text-red-600 font-medium">✗ {error || "Not available"}</div>
        )}
        {!checking && error && available === null && (
          <div className="text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Enable/Disable Toggle */}
      {subdomain && (
        <div className="flex items-center gap-3 p-4 border-2 border-black/10">
          <input
            type="checkbox"
            id="enable-subdomain"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 border-2 border-black"
            disabled={saving}
          />
          <label htmlFor="enable-subdomain" className="font-medium cursor-pointer">
            Enable subdomain (make website publicly accessible)
          </label>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-verified/10 border-2 border-verified text-verified font-medium">
          {successMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges || (subdomain !== currentSubdomain && available !== true)}
          className={`px-6 py-3 font-bold border-2 border-black transition-all ${
            saving || !hasChanges || (subdomain !== currentSubdomain && available !== true)
              ? "bg-foreground/10 text-foreground/50 cursor-not-allowed"
              : "bg-primary-blue text-white hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#121212]"
          }`}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        {hasChanges && (
          <button
            onClick={() => {
              setSubdomain(currentSubdomain || "");
              setEnabled(isEnabled);
              setError(null);
              setSuccessMessage(null);
            }}
            className="px-6 py-3 font-bold border-2 border-black hover:bg-foreground/5 transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Warning for changes */}
      {currentSubdomain && subdomain !== currentSubdomain && (
        <div className="p-4 bg-yellow-50 border-2 border-yellow-500">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <div className="font-bold text-yellow-800 mb-1">Warning: Changing Your Subdomain</div>
              <div className="text-sm text-yellow-700">
                Changing your subdomain will affect:
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>All existing links to your website will break</li>
                  <li>Search engine rankings may be affected</li>
                  <li>Patients who bookmarked your site will need the new URL</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
