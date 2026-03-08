import { getMcpServers, McpServerConfig } from "./config";

interface McpRequest {
  method: string;
  params?: Record<string, unknown>;
}

interface McpResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

class McpClient {
  private servers: McpServerConfig[];

  constructor() {
    this.servers = getMcpServers();
  }

  getServerStatus(): Array<{ name: string; enabled: boolean; description: string; capabilities: string[] }> {
    return this.servers.map((s) => ({
      name: s.name,
      enabled: s.enabled,
      description: s.description,
      capabilities: s.capabilities,
    }));
  }

  private getServer(name: string): McpServerConfig | undefined {
    return this.servers.find((s) => s.name === name);
  }

  async callServer<T = unknown>(
    serverName: string,
    request: McpRequest
  ): Promise<McpResponse<T>> {
    const server = this.getServer(serverName);

    if (!server) {
      return { success: false, error: `Server '${serverName}' not found` };
    }

    if (!server.enabled) {
      return {
        success: false,
        error: `Server '${serverName}' is not enabled. Configure its API key in .env`,
      };
    }

    try {
      const response = await fetch(`${server.url}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${server.apiKey}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Server responded with status ${response.status}`,
        };
      }

      const data = (await response.json()) as T;
      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Failed to connect to ${serverName} server: ${message}`,
      };
    }
  }

  // Weather server helpers
  async getWeather(location: string) {
    return this.callServer("weather", {
      method: "get_current_weather",
      params: { location },
    });
  }

  async getWeatherForecast(location: string, days: number = 7) {
    return this.callServer("weather", {
      method: "get_forecast",
      params: { location, days },
    });
  }

  // Maps server helpers
  async getRouteDistance(origin: string, destination: string, mode: string = "driving") {
    return this.callServer("maps", {
      method: "get_route_distance",
      params: { origin, destination, mode },
    });
  }

  async estimateTravelEmissions(origin: string, destination: string, mode: string) {
    return this.callServer("maps", {
      method: "estimate_travel_emissions",
      params: { origin, destination, mode },
    });
  }

  // News server helpers
  async getSustainabilityNews(limit: number = 10) {
    return this.callServer("news", {
      method: "get_sustainability_news",
      params: { limit },
    });
  }

  async getEcoTips(category?: string) {
    return this.callServer("news", {
      method: "get_eco_tips",
      params: { category },
    });
  }
}

export const mcpClient = new McpClient();
