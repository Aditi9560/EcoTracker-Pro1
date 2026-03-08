export interface McpServerConfig {
  name: string;
  url: string;
  apiKey: string;
  description: string;
  capabilities: string[];
  enabled: boolean;
}

export function getMcpServers(): McpServerConfig[] {
  return [
    {
      name: "weather",
      url: process.env.MCP_WEATHER_SERVER_URL || "http://localhost:3010",
      apiKey: process.env.MCP_WEATHER_API_KEY || "",
      description: "Weather data for energy usage insights and climate-aware recommendations",
      capabilities: [
        "get_current_weather",
        "get_forecast",
        "get_historical_weather",
      ],
      enabled: !!process.env.MCP_WEATHER_API_KEY,
    },
    {
      name: "maps",
      url: process.env.MCP_MAPS_SERVER_URL || "http://localhost:3011",
      apiKey: process.env.MCP_MAPS_API_KEY || "",
      description: "Transportation and routing data for travel emission calculations",
      capabilities: [
        "get_route_distance",
        "get_transit_options",
        "estimate_travel_emissions",
      ],
      enabled: !!process.env.MCP_MAPS_API_KEY,
    },
    {
      name: "news",
      url: process.env.MCP_NEWS_SERVER_URL || "http://localhost:3012",
      apiKey: process.env.MCP_NEWS_API_KEY || "",
      description: "Sustainability news and content for eco-tips and awareness",
      capabilities: [
        "get_sustainability_news",
        "get_eco_tips",
        "get_climate_updates",
      ],
      enabled: !!process.env.MCP_NEWS_API_KEY,
    },
  ];
}
