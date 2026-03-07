import { createSaveButton, createInlineButton, sendToBackground } from './inject-button';

const SOURCE = 'chatgpt';
const INJECTED_ATTR = 'data-vukixx-injected';

function getPromptText(): string {
  // ChatGPT uses #prompt-textarea or a contenteditable div
  const textarea = document.querySelector('#prompt-textarea') as HTMLElement | null;
  if (textarea) {
    // It's a contenteditable div in newer ChatGPT
    return textarea.innerText?.trim() || textarea.textContent?.trim() || '';
  }
  return '';
}

function injectSaveButtonNearInput(): void {
  // Find the form/input container
  const form = document.querySelector('form[class*="stretch"]') || document.querySelector('main form');
  if (!form || form.hasAttribute(INJECTED_ATTR)) return;

  // Find the button row (where the send button lives)
  const sendButton = form.querySelector('button[data-testid="send-button"]')
    || form.querySelector('button[aria-label="Send"]')
    || form.querySelector('button[class*="send"]');

  if (!sendButton?.parentElement) return;

  form.setAttribute(INJECTED_ATTR, 'true');

  const btn = createSaveButton(async () => {
    const text = getPromptText();
    if (!text) throw new Error('No prompt text found');
    await sendToBackground(text, SOURCE);
  });

  btn.style.marginRight = '4px';
  sendButton.parentElement.insertBefore(btn, sendButton);
}

function injectSaveOnMessages(): void {
  // Add save buttons to user messages in conversation
  const userMessages = document.querySelectorAll(
    '[data-message-author-role="user"]'
  );

  userMessages.forEach((msg) => {
    const container = msg.closest('[data-testid^="conversation-turn"]') || msg.parentElement;
    if (!container || container.hasAttribute(INJECTED_ATTR)) return;
    container.setAttribute(INJECTED_ATTR, 'true');

    const textEl = msg.querySelector('.whitespace-pre-wrap') || msg;
    const text = textEl.textContent?.trim() || '';
    if (!text) return;

    const btn = createInlineButton(async () => {
      await sendToBackground(text, SOURCE);
    });

    // Insert the button in the message actions area or append to message
    const actionsBar = container.querySelector('.flex.items-center.justify-start')
      || container.querySelector('[class*="actions"]');
    if (actionsBar) {
      actionsBar.appendChild(btn);
    } else {
      msg.appendChild(btn);
    }
  });
}

function init(): void {
  // Initial injection
  injectSaveButtonNearInput();
  injectSaveOnMessages();

  // Debounce to avoid excessive calls
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Observe DOM changes (SPA navigation, new messages)
  const observer = new MutationObserver(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      injectSaveButtonNearInput();
      injectSaveOnMessages();
    }, 100); // Wait 100ms after last change
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Wait for DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
