import React from 'react';
import {createRoot} from 'react-dom/client';
import {Toolbar} from 'react-aria-components/Toolbar';
import {Button} from 'react-aria-components/Button';
import {getInteractionModality} from 'react-aria/private/interactions/useFocusVisible';
import provenance from './provenance.json';

const kind = new URLSearchParams(location.search).get('controls') === 'native' ? 'native' : 'rac';
const title = `${provenance.variant === 'before' ? 'Before' : 'After'} fix · ${kind === 'native' ? 'HTML buttons' : 'React Aria buttons'}`;
document.title = `${title} | Toolbar focus`;

const events: object[] = [];
const activated: string[] = [];
const elementName = (element: EventTarget | null) => element instanceof HTMLElement ? element.id || element.tagName : null;

function updateFocus() {
  const display = document.getElementById('current-focus');
  if (display) display.textContent = elementName(document.activeElement) || 'None';
}

for (const type of ['keydown', 'keyup', 'pointerdown', 'pointerup', 'click', 'focusin', 'focusout']) {
  document.addEventListener(type, event => {
    const input = event as KeyboardEvent & PointerEvent;
    events.push({
      event: type, target: elementName(event.target), key: input.key,
      detail: input.detail, pointerType: input.pointerType, trusted: event.isTrusted,
      modality: getInteractionModality(), focused: elementName(document.activeElement)
    });
    if (events.length > 500) events.shift();
    if (type === 'focusin' || type === 'focusout') queueMicrotask(updateFocus);
  });
}

(window as any).toolbarCheck = {
  read: () => ({
    version: provenance.variant, kind, commit: provenance.commit,
    focused: elementName(document.activeElement), modality: getInteractionModality(),
    activated: [...activated], events: [...events]
  })
};

function activate(label: string) {
  activated.push(label);
  const display = document.getElementById('last-activated');
  if (display) display.textContent = label;
}

function App() {
  return <main>
    <header>
      <p className="eyebrow">React Spectrum · Toolbar</p>
      <h1>{title}</h1>
      <p>Remember a button, leave the toolbar, then return to a different button.</p>
    </header>

    <section className="demo" aria-label="Focus test">
      <button id="before" onClick={() => activate('Before')}>Before</button>
      <Toolbar aria-label="Text formatting">
        {['First', 'Second', 'Third'].map(label => kind === 'native'
          ? <button key={label} id={label.toLowerCase()} onClick={() => activate(label)}>{label}</button>
          : <Button key={label} id={label.toLowerCase()} onPress={() => activate(label)}>{label}</Button>)}
      </Toolbar>
      <button id="after" onClick={() => activate('After')}>After</button>
    </section>

    <dl className="diagnostics" aria-live="off">
      <div><dt>Current focus</dt><dd id="current-focus">None</dd></div>
      <div><dt>Last activated</dt><dd id="last-activated">None</dd></div>
    </dl>

    <section className="instructions" aria-labelledby="mouse-title">
      <h2 id="mouse-title">Mouse & keyboard</h2>
      <ol>
        <li>Click <strong>Before</strong>, press <kbd>Tab</kbd>, <kbd>→</kbd>, then <kbd>Tab</kbd>. Focus is now on After; Second is remembered.</li>
        <li>Click <strong>First</strong>. Before the fix, focus moves to Second. After the fix, it stays on First.</li>
        <li>Click <strong>After</strong>, then press <kbd>Shift + Tab</kbd>. Focus returns to the last focused toolbar button.</li>
      </ol>
      <h2>NVDA browse mode</h2>
      <ol>
        <li>Reload. Click <strong>Before</strong>, then press <kbd>Tab</kbd>, <kbd>→</kbd>, <kbd>Tab</kbd> in focus mode.</li>
        <li>Switch to browse mode with <kbd>NVDA + Space</kbd>. Press <kbd>Shift + B</kbd> three times to read Third, Second, First.</li>
        <li>Press <kbd>Enter</kbd> immediately. Check the activated button, final focus and NVDA announcement.</li>
      </ol>
      <p>Complete the sequence without switching tabs or apps. Virtual reading position and DOM focus can differ before activation.</p>
    </section>

    <footer>
      <p>Source: <a href={provenance.sourceUrl}>{provenance.repository}</a> at <a href={provenance.commitUrl}><code>{provenance.commit}</code></a></p>
      <nav aria-label="Reproduction links">
        <a href="../">All four examples</a>
        <a href="https://github.com/adobe/react-spectrum/pull/10938">PR #10938</a>
        <a href="./provenance.json">Build provenance</a>
        <a href="../licenses/">Licenses</a>
      </nav>
    </footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
