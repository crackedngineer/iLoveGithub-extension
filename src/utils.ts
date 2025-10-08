import { RepoInfo, Tool, CreateElementOptions } from "./types";
import { BASE_URL, MESSAGE_TYPES } from "./constants";
import { debugLog } from "./helpers";

export async function fetchTools(owner: string, repo: string, branch: string) {
  const response = await fetch(
    BASE_URL + `/api/tools?owner=${owner}&repo=${repo}&branch=${branch}`
  );

  if (response.status !== 200) {
    throw new Error("Failed to fetch tools");
  }

  const data = (await response.json()) as any[];
  return data.map((item) => ({
    name: item.name,
    description: item.description,
    icon: item.icon,
    url: item.url,
  })) as Tool[];
}

/**
 * Load tools from extension storage or return defaults
 */
export async function loadTools(repoInfo: RepoInfo | null): Promise<Tool[]> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.FETCH_TOOLS,
      data: repoInfo,
    });

    const tools = response?.data || [];
    debugLog("Tools loaded:", tools.length);
    return tools;
  } catch (error) {
    debugLog("Error loading tools:", error);
    return [];
  }
}

/**
 * Create DOM element with specified attributes
 */
export function createElement(
  tagName: string,
  attributes: CreateElementOptions = {}
): HTMLElement {
  const element = document.createElement(tagName);

  Object.entries(attributes).forEach(([key, value]) => {
    if (!value) return;

    if (key === "className") {
      element.className = value;
    } else if (key === "innerHTML") {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  });

  return element;
}
