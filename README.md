# MinObsidGet

A minimal version of ObsidGet focused on one thing:

> Run HTML / CSS / JavaScript widgets directly inside Obsidian notes, without gallery features.

This version removes:
- GitHub sync
- Remote gallery
- Self-update logic
- Web/demo components
- 

and keeps only:

---

## ✨ Features

- Execute HTML / CSS / JS inside notes
- Isolated widget rendering (Shadow DOM)
- Inline state saving (`saveState`)
- Local widget templates (no remote dependency)
- Lightweight and deterministic

---

## 📦 Installation (Manual)

1. Go to your vault:
- .obsidian/plugins/


2. Create a folder:
- obsidian-minobsidget


3. Copy these files:
- `main.js`
- `manifest.json`
- `styles.css`

4. Restart Obsidian

5. Enable plugin in Settings 

---

## 🛠 Development

```bash
npm install
npm run build
```

Output:
```
main.js
```

---

## 📜 License

This project is a fork of ObsidGet.

---