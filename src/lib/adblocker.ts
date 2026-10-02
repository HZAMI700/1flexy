/**
 * Custom High-Performance AdBlocker Module
 * Prevents intrusive pop-unders, redirect traps, ad network telemetry,
 * clickjacking overlays, and dynamic ad iframe injections.
 */

export interface AdBlockStats {
  blockedPopups: number;
  blockedRequests: number;
  blockedElements: number;
  totalBlocked: number;
  lastBlockedDomain?: string;
  enabled: boolean;
}

const AD_DOMAINS: string[] = [
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google.com',
  'popads.net',
  'propellerads.com',
  'exoclick.com',
  'juicyads.com',
  'trafficjunky.net',
  'popcash.net',
  'onclickads.net',
  'adsterra.com',
  'ad-maven.com',
  'hilltopads.com',
  'clickadu.com',
  'yllix.com',
  'bidvertiser.com',
  'revenuehits.com',
  'monetag.com',
  'mgid.com',
  'taboola.com',
  'outbrain.com',
  'adnxs.com',
  'popunder',
  'adsystem',
  'trackingscript',
  'bet365',
  '1xbet',
  'melbet',
  'mostbet',
  'clicktag',
  'adnetwork',
];

const AD_SELECTORS = [
  'iframe[src*="popads"]',
  'iframe[src*="propellerads"]',
  'iframe[src*="exoclick"]',
  'iframe[src*="adsterra"]',
  'iframe[src*="clickadu"]',
  'iframe[style*="z-index: 2147483647"]',
  'div[style*="z-index: 2147483647"]:empty',
  'div[id*="ad_"]',
  'div[class*="ad_banner"]',
  'ins.adsbygoogle',
];

class AdBlockerService {
  private initialized = false;
  private stats: AdBlockStats = {
    blockedPopups: 0,
    blockedRequests: 0,
    blockedElements: 0,
    totalBlocked: 0,
    enabled: true,
  };
  private listeners: ((stats: AdBlockStats) => void)[] = [];
  private observer: MutationObserver | null = null;

  public init(): void {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    try {
      this.overrideWindowOpen();
      this.interceptFetch();
      this.interceptXHR();
      this.setupMutationObserver();
      this.blockBeforeUnloadPopups();
      this.preventClickjacking();
      console.log('🛡️ [AdBlocker] Shield activated: Pop-under & tracking suppression active.');
    } catch (err) {
      console.warn('⚠️ [AdBlocker] Error initializing shield:', err);
    }
  }

  public subscribe(listener: (stats: AdBlockStats) => void): () => void {
    this.listeners.push(listener);
    listener({ ...this.stats });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getStats(): AdBlockStats {
    return { ...this.stats };
  }

  public toggle(enabled: boolean): void {
    this.stats.enabled = enabled;
    this.notify();
  }

  private notify(lastDomain?: string): void {
    this.stats.totalBlocked =
      this.stats.blockedPopups + this.stats.blockedRequests + this.stats.blockedElements;
    if (lastDomain) {
      this.stats.lastBlockedDomain = lastDomain;
    }
    this.listeners.forEach((l) => l({ ...this.stats }));

    // Dispatch global custom event for non-react subscribers
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('adblock:stats', { detail: { ...this.stats } })
      );
    }
  }

  private isAdDomain(url: string): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return AD_DOMAINS.some((domain) => lower.includes(domain));
  }

  /**
   * 1. Override window.open to completely neuter pop-unders and pop-ups
   */
  private overrideWindowOpen(): void {
    const originalOpen = window.open;
    const self = this;

    // Replace window.open with secure proxy
    window.open = function (
      url?: string | URL,
      target?: string,
      features?: string
    ): WindowProxy | null {
      if (!self.stats.enabled) {
        return originalOpen.call(window, url, target, features);
      }

      const urlString = url ? url.toString() : '';
      console.warn(`🛡️ [AdBlocker] Blocked window.open attempt:`, urlString || 'empty');
      self.stats.blockedPopups++;
      self.notify(urlString || 'window.open pop-under');
      return null;
    };
  }

  /**
   * 2. Intercept window.fetch to block network ad requests
   */
  private interceptFetch(): void {
    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      if (!self.stats.enabled) {
        return originalFetch.call(window, input, init);
      }

      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.href
          : input.url;

      if (self.isAdDomain(url)) {
        console.warn(`🛡️ [AdBlocker] Blocked fetch request:`, url);
        self.stats.blockedRequests++;
        self.notify(url);
        // Return a benign empty response instead of failing hard
        return new Response('Blocked by VidFast AdShield', {
          status: 403,
          statusText: 'Forbidden - Ad Blocked',
        });
      }

      return originalFetch.call(window, input, init);
    };
  }

  /**
   * 3. Intercept XMLHttpRequest to block legacy ad calls
   */
  private interceptXHR(): void {
    const originalOpen = XMLHttpRequest.prototype.open;
    const self = this;

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...rest: any[]
    ): void {
      const urlString = url ? url.toString() : '';
      if (self.stats.enabled && self.isAdDomain(urlString)) {
        console.warn(`🛡️ [AdBlocker] Blocked XHR request:`, urlString);
        self.stats.blockedRequests++;
        self.notify(urlString);
        // Point to safe empty blob or inert endpoint
        return (originalOpen as any).apply(this, [method, 'data:text/plain;charset=utf-8,blocked', ...rest]);
      }

      return (originalOpen as any).apply(this, [method, url, ...rest]);
    };
  }

  /**
   * 4. MutationObserver to strip injected ad scripts, invisible overlay click-traps & ad iframes
   */
  private setupMutationObserver(): void {
    if (typeof MutationObserver === 'undefined') return;

    this.observer = new MutationObserver((mutations) => {
      if (!this.stats.enabled) return;

      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const tagName = el.tagName.toLowerCase();

            // Check if script tag targets an ad domain
            if (tagName === 'script') {
              const src = (el as HTMLScriptElement).src;
              if (this.isAdDomain(src)) {
                el.remove();
                this.stats.blockedElements++;
                this.notify(src);
                return;
              }
            }

            // Check if iframe is an ad
            if (tagName === 'iframe') {
              const src = (el as HTMLIFrameElement).src;
              if (this.isAdDomain(src)) {
                el.remove();
                this.stats.blockedElements++;
                this.notify(src);
                return;
              }
            }

            // Check for hidden transparent full-screen overlay divs used for clickjacking
            if (
              tagName === 'div' ||
              tagName === 'a'
            ) {
              const style = window.getComputedStyle(el);
              const zIndex = parseInt(style.zIndex, 10);
              const isFullscreen =
                style.position === 'fixed' &&
                el.offsetWidth >= window.innerWidth * 0.9 &&
                el.offsetHeight >= window.innerHeight * 0.9;

              // Transparent overlay with huge z-index
              if (isFullscreen && zIndex > 99999 && parseFloat(style.opacity || '1') < 0.1) {
                console.warn('🛡️ [AdBlocker] Removed transparent clickjacking overlay!');
                el.remove();
                this.stats.blockedElements++;
                this.notify('Clickjack overlay');
              }
            }
          }
        });
      }
    });

    this.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 5. Block beforeunload spam popups
   */
  private blockBeforeUnloadPopups(): void {
    window.addEventListener('beforeunload', (e) => {
      // Prevents pages from forcing confirmation dialogs that pop ads
      e.stopImmediatePropagation();
    }, true);
  }

  /**
   * 6. Clickjacking pop-under prevention
   * Ensures all external links have rel="noopener noreferrer" and intercepts sneaky click dispatches
   */
  private preventClickjacking(): void {
    document.addEventListener(
      'click',
      (e) => {
        if (!this.stats.enabled) return;

        const target = e.target as HTMLElement | null;
        if (!target) return;

        // Check if user clicked an anchor tag targeting _blank with an ad domain
        const anchor = target.closest('a');
        if (anchor) {
          const href = anchor.getAttribute('href') || '';
          if (this.isAdDomain(href)) {
            e.preventDefault();
            e.stopPropagation();
            console.warn(`🛡️ [AdBlocker] Prevented malicious link click:`, href);
            this.stats.blockedPopups++;
            this.notify(href);
            return;
          }

          if (anchor.target === '_blank') {
            anchor.rel = 'noopener noreferrer';
          }
        }
      },
      true
    );
  }
}

export const AdBlocker = new AdBlockerService();
