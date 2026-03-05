import { createSaveButton, createInlineButton, sendToBackground } from './inject-button';

const SOURCE = 'claude';
const INJECTED_ATTR = 'data-vukixx-injected';

function getPromptText(): string {
  // Claude uses a ProseMirror contenteditable div
  const editor = document.querySelector('.ProseMirror[contenteditable="true"]') as HTMLElement | null;
  if (editor) {
    return editor.innerText?.trim() || editor.textContent?.trim() || '';
  }
  // Fallback: look for any contenteditable in the input area
  const ce = document.querySelector('[contenteditable="true"]') as HTMLElement | null;
  return ce?.innerText?.trim() || '';
}

function injectSaveButtonNearInput(): void {
  // Find the input area container
  const editorContainer = document.querySelector('.ProseMirror[contenteditable="true"]')?.closest('fieldset')
    || document.querySelector('.ProseMirror[contenteditable="true"]')?.closest('div[class*="input"]')
    || document.querySelector('.ProseMirror[contenteditable="true"]')?.parentElement?.parentElement;

  if (!editorContainer || editorContainer.hasAttribute(INJECTED_ATTR)) return;

  // Find the send button
  const sendButton = editorContainer.querySelector('button[aria-label="Send Message"]')
    || editorContainer.querySelector('button[type="submit"]')
    || document.querySelector('button[aria-label="Send Message"]');

  const insertTarget = sendButton?.parentElement || editorContainer;
  if (insertTarget.querySelector('.vukixx-save-btn')) return;

  editorContainer.setAttribute(INJECTED_ATTR, 'true');

  const btn = createSaveButton(async () => {
    const text = getPromptText();
    if (!text) throw new Error('No prompt text found');
    await sendToBackground(text, SOURCE);
  });

  btn.style.marginRight = '4px';
  if (sendButton) {
    sendButton.parentElement!.insertBefore(btn, sendButton);
  } else {
    insertTarget.appendChild(btn);
  }
}

function injectSaveOnMessages(): void {
  // Claude user messages — look for human turn containers
  const userMessages = document.querySelectorAll(
    '[data-testid="human-turn"], .font-user-message'
  );

  userMessages.forEach((msg) => {
    if (msg.hasAttribute(INJECTED_ATTR)) return;
    msg.setAttribute(INJECTED_ATTR, 'true');

    const text = msg.textContent?.trim() || '';
    if (!text) return;

    const btn = createInlineButton(async () => {
      await sendToBackground(text, SOURCE);
    });

    // Look for an actions area or append
    const wrapper = msg.querySelector('.flex') || msg;
    wrapper.appendChild(btn);
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
