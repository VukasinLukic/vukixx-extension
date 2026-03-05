import { createSaveButton, createInlineButton, sendToBackground } from './inject-button';

const SOURCE = 'midjourney';
const INJECTED_ATTR = 'data-vukixx-injected';

function getPromptText(): string {
  // Midjourney web uses various input elements
  const input = document.querySelector('textarea[placeholder*="prompt"]')
    || document.querySelector('textarea[placeholder*="Prompt"]')
    || document.querySelector('input[placeholder*="prompt"]')
    || document.querySelector('[contenteditable="true"]');

  if (input instanceof HTMLTextAreaElement || input instanceof HTMLInputElement) {
    return input.value.trim();
  }
  if (input instanceof HTMLElement) {
    return input.innerText?.trim() || input.textContent?.trim() || '';
  }
  return '';
}

function injectSaveButtonNearInput(): void {
  // Find prompt input area
  const inputEl = document.querySelector('textarea[placeholder*="prompt"]')
    || document.querySelector('textarea[placeholder*="Prompt"]')
    || document.querySelector('input[placeholder*="prompt"]')
    || document.querySelector('[contenteditable="true"]');

  if (!inputEl) return;

  const container = inputEl.closest('form') || inputEl.parentElement;
  if (!container || container.hasAttribute(INJECTED_ATTR)) return;
  if (container.querySelector('.vukixx-save-btn')) return;

  container.setAttribute(INJECTED_ATTR, 'true');

  const btn = createSaveButton(async () => {
    const text = getPromptText();
    if (!text) throw new Error('No prompt text found');
    await sendToBackground(text, SOURCE);
  });

  // Try to insert near submit button
  const submitBtn = container.querySelector('button[type="submit"]')
    || container.querySelector('button:last-child');
  if (submitBtn?.parentElement) {
    submitBtn.parentElement.insertBefore(btn, submitBtn);
  } else {
    container.appendChild(btn);
  }
}

function injectSaveOnGallery(): void {
  // Midjourney shows prompts on image gallery items
  const promptElements = document.querySelectorAll(
    '[class*="prompt"], [data-prompt]'
  );

  promptElements.forEach((el) => {
    if (el.hasAttribute(INJECTED_ATTR)) return;
    el.setAttribute(INJECTED_ATTR, 'true');

    const text = el.getAttribute('data-prompt') || el.textContent?.trim() || '';
    if (!text) return;

    const btn = createInlineButton(async () => {
      await sendToBackground(text, SOURCE);
    });
    el.appendChild(btn);
  });
}

function init(): void {
  injectSaveButtonNearInput();
  injectSaveOnGallery();

  const observer = new MutationObserver(() => {
    injectSaveButtonNearInput();
    injectSaveOnGallery();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
