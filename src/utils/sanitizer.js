/**
 * Zero-Sink DOM Sanitizer para ClimaTrack
 * Cumplimiento estricto con AiAppFactory Engine #255
 */
export const Sanitizer = {
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  sanitizeURL(url) {
    if (!url) return '';
    const clean = String(url).trim();
    if (
      clean.startsWith('http://') ||
      clean.startsWith('https://') ||
      clean.startsWith('data:image/') ||
      clean.startsWith('/') ||
      clean.startsWith('#')
    ) {
      return clean;
    }
    return '#unsafe-url-blocked';
  },

  safeSetInnerHTML(element, rawHTML) {
    if (!element) return;
    if (typeof DOMParser === 'undefined') {
      element.textContent = rawHTML;
      return;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHTML, 'text/html');
    
    // Purga de elementos scripts, iframes o handlers on*
    doc.querySelectorAll('script, iframe, object, embed').forEach(el => el.remove());
    doc.querySelectorAll('*').forEach(el => {
      for (let i = el.attributes.length - 1; i >= 0; i--) {
        const attr = el.attributes[i];
        if (attr.name.toLowerCase().startsWith('on') || attr.value.toLowerCase().includes('javascript:')) {
          el.removeAttribute(attr.name);
        }
      }
    });

    element.replaceChildren(...Array.from(doc.body.childNodes));
  }
};
