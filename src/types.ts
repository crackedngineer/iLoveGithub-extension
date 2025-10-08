export interface AnalyticsData {
  toolName: string;
  repo: { owner: string; repo: string };
  timestamp: number;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  branch: string;
}

export interface Tool {
  name: string;
  url: string;
  description: string;
  icon: string;
}

export interface CreateElementOptions {
  id?: string;
  className?: string;
  innerHTML?: string;
  title?: string;
  "aria-label"?: string;
  [key: string]: string | undefined;
}

export interface ToolsApiResponse {
  success: boolean;
  data: Tool[];
}
