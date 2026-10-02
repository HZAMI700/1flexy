/**
 * Player Overlay Killer (Fix-001)
 *
 * Targets and neutralizes transparent overlay click-catchers stacked
 * above embedded video players (VidFast / vixcloud) that trigger pop-under ads.
 * Reference: tizenbrew-streamingcommunityz-tv technique.
 */

export interface OverlayKillerSession {
  cleanup: () => void;
}

export function killPlayerOverlays(container: HTMLElement): number {
  if (!container) return 0;
  let removedCount = 0;

  try {
    const iframe = container.querySelector('iframe');
    const iframeRect = iframe ? iframe.getBoundingClientRect() : container.getBoundingClientRect();

    // Query potential overlay candidates within and directly adjacent to the container
    const candidates = Array.from(
      container.querySelectorAll<HTMLElement>('div, a, span, button, iframe:not([title])')
    );

    // Also check parent/sibling click-traps
    const parent = container.parentElement;
    if (parent) {
      const siblingLinks = Array.from(
        parent.querySelectorAll<HTMLAnchorElement>('a[target="_blank"], a[href^="http"]')
      );
      for (const link of siblingLinks) {
        if (!container.contains(link)) {
          const rect = link.getBoundingClientRect();
          if (
            rect.width > 100 &&
            rect.height > 100 &&
            Math.abs(rect.top - iframeRect.top) < 100
          ) {
            link.style.display = 'none';
            link.style.pointerEvents = 'none';
            link.remove();
            removedCount++;
          }
        }
      }
    }

    for (const el of candidates) {
      if (el === iframe) continue;

      const style = window.getComputedStyle(el);
      const isPositioned = style.position === 'absolute' || style.position === 'fixed';
      const zIndex = parseInt(style.zIndex, 10) || 0;
      const opacity = parseFloat(style.opacity);
      const isTransparentBg =
        style.backgroundColor === 'transparent' ||
        style.backgroundColor === 'rgba(0, 0, 0, 0)' ||
        opacity < 0.15;
      const hasPointerEvents = style.pointerEvents !== 'none';

      // Check anchor targets that open in new window
      const isBlankAnchor =
        el.tagName === 'A' && (el as HTMLAnchorElement).target === '_blank';

      const rect = el.getBoundingClientRect();

      // Check if candidate overlaps the player iframe significantly (> 60%)
      const horizontalOverlap =
        Math.max(0, Math.min(rect.right, iframeRect.right) - Math.max(rect.left, iframeRect.left));
      const verticalOverlap =
        Math.max(0, Math.min(rect.bottom, iframeRect.bottom) - Math.max(rect.top, iframeRect.top));
      const overlapArea = horizontalOverlap * verticalOverlap;
      const iframeArea = iframeRect.width * iframeRect.height;
      const overlapRatio = iframeArea > 0 ? overlapArea / iframeArea : 0;

      // Identify click-catchers:
      // 1) Positioned over player with high z-index and transparent background/opacity
      // 2) Anchor with target="_blank" stretched over the player
      // 3) Invisible div or iframe with high z-index and pointer-events active
      const isClickCatcher =
        isPositioned &&
        (zIndex >= 10 || isBlankAnchor) &&
        hasPointerEvents &&
        (isTransparentBg || isBlankAnchor) &&
        (overlapRatio > 0.5 || rect.width >= iframeRect.width * 0.7);

      if (isClickCatcher) {
        el.style.pointerEvents = 'none';
        el.style.display = 'none';
        try {
          el.remove();
        } catch {
          // Fallback if node cannot be unmounted
        }
        removedCount++;
      }
    }
  } catch (err) {
    console.debug('[OverlayKiller] Error checking overlays:', err);
  }

  return removedCount;
}

/**
 * Monitors the player container for dynamically injected click-catcher overlays
 * and terminates them on the spot.
 */
export function watchForOverlayInjection(container: HTMLElement): OverlayKillerSession {
  if (!container || typeof window === 'undefined') {
    return { cleanup: () => {} };
  }

  // 1. Initial cleanup
  killPlayerOverlays(container);

  // 2. Click & Pointerdown Interceptors (Capture phase): blocks any target=_blank, popunder or overlay click
  const interceptPopunderEvent = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    // Check if target is an overlay click trap or external anchor
    const anchor = target.closest('a');
    if (anchor) {
      const isBlank = anchor.target === '_blank' || anchor.getAttribute('target') === '_blank';
      const href = anchor.href || anchor.getAttribute('href') || '';
      const isExternal = href && !href.startsWith('/') && !href.startsWith(window.location.origin);
      if (isBlank || isExternal) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.warn('🛡️ [OverlayKiller] Neutralized popunder event on anchor:', href);
        anchor.remove();
        return;
      }
    }

    // Check if clicking an invisible overlay placed above the player
    const iframe = container.querySelector('iframe');
    if (iframe && target !== iframe && !container.querySelector('button')?.contains(target)) {
      const style = window.getComputedStyle(target);
      if (style.position === 'absolute' || style.position === 'fixed') {
        const opacity = parseFloat(style.opacity);
        if (style.backgroundColor === 'transparent' || opacity < 0.2 || style.zIndex !== 'auto') {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.warn('🛡️ [OverlayKiller] Destroyed transparent click trap overlay element');
          target.remove();
        }
      }
    }
  };

  container.addEventListener('click', interceptPopunderEvent, true);
  container.addEventListener('pointerdown', interceptPopunderEvent, true);
  container.addEventListener('mousedown', interceptPopunderEvent, true);

  // 3. MutationObserver watching for re-injected DOM nodes
  let observer: MutationObserver | null = null;
  try {
    observer = new MutationObserver((mutations) => {
      let shouldKill = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldKill = true;
          break;
        }
      }
      if (shouldKill) {
        killPlayerOverlays(container);
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'z-index'],
    });

    if (container.parentElement) {
      observer.observe(container.parentElement, {
        childList: true,
      });
    }
  } catch (err) {
    console.debug('[OverlayKiller] Observer init error:', err);
  }

  // 4. Safety polling intervals (re-run every 1.5s for 15s to cover delayed ad script injection)
  let runs = 0;
  const interval = setInterval(() => {
    runs++;
    killPlayerOverlays(container);
    if (runs >= 10) {
      clearInterval(interval);
    }
  }, 1500);

  // 5. Try patching cross-origin iframe contentWindow if accessible
  try {
    const iframe = container.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      try {
        (iframe.contentWindow as any).open = function () {
          console.debug('[OverlayKiller] Blocked iframe window.open');
          return null;
        };
      } catch {
        // Cross-origin restriction expected
      }
    }
  } catch {
    // Ignore
  }

  return {
    cleanup: () => {
      container.removeEventListener('click', interceptPopunderEvent, true);
      container.removeEventListener('pointerdown', interceptPopunderEvent, true);
      container.removeEventListener('mousedown', interceptPopunderEvent, true);
      if (observer) {
        observer.disconnect();
      }
      clearInterval(interval);
    },
  };
}
