import { useEffect, useState } from "react";
import { Cloud, MapPin, Newspaper, CheckCircle, XCircle } from "lucide-react";
import { getDataSources } from "../api/client";
import type { McpServerStatus } from "../types";

const SERVER_ICONS: Record<string, typeof Cloud> = {
  weather: Cloud,
  maps: MapPin,
  news: Newspaper,
};

const SERVER_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  weather: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  maps: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
  news: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
};

export default function DataSources() {
  const [sources, setSources] = useState<McpServerStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDataSources();
        setSources(data);
      } catch (err) {
        console.error("Failed to load data sources:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Sources</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          MCP server integrations for enriched data
        </p>
      </div>

      {/* Overview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          About MCP Integration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          EcoTracker Pro uses the Model Context Protocol (MCP) to connect with external data sources.
          Configure API keys in your backend <code className="text-eco-600 dark:text-eco-400">.env</code> file
          to enable each data source. When enabled, these servers provide real-time data to enhance
          your carbon tracking experience.
        </p>
      </div>

      {/* Server Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sources.map((source) => {
          const Icon = SERVER_ICONS[source.name] ?? Cloud;
          const colors = SERVER_COLORS[source.name] ?? SERVER_COLORS.weather!;

          return (
            <div
              key={source.name}
              className={`card border-2 ${source.enabled ? colors.border : "border-gray-200 dark:border-gray-700"}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  {source.enabled ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-eco-500" />
                      <span className="text-xs font-medium text-eco-600 dark:text-eco-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400">Not configured</span>
                    </>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 dark:text-white capitalize mb-1">
                {source.name} Server
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {source.description}
              </p>

              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Capabilities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {source.capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {!source.enabled && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Set <code className="text-eco-600 dark:text-eco-400">MCP_{source.name.toUpperCase()}_API_KEY</code> in
                    your .env file to enable.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Setup Guide */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Setup Guide
        </h3>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <p className="font-medium text-gray-900 dark:text-white mb-1">1. Get API Keys</p>
            <p>Sign up for the respective services and obtain API keys for each data source you want to use.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white mb-1">2. Configure Environment</p>
            <p>Add your API keys to the <code className="text-eco-600">.env</code> file in the backend directory.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white mb-1">3. Start MCP Servers</p>
            <p>Run the respective MCP server processes. Each server should be accessible at the configured URL.</p>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white mb-1">4. Restart Backend</p>
            <p>Restart the EcoTracker backend to pick up the new configuration.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
