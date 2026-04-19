# MinObsidget

A minimal Obsidian plugin for embedding interactive HTML/CSS/JavaScript widgets inside notes.

This is a stripped-down version of :contentReference[oaicite:0]{index=0} without gallery and UI features.

---

## Structure

Each widget block has **4 sections** separated by `---`:

1. **HTML** – rendered inside the widget
2. **CSS** – scoped to the widget (Shadow DOM)
3. **JavaScript** – executed with access to `api`
4. **JSON state** – persisted data (optional)

---

## API

Inside the JavaScript section:

```js
const { root, getState, saveState } = api;
```

- `root` – Shadow DOM root for querying elements
- `getState()` – returns saved JSON state
- `saveState(data)` – persists state to the note
- `requestUrl` – wrapper for HTTP requests (from Obsidian)

---

## Example (counter)

````markdown
```widget
<button id="btn">0</button>
---
button { font-size: 20px; }
---
const { root, getState, saveState } = api;

const btn = root.getElementById("btn");
let state = await getState() || { count: 0 };

btn.textContent = state.count;

btn.onclick = async () => {
  state.count++;
  btn.textContent = state.count;
  await saveState(state);
};
---
{}
```
````
