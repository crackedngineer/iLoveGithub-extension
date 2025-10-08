import { ToolsApiResponse } from "./types";
import { fetchTools } from "./utils";

class BackgroundService {
  constructor() {
    this.init();
  }

  private init(): void {

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Handle extension icon click
    // chrome.action.onClicked.addListener((tab) => {
    //   this.handleActionClick(tab);
    // });

    // Handle installation
    chrome.runtime.onInstalled.addListener(() => {
      this.handleInstallation();
    });
  }

  private handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): void {
    switch (message.type) {
      case "FETCH_TOOLS":
        this.handleFetchTools({
          owner: message.data.owner,
          repo: message.data.repo,
          branch: message.data.branch,
        })
          .then((tools: ToolsApiResponse) =>
            sendResponse({ success: true, data: tools })
          )
          .catch((error: Error) =>
            sendResponse({ success: false, error: error.message })
          );
        break;

      default:
        sendResponse({ success: false, error: "Unknown message type" });
    }
  }

  private async handleFetchTools(data: {
    owner: string;
    repo: string;
    branch: string;
  }): Promise<any> {
    return await fetchTools(data.owner, data.repo, data.branch);
  }

  // private handleActionClick(tab: chrome.tabs.Tab): void {
  //   if (tab.url?.includes("github.com")) {
  //     chrome.tabs.sendMessage(tab.id!, {type: "TOGGLE_OVERLAY"});
  //   } else {
  //     // If not on GitHub, open GitHub
  //     chrome.tabs.create({url: "https://github.com"});
  //   }
  // }

  private handleInstallation(): void {
    // Set up default storage
    // chrome.storage.local.set({
    //   analytics: [],
    //   settings: {
    //     autoShow: true,
    //     defaultTools: ["uithub", "github1s", "gitpod"],
    //   },
    // });
    // Show welcome message
    // chrome.tabs.create({
    //   url: chrome.runtime.getURL("welcome.html"),
    // });
  }
}

// Initialize background service
new BackgroundService();
