import { createSaveButton, createInlineButton, sendToBackground } from './inject-button';

const SOURCE = 'gemini';
const INJECTED_ATTR = 'data-vukixx-injected';

function getPromptText(): string {
  // Gemini uses a rich text editor (Quill-based or contenteditable)
  const editor = document.querySelector('.ql-editor[contenteditable="true"]') as HTMLElement | null;
  if (editor) {
    return editor.innerText?.trim() || '';
  }
  // Fallback: look for the main input area
  const richInput = document.querySelector('rich-textarea .ql-editor')
    || document.querySelector('[contenteditable="true"][aria-label*="prompt" i]')
    || document.querySelector('[contenteditable="true"][role="textbox"]');
  if (richInput instanceof HTMLElement) {
    return richInput.innerText?.trim() || '';
  }
  return '';
}

function injectSaveButtonNearInput(): void {
  // Find the input container
  const editorEl = document.querySelector('.ql-editor[contenteditable="true"]')
    || document.querySelector('rich-textarea')
    || document.querySelector('[contenteditable="true"][role="textbox"]');

  if (!editorEl) return;

  const container = editorEl.closest('form')
    || editorEl.closest('[class*="input-area"]')
    || editorEl.parentElement?.parentElement;

  if (!container || container.hasAttribute(INJECTED_ATTR)) return;
  if (container.querySelector('.vukixx-save-btn')) return;

  container.setAttribute(INJECTED_ATTR, 'true');

  const btn = createSaveButton(async () => {
    const text = getPromptText();
    if (!text) throw new Error('No prompt text found');
    await sendToBackground(text, SOURCE);
  });

  // Find send button area
  const sendBtn = container.querySelector('button[aria-label*="Send" i]')
    || container.querySelector('button.send-button')
    || container.querySelector('button[mattooltip*="Send" i]');

  if (sendBtn?.parentElement) {
    btn.style.marginRight = '4px';
    sendBtn.parentElement.insertBefore(btn, sendBtn);
  } else {
    container.appendChild(btn);
  }
}

function injectSaveOnMessages(): void {
  // Gemini conversation — user messages
  const userMessages = document.querySelectorAll(
    'message-content[class*="user"], .user-query, [data-message-author="user"]'
  );

  userMessages.forEach((msg) => {
    const container = msg.closest('.conversation-turn') || msg.parentElement;
    if (!container || container.hasAttribute(INJECTED_ATTR)) return;
    container.setAttribute(INJECTED_ATTR, 'true');

    const text = msg.textContent?.trim() || '';
    if (!text) return;

    const btn = createInlineButton(async () => {
      await sendToBackground(text, SOURCE);
    });

    msg.appendChild(btn);
  });
}

function init(): void {
  injectSaveButtonNearInput();
  injectSaveOnMessages();

  const observer = new MutationObserver(() => {
    injectSaveButtonNearInput();
    injectSaveOnMessages();
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
