const VUKIXX_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 1L2 4.5V11.5L8 15L14 11.5V4.5L8 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M8 5V11M5 8H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

const CHECK_ICON_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function createSaveButton(onSave: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'vukixx-save-btn';
  btn.title = 'Save to Vukixxx';
  btn.innerHTML = `<span class="vukixx-save-btn__icon">${VUKIXX_ICON_SVG}</span><span class="vukixx-save-btn__label">Save</span>`;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    btn.classList.add('vukixx-saving');
    btn.innerHTML = `<span class="vukixx-save-btn__icon vukixx-spin">${VUKIXX_ICON_SVG}</span><span class="vukixx-save-btn__label">Saving...</span>`;

    try {
      await onSave();
      btn.classList.remove('vukixx-saving');
      btn.classList.add('vukixx-saved');
      btn.innerHTML = `<span class="vukixx-save-btn__icon">${CHECK_ICON_SVG}</span><span class="vukixx-save-btn__label">Saved!</span>`;
      setTimeout(() => {
        btn.classList.remove('vukixx-saved');
        btn.innerHTML = `<span class="vukixx-save-btn__icon">${VUKIXX_ICON_SVG}</span><span class="vukixx-save-btn__label">Save</span>`;
      }, 2000);
    } catch {
      btn.classList.remove('vukixx-saving');
      btn.classList.add('vukixx-error');
      btn.innerHTML = `<span class="vukixx-save-btn__icon">${VUKIXX_ICON_SVG}</span><span class="vukixx-save-btn__label">Error</span>`;
      setTimeout(() => {
        btn.classList.remove('vukixx-error');
        btn.innerHTML = `<span class="vukixx-save-btn__icon">${VUKIXX_ICON_SVG}</span><span class="vukixx-save-btn__label">Save</span>`;
      }, 2000);
    }
  });

  return btn;
}

export function createInlineButton(onSave: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'vukixx-inline-btn';
  btn.title = 'Save to Vukixxx';
  btn.innerHTML = VUKIXX_ICON_SVG;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    btn.classList.add('vukixx-saving');
    try {
      await onSave();
      btn.classList.remove('vukixx-saving');
      btn.classList.add('vukixx-saved');
      btn.innerHTML = CHECK_ICON_SVG;
      setTimeout(() => {
        btn.classList.remove('vukixx-saved');
        btn.innerHTML = VUKIXX_ICON_SVG;
      }, 2000);
    } catch {
      btn.classList.remove('vukixx-saving');
      btn.classList.add('vukixx-error');
      setTimeout(() => {
        btn.classList.remove('vukixx-error');
      }, 2000);
    }
  });

  return btn;
}

export function sendToBackground(text: string, source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'SAVE_PROMPT',
        payload: {
          text,
          source,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      },
      (response) => {
        if (response?.success) {
          resolve();
        } else {
          reject(new Error(response?.error ?? 'Failed to save'));
        }
      }
    );
  });
}
