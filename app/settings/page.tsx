"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  Download,
  Upload,
  Trash2,
  Settings,
  User,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [backupInfo, setBackupInfo] = useState<any>(null);

  useEffect(() => {
    fetchBackupInfo();
  }, []);

  const fetchBackupInfo = async () => {
    try {
      const response = await fetch("/api/backup/info");
      if (response.ok) {
        const data = await response.json();
        setBackupInfo(data);
      }
    } catch (error) {
      console.error("Failed to fetch backup info:", error);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/backup");
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reddifit-backup-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: "success", text: "Data exported successfully!" });
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to export data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportData = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const text = await file.text();
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupData: text }),
      });

      if (!response.ok) throw new Error("Import failed");

      const result = await response.json();
      setMessage({ type: "success", text: result.message });
      fetchBackupInfo(); // Refresh backup info
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to import data. Please check your backup file.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all your data? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/backup", {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Deletion failed");

      const result = await response.json();
      setMessage({ type: "success", text: result.message });
      fetchBackupInfo(); // Refresh backup info
    } catch (error) {
      setMessage({
        type: "error",
        text: "Failed to delete data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-reddit rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">RedditFit</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900"
              >
                Pricing
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and data</p>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center">
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertTriangle className="w-5 h-5 mr-2" />
              )}
              {message.text}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Navigation */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Settings</h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="#account"
                      className="flex items-center text-gray-700 hover:text-reddit py-2 px-3 rounded-md hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Account
                    </a>
                  </li>
                  <li>
                    <a
                      href="#data"
                      className="flex items-center text-gray-700 hover:text-reddit py-2 px-3 rounded-md hover:bg-gray-50"
                    >
                      <Database className="w-4 h-4 mr-3" />
                      Data Management
                    </a>
                  </li>
                  <li>
                    <a
                      href="#privacy"
                      className="flex items-center text-gray-700 hover:text-reddit py-2 px-3 rounded-md hover:bg-gray-50"
                    >
                      <Shield className="w-4 h-4 mr-3" />
                      Privacy & Security
                    </a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Account Section */}
            <section
              id="account"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Account Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{user?.fullName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Member Since
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </section>

            {/* Data Management Section */}
            <section
              id="data"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Data Management
              </h2>

              {backupInfo && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Your Data Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Total Posts:</span>
                      <span className="ml-2 font-medium">
                        {backupInfo.totalPosts}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Rewrites:</span>
                      <span className="ml-2 font-medium">
                        {backupInfo.totalRewrites}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Average Compliance:</span>
                      <span className="ml-2 font-medium">
                        {backupInfo.averageCompliance}%
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Last Activity:</span>
                      <span className="ml-2 font-medium">
                        {backupInfo.lastBackup
                          ? new Date(backupInfo.lastBackup).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Export Your Data
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Download all your posts and account data as a JSON file.
                  </p>
                  <button
                    onClick={handleExportData}
                    disabled={loading}
                    className="btn-primary flex items-center"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Export Data
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Import Data
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Restore your data from a previously exported backup file.
                  </p>
                  <label className="btn-secondary flex items-center cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Backup
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                      disabled={loading}
                    />
                  </label>
                </div>

                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="font-semibold text-red-900 mb-2">
                    Delete All Data
                  </h3>
                  <p className="text-sm text-red-700 mb-3">
                    Permanently delete all your posts and account data. This
                    action cannot be undone.
                  </p>
                  <button
                    onClick={handleDeleteData}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Delete All Data
                  </button>
                </div>
              </div>
            </section>

            {/* Privacy & Security Section */}
            <section
              id="privacy"
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Privacy & Security
              </h2>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Data Privacy
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    We take your privacy seriously. Your data is encrypted and
                    never shared with third parties.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Your posts are stored securely and privately</li>
                    <li>• We don't share your data with advertisers</li>
                    <li>• You can export or delete your data at any time</li>
                    <li>• We comply with GDPR and other privacy regulations</li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Account Security
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Your account is protected by Clerk's enterprise-grade
                    security.
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Two-factor authentication available</li>
                    <li>• Secure password requirements</li>
                    <li>• Session management and monitoring</li>
                    <li>• Regular security audits</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
