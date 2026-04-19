# MinObsidget

A minimal Obsidian plugin for embedding interactive HTML/CSS/JavaScript widgets inside notes.

This is a stripped-down version of the [original repo](https://github.com/infinition/obsidian-obsidget) without gallery and UI features. 

---

## Structure

Each widget block has **4 sections** separated by `---`:

1. **HTML** – rendered inside the widget
2. **CSS** – scoped to the widget (Shadow DOM)
3. **JavaScript** – executed with access to `api`
4. **JSON state** – persisted data (optional)

---

## Installation

- Download the latest release from the [Releases page]().
- Extract `obsidian-obsidget.zip` into your vault's `.obsidian/plugins/` folder.
- Reload Obsidian and enable MinObsidGet.

---

## Example: Click Counter

````markdown
```widget
<button id="btn">0</button>
---
button { font-size: 20px; }
---
const { root, getState, saveState } = api;

async function init() {
  const btn = root.getElementById("btn");
  let state = await getState() || { count: 0 };

  btn.textContent = state.count;

  btn.onclick = async () => {
    state.count++;
    btn.textContent = state.count;
    await saveState(state);
  };
}

init();
---
{
  "count": 0
}
```
````
