# MinObsidGet

A minimal Obsidian plugin for embedding interactive HTML/CSS/JavaScript widgets directly inside notes using ```widget``` code blocks.

This project is a stripped-down version of the original [Obsidget](https://github.com/infinition/obsidian-obsidget), with all non-essential features removed.

---

## Features

- Inline widgets using HTML, CSS, and JavaScript
- Shadow DOM isolation
- Persistent state via JSON
- No UI overhead

---

## Usage

Create a code block with language `widget`:

---

### Example: Click Counter

````markdown
```widget
<!-- HTML block -->
<button id="btn">0</button>
---
/* CSS block */
button { font-size: 20px; }
---
// JS block
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
  "_comment": "JSON state block",
  "count": 0
}
```
````
(for other interesting use cases check out the original repository)

---

## Structure

Each widget block consists of **4 sections** separated by `---`:

1. **HTML** – rendered inside the widget  
2. **CSS** – scoped via Shadow DOM  
3. **JavaScript** – executed with access to `api`  
4. **JSON state** – persisted data (optional)  

---

## API

Inside the JavaScript section:

```js
const { root, getState, saveState } = api;
```

- `root` → Shadow DOM root  
- `getState()` → load saved state  
- `saveState(data)` → persist state  

---

## Installation

- Download from the [Releases page](https://github.com/ilyassov-d/obsidian-minobsidget/releases)
- Extract into `.obsidian/plugins/`
- Enable the plugin in Obsidian
