import {
  IS_DEVELOPMENT,
  EXCLUDED_GITHUB_PATHS,
  DEFAULT_BRANCH,
} from "./constants";

/**
 * Debug logging utility
 */
export function debugLog(...args: any[]): void {
  if (IS_DEVELOPMENT) {
    console.log("[GitHub Tools]", ...args);
  }
}

/**
 * Check if current page is a repository page
 */
export function isRepoPage(): boolean {
  const path = window.location.pathname;
  const pathParts = path.split("/").filter((part) => part.length > 0);

  if (pathParts.length >= 2) {
    return !EXCLUDED_GITHUB_PATHS.includes(
      pathParts[0] as (typeof EXCLUDED_GITHUB_PATHS)[number]
    );
  }
  return false;
}

/**
 * Extract repository information from URL
 */
export function getRepoInfo(): { owner: string; repo: string } | null {
  const path = window.location.pathname;
  const pathParts = path.split("/").filter((part) => part.length > 0);

  if (pathParts.length >= 2) {
    return {
      owner: pathParts[0],
      repo: pathParts[1],
    };
  }
  return null;
}

export function getBranchFromUrl(): string | null {
  const pathname = window.location.pathname;

  // Extract: /owner/repo/tree/BRANCH_NAME/optional/file/path
  const parts = pathname.split("/");
  const treeIndex = parts.indexOf("tree");

  if (treeIndex !== -1 && treeIndex + 1 < parts.length) {
    // Everything between 'tree' and known GitHub sections
    const knownSections = [
      "blob",
      "commits",
      "actions",
      "issues",
      "pull",
      "wiki",
    ];
    const branchParts = [];

    for (let i = treeIndex + 1; i < parts.length; i++) {
      if (knownSections.includes(parts[i]) || parts[i].includes("?")) {
        break;
      }
      branchParts.push(parts[i]);
    }

    if (branchParts.length > 0) {
      return decodeURIComponent(branchParts.join("/"));
    }
    return null;
  }
  return null;
}

export function getBranchFromDOM(): string {
  const branchSelector = document.querySelector(
    "#ref-picker-repos-header-ref-selector > span > span.prc-Button-Label-pTQ3x > div > div.ref-selector-button-text-container.RefSelectorAnchoredOverlay-module__RefSelectorBtnTextContainer--yO402 > span"
  );

  const branchText = branchSelector?.textContent?.trim();
  return branchText || DEFAULT_BRANCH;
}
