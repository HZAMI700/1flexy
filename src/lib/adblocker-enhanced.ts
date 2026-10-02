/**
 * VidFast Pro Enhanced AdBlocker & Popunder Remover (v2.0.0)
 * Inspired by VidFast Pro Adblocker & Popunder Remover (Greasy Fork / Minoa)
 * 
 * Provides multilayer defense:
 * 1. Global window.open neutralization (blocks pop-unders originating from embedded players)
 * 2. Click interception on iframe boundaries and anchor tags
 * 3. Pop-under and telemetry domain blocklist filtering
 * 4. beforeunload & unload capture-phase popup suppression
 * 5. iframe contentWindow sandbox proxying
 * 6. MutationObserver stripping of dynamic scripts, hidden iframes, and high z-index overlays
 * 7. Service Worker network-level filtering
 */

export interface AdBlockStats {
  blockedPopups: number;
  blockedRequests: number;
  blockedElements: number;
  totalBlocked: number;
  lastBlockedDomain?: string;
  enabled: boolean;
}

const AD_DOMAINS = [
  'popads.net',
  'popcash.net',
  'propellerads.com',
  'onclickads.net',
  'adcash.com',
  'exoclick.com',
  'juicyads.com',
  'trafficjunky.net',
  'adsterra.com',
  'hilltopads.net',
  'clickadu.com',
  'mgid.com',
  'revcontent.com',
  'taboola.com',
  'outbrain.com',
  'doubleclick.net',
  'googlesyndication.com',
  'adservice.google.com',
  'ad-maven.com',
  'yllix.com',
  'bidvertiser.com',
  'revenuehits.com',
  'monetag.com',
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

class EnhancedAdBlockerService {
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
  private iframeObserver: MutationObserver | null = null;

  public init(): void {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    try {
      this.blockWindowOpen();
      this.blockAdDomains();
      this.observePopups();
      this.blockBeforeUnload();
      this.interceptIframeClicks();
      this.registerServiceWorker();
      console.log('🛡️ [AdBlocker Enhanced v2.0] Active: Advanced Pop-under Shield engaged.');
    } catch (err) {
      console.warn('⚠️ [AdBlocker] Shield initialization notice:', err);
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

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('adblock:stats', { detail: { ...this.stats } })
      );
    }
  }

  private isAdUrl(url: string | URL | null | undefined): boolean {
    if (!url) return false;
    const lower = url.toString().toLowerCase();
    return AD_DOMAINS.some((domain) => lower.includes(domain));
  }

  /**
   * 1. Global window.open override
   * Intercepts all window.open calls and blocks them unless same-origin user navigation
   */
  private blockWindowOpen(): void {
    const originalOpen = window.open;
    const self = this;

    window.open = function (
      url?: string | URL,
      name?: string,
      features?: string
    ): WindowProxy | null {
      if (!self.stats.enabled) {
        return originalOpen.call(window, url, name, features);
      }

      const urlString = url ? url.toString() : '';
      const isAd = self.isAdUrl(url) || features?.toLowerCase().includes('popunder');

      // Check if same origin safe navigation
      let isSameOrigin = false;
      try {
        if (urlString && (urlString.startsWith('/') || urlString.startsWith(window.location.origin))) {
          isSameOrigin = true;
        }
      } catch (e) {
        isSameOrigin = false;
      }

      // Strictly block any external/cross-origin window.open call (Zero pop-unders)
      if (!url || isAd || !isSameOrigin) {
        console.warn('🛡️ [AdBlocker] Neutralized popunder window.open attempt:', urlString || 'blank');
        self.stats.blockedPopups++;
        self.notify(urlString || 'popunder');
        return null;
      }

      return originalOpen.call(window, url, name, features);
    };
  }

  /**
   * 2. Block Ad Domains in fetch and XHR
   */
  private blockAdDomains(): void {
    const originalFetch = window.fetch;
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const self = this;

    window.fetch = async function (...args: Parameters<typeof fetch>): Promise<Response> {
      if (!self.stats.enabled) {
        return originalFetch.apply(this, args);
      }

      const url = args[0]?.toString() || '';
      if (self.isAdUrl(url)) {
        console.warn('🛡️ [AdBlocker] Blocked fetch:', url);
        self.stats.blockedRequests++;
        self.notify(url);
        return new Response('', { status: 204, statusText: 'Blocked by VidFast AdShield' });
      }

      return originalFetch.apply(this, args);
    };

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      ...rest: any[]
    ): void {
      const urlString = url ? url.toString() : '';
      if (self.stats.enabled && self.isAdUrl(urlString)) {
        console.warn('🛡️ [AdBlocker] Blocked XHR:', urlString);
        self.stats.blockedRequests++;
        self.notify(urlString);
        return (originalXHROpen as any).apply(this, [method, 'data:text/plain;charset=utf-8,blocked', ...rest]);
      }

      return (originalXHROpen as any).apply(this, [method, url, ...rest]);
    };
  }

  /**
   * 3. Observe Popups and dynamic DOM injections (MutationObserver)
   */
  private observePopups(): void {
    if (typeof MutationObserver === 'undefined') return;

    this.observer = new MutationObserver((mutations) => {
      if (!this.stats.enabled) return;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();

          if (tagName === 'script' && (el as HTMLScriptElement).src) {
            const src = (el as HTMLScriptElement).src;
            if (this.isAdUrl(src)) {
              el.remove();
              this.stats.blockedElements++;
              this.notify(src);
              return;
            }
          }

          if (tagName === 'iframe' && (el as HTMLIFrameElement).src) {
            const src = (el as HTMLIFrameElement).src;
            if (this.isAdUrl(src)) {
              el.remove();
              this.stats.blockedElements++;
              this.notify(src);
              return;
            }
          }

          if (tagName === 'div' || tagName === 'a') {
            const style = window.getComputedStyle(el);
            const zIndex = parseInt(style.zIndex, 10);
            if (style.position === 'fixed' && zIndex > 9999) {
              const text = (el.innerText || '').toLowerCase();
              if (text.includes('ad') || text.includes('sponsored') || parseFloat(style.opacity || '1') < 0.1) {
                el.remove();
                this.stats.blockedElements++;
                this.notify('Overlay trap');
              }
            }
          }
        });
      });
    });

    this.observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * 4. Block beforeunload and unload exit popups
   */
  private blockBeforeUnload(): void {
    window.addEventListener(
      'beforeunload',
      (e) => {
        e.stopImmediatePropagation();
      },
      { capture: true }
    );

    window.addEventListener(
      'unload',
      (e) => {
        e.stopImmediatePropagation();
      },
      { capture: true }
    );
  }

  /**
   * 5. Intercept clickjacking & iframe window.open
   */
  private interceptIframeClicks(): void {
    // Prevent synthetic programmatic click() calls on dynamically created anchor elements
    try {
      const origAnchorClick = HTMLAnchorElement.prototype.click;
      const self = this;
      HTMLAnchorElement.prototype.click = function () {
        const href = this.href || this.getAttribute('href') || '';
        const isExternal =
          href &&
          !href.startsWith('/') &&
          !href.startsWith(window.location.origin) &&
          !href.startsWith('#');
        if (isExternal && !this.hasAttribute('download') && !this.getAttribute('data-allowed')) {
          console.warn('🛡️ [AdBlocker] Blocked synthetic anchor click popunder:', href);
          self.stats.blockedPopups++;
          self.notify(href);
          return;
        }
        return origAnchorClick.call(this);
      };
    } catch {
      // Ignore if prototype is locked
    }

    // Intercept clicks on links targeting _blank without safe noopener
    document.addEventListener(
      'click',
      (e) => {
        if (!this.stats.enabled) return;
        const target = (e.target as HTMLElement)?.closest('a');
        if (target) {
          const href = target.getAttribute('href') || '';
          if (this.isAdUrl(href)) {
            e.preventDefault();
            e.stopPropagation();
            console.warn('🛡️ [AdBlocker] Blocked clickjacking popunder to:', href);
            this.stats.blockedPopups++;
            this.notify(href);
            return;
          }

          if (target.target === '_blank' && target.rel !== 'noopener') {
            target.rel = 'noopener noreferrer';
          }
        }
      },
      true
    );

    // Periodically monitor iframe contentWindow to proxy attempted window.open
    const patchIframes = () => {
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach((iframe) => {
        try {
          const cw = iframe.contentWindow;
          if (cw && !(cw as any).__adblock_patched) {
            const originalIframeOpen = cw.open;
            cw.open = function (...args: any[]) {
              console.warn('🛡️ [AdBlocker] Blocked iframe contentWindow.open');
              return null;
            };
            (cw as any).__adblock_patched = true;
          }
        } catch (e) {
          // Cross-origin restriction is normal and secure
        }
      });
    };

    if (typeof MutationObserver !== 'undefined') {
      this.iframeObserver = new MutationObserver(() => patchIframes());
      this.iframeObserver.observe(document.documentElement || document.body, {
        childList: true,
        subtree: true,
      });
    }

    // Interval check for lazy-loaded iframes
    setInterval(patchIframes, 2000);
  }

  /**
   * 6. Register service worker for network-level adblocking
   */
  private registerServiceWorker(): void {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw-adblock.js')
        .then(() => console.log('🛡️ [AdBlocker] Service worker registered successfully.'))
        .catch((err) => console.log('🛡️ [AdBlocker] Service worker status:', err?.message || 'skipped'));
    }
  }
}

export const AdBlocker = new EnhancedAdBlockerService();
export function initAdBlocker() {
  AdBlocker.init();
}
