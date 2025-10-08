import {
  getBranchFromDOM,
  getBranchFromUrl,
  getRepoInfo,
  isRepoPage,
} from "./helpers";
import { RepoInfo, Tool } from "./types";
import { loadTools } from "./utils";

class WebIdeExtension {
  private hasPackageJson = false;
  private tools: Tool[] = [];
  private repoInfo: RepoInfo | null = null;

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
    try {
      this.hasPackageJson = this.checkPackageJson();
      // check if on a repo page
      if (isRepoPage() === false) {
        console.error("Not a repository page. Exiting.");
        return;
      }
      const info = getRepoInfo();
      if (!info) {
        console.error("Failed to extract repository info. Exiting.");
        return;
      }
      this.repoInfo = {
        ...info,
        branch: getBranchFromUrl() || getBranchFromDOM(),
      };

      this.tools = await loadTools(this.repoInfo);

      this.addGitHubSelectMenu();
      this.setupNavigationHandler();
    } catch (error) {
      console.error("Failed to initialize Web IDE extension:", error);
    }
  }

  private checkPackageJson(): boolean {
    // Simple check for package.json - can be enhanced
    return document.querySelector('[title="package.json"]') !== null;
  }

  private filterItems(item: Tool): boolean {
    // Only filter StackBlitz if no package.json
    if (item.name === "stackblitz" && !this.hasPackageJson) {
      return false;
    }
    return true;
  }

  private addGitHubSelectMenu(index: number = 1): void {
    const selectors = [
      ".OverviewContent-module__Box_6--wV7Tw",
      ".CodeViewHeader-module__Box_7--FZfkg .d-flex.gap-2",
      ".prc-Stack-Stack-WJVsK .d-flex.gap-2",
    ];

    const menuElement = document.querySelector(selectors.join(", "));
    if (!menuElement || menuElement.querySelector("#open-in-web-ide")) {
      return;
    }

    const filteredItems = this.tools.filter((item) => this.filterItems(item));
    if (filteredItems.length === 0) return;

    const detailsElement = this.createDropdownElement(filteredItems);

    // Insert at specific index
    const children = Array.from(menuElement.children);

    if (index < 0 || index >= children.length) {
      // If index is out of bounds, append to end
      menuElement.appendChild(detailsElement);
    } else {
      // Insert before the child at the specified index
      menuElement.insertBefore(detailsElement, children[index]);
    }
  }

  private createDropdownElement(items: Tool[]): HTMLDetailsElement {
    const detailsElement = document.createElement("details");
    detailsElement.id = "open-in-web-ide";
    detailsElement.className =
      "details-overlay details-reset position-relative d-flex web-ide-dropdown";

    detailsElement.innerHTML = `
      <summary role="button" type="button" class="btn text-center">
        <span class="d-none d-xl-flex flex-items-center gap-[0.5rem]">
          <img 
            src="https://aa3d4bqalqflkq22.public.blob.vercel-storage.com/images/icons/symbol.png" 
            alt="iLoveGithub Tools" 
            class="web-ide-dropdown-icon" 
          />
          Open Tools
          <span class="dropdown-caret ml-2"></span>
        </span>
        <span class="d-inline-block d-xl-none">
          <img 
            src="https://aa3d4bqalqflkq22.public.blob.vercel-storage.com/images/icons/symbol.png" 
            alt="iLoveGithub Tools" 
            class="web-ide-dropdown-icon" 
          />
          <span class="dropdown-caret d-none d-sm-inline-block d-md-none d-lg-inline-block"></span>
        </span>
      </summary>
      <div class="web-ide-dropdown-panel">
        <div class="web-ide-search-container">
          <input 
            type="text" 
            class="web-ide-search-input" 
            placeholder="Search Tools..."
            autocomplete="off"
          />
          <svg class="web-ide-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
        <ul class="web-ide-items-list">
          ${this.renderItems(items)}
        </ul>
        <div class="tools-footer">
          <span class="tools-footer-span">Powered by <a href="https://ilovegithub.oderna.in" target="_blank" style="color: #0366d6; text-decoration: none;">iLoveGitHub</a> ❤️</span>
        </div>
      </div>
    `;

    this.setupDropdownEventListeners(detailsElement, items);
    return detailsElement;
  }

  private renderItems(items: Tool[]): string {
    return items
      .map(
        (item, index) => `
      <li class="web-ide-item data-index="${index}" data-name="${item.name}">
        <a href="${item.url}" 
           class="web-ide-item-link" 
           target="_blank" 
           rel="noopener noreferrer"
           title="${item.name}">
          <img src="${
            item?.icon ??
            "https://aa3d4bqalqflkq22.public.blob.vercel-storage.com/brain.png"
          }" class="tool-icon" alt="${item.name}" />
          <span class="web-ide-item-title">${item.name}</span>
        </a>
      </li>
    `
      )
      .join("");
  }

  private setupDropdownEventListeners(
    detailsElement: HTMLDetailsElement,
    items: Tool[]
  ): void {
    const searchInput = detailsElement.querySelector(
      ".web-ide-search-input"
    ) as HTMLInputElement;
    const itemsList = detailsElement.querySelector(
      ".web-ide-items-list"
    ) as HTMLElement;
    let filteredItems = [...items];
    let highlightedIndex = -1;

    // Auto-focus search when dropdown opens
    detailsElement.addEventListener("toggle", () => {
      if (detailsElement.open) {
        setTimeout(() => searchInput?.focus(), 50);
      } else {
        this.resetSearch();
      }
    });

    // Search functionality
    searchInput?.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase().trim();
      filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(query)
      );

      this.updateItemsList(itemsList, filteredItems);
      highlightedIndex = filteredItems.length > 0 ? 0 : -1;
      this.updateHighlight(itemsList, highlightedIndex);
    });

    // Keyboard navigation
    searchInput?.addEventListener("keydown", (e) => {
      const visibleItems = itemsList.querySelectorAll(
        '.web-ide-item:not([style*="display: none"])'
      );

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          highlightedIndex = Math.min(
            highlightedIndex + 1,
            visibleItems.length - 1
          );
          this.updateHighlight(itemsList, highlightedIndex);
          break;

        case "ArrowUp":
          e.preventDefault();
          highlightedIndex = Math.max(highlightedIndex - 1, 0);
          this.updateHighlight(itemsList, highlightedIndex);
          break;

        case "Enter":
          e.preventDefault();
          if (highlightedIndex >= 0 && visibleItems[highlightedIndex]) {
            const link = visibleItems[highlightedIndex].querySelector(
              "a"
            ) as HTMLAnchorElement;
            link?.click();
            detailsElement.open = false;
          }
          break;

        case "Escape":
          detailsElement.open = false;
          break;
      }
    });

    // Click outside to close
    document.addEventListener("click", (e) => {
      if (!detailsElement.contains(e.target as Node)) {
        detailsElement.open = false;
      }
    });

    const resetSearch = () => {
      searchInput.value = "";
      filteredItems = [...items];
      this.updateItemsList(itemsList, filteredItems);
      highlightedIndex = 0;
      this.updateHighlight(itemsList, highlightedIndex);
    };

    this.resetSearch = resetSearch;
  }

  private resetSearch(): void {
    // Will be overridden in setupDropdownEventListeners
  }

  private updateItemsList(itemsList: HTMLElement, items: Tool[]): void {
    const allItems = itemsList.querySelectorAll(".web-ide-item");

    allItems.forEach((item, index) => {
      const itemName = item.getAttribute("data-name");
      const shouldShow = items.some(
        (filteredItem) => filteredItem.name === itemName
      );
      (item as HTMLElement).style.display = shouldShow ? "block" : "none";
    });
  }

  private updateHighlight(itemsList: HTMLElement, index: number): void {
    const visibleItems = itemsList.querySelectorAll(
      '.web-ide-item:not([style*="display: none"])'
    );

    visibleItems.forEach((item, i) => {
      item.classList.toggle("highlighted", i === index);
    });

    // Scroll highlighted item into view
    if (index >= 0 && visibleItems[index]) {
      (visibleItems[index] as HTMLElement).scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }

  private setupNavigationHandler(): void {
    // GitHub soft navigation
    document.addEventListener("soft-nav:end", () => {
      this.handleNavigation();
    });

    // Fallback for URL changes
    let currentUrl = location.href;
    const checkUrl = () => {
      if (location.href !== currentUrl) {
        currentUrl = location.href;
        this.handleNavigation();
      }
    };

    setInterval(checkUrl, 1000);
  }

  private handleNavigation(): void {
    // Remove existing dropdown
    document.getElementById("open-in-web-ide")?.remove();

    this.hasPackageJson = this.checkPackageJson();

    // Small delay to ensure DOM is ready
    setTimeout(() => this.addGitHubSelectMenu(), 100);
  }
}

// Initialize extension
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new WebIdeExtension());
} else {
  new WebIdeExtension();
}
