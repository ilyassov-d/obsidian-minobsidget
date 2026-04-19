"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WidgetPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var WidgetPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.compiledWidgetScriptCache = /* @__PURE__ */ new Map();
    this.compiledEventHandlerCache = /* @__PURE__ */ new Map();
  }
  async onload() {
    this.registerMarkdownCodeBlockProcessor("widget", async (source, el, ctx) => {
      const sections = this.splitOnDelimiters(source, 3);
      const htmlContent = (sections[0] || "").trim();
      const cssContent = sections[1] || "";
      const jsContent = sections[2] || "";
      let inlineDataStr = (sections[3] || "").trim();
      const sectionInfo = ctx.getSectionInfo(el);
      const lineStart = sectionInfo?.lineStart || 0;
      const filePath = ctx.sourcePath;
      const instanceId = `${filePath.replace(/\//g, "_")}__line${lineStart}`;
      const container = el.createDiv({ cls: "widget-instance-container" });
      container.addEventListener("dblclick", (e) => e.stopPropagation());
      const shadow = container.attachShadow({ mode: "open" });
      const style = document.createElement("style");
      style.textContent = `
                :host {
                    display: block;
                    position: relative;
                    width: 100%;
                    padding: 4px;
                    box-sizing: border-box;
                }
                ${cssContent}
            `;
      shadow.appendChild(style);
      const innerDiv = document.createElement("div");
      innerDiv.innerHTML = htmlContent + "<slot></slot>";
      shadow.appendChild(innerDiv);
      let saveTimeout = null;
      const api = {
        root: shadow,
        instanceId,
        requestUrl: import_obsidian.requestUrl,
        saveState: async (data) => {
          const section = ctx.getSectionInfo(el);
          if (!section) return;
          const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
          if (!(file instanceof import_obsidian.TFile)) return;
          const newDataStr = JSON.stringify(data, null, 2);
          if (saveTimeout) {
            window.clearTimeout(saveTimeout);
          }
          saveTimeout = window.setTimeout(async () => {
            try {
              await this.app.vault.process(file, (oldContent) => {
                const target = this.findWidgetBlockByLineStart(oldContent, section.lineStart);
                if (!target) return oldContent;
                const blockSections = this.splitOnDelimiters(target.blockContent, 3);
                const first = (blockSections[0] || "").trim();
                const css = blockSections[1] || "";
                const js = blockSections[2] || "";
                const currentDataStr = (blockSections[3] || "").trim();
                if (currentDataStr === newDataStr) return oldContent;
                const rebuilt = [
                  first,
                  css.trim(),
                  js.trim(),
                  newDataStr
                ].join("\n---\n");
                const newBlock = `\`\`\`widget
${rebuilt}
\`\`\``;
                return oldContent.slice(0, target.start) + newBlock + oldContent.slice(target.end);
              });
              inlineDataStr = newDataStr;
            } catch (e) {
              console.error("Widget saveState failed:", e);
            }
          }, 300);
        },
        getState: async () => {
          if (!inlineDataStr || inlineDataStr === "{}") return null;
          try {
            return JSON.parse(inlineDataStr);
          } catch {
            return null;
          }
        }
      };
      try {
        const widgetContext = {};
        const apiProxy = new Proxy(api, {
          get(target, prop) {
            if (prop in widgetContext) return widgetContext[prop];
            if (prop in target) return target[prop];
            return window[prop];
          },
          set(target, prop, value) {
            widgetContext[prop] = value;
            target[prop] = value;
            return true;
          }
        });
        const scriptFunction = this.getCompiledWidgetScript(jsContent);
        scriptFunction(apiProxy);
        this.bindEvents(shadow, apiProxy);
      } catch (e) {
        console.error("Widget JS Error:", e);
      }
    });
  }
  splitOnDelimiters(content, maxSplits = 3) {
    const lines = content.split("\n");
    const sections = [];
    let currentSection = [];
    let splitCount = 0;
    for (const line of lines) {
      if (line.trim() === "---" && splitCount < maxSplits) {
        sections.push(currentSection.join("\n"));
        currentSection = [];
        splitCount++;
      } else {
        currentSection.push(line);
      }
    }
    sections.push(currentSection.join("\n"));
    return sections;
  }
  findWidgetBlockByLineStart(oldContent, lineStart) {
    const widgetRegex = /```widget\n([\s\S]*?)```/g;
    let match;
    let currentLine = 0;
    let previousIndex = 0;
    while ((match = widgetRegex.exec(oldContent)) !== null) {
      for (let i = previousIndex; i < match.index; i++) {
        if (oldContent.charCodeAt(i) === 10) currentLine++;
      }
      previousIndex = match.index;
      if (currentLine === lineStart) {
        return {
          fullMatch: match[0],
          blockContent: match[1],
          start: match.index,
          end: match.index + match[0].length
        };
      }
    }
    return null;
  }
  getCompiledWidgetScript(jsContent) {
    let cached = this.compiledWidgetScriptCache.get(jsContent);
    if (cached) return cached;
    const functionNames = [];
    const functionRegex = /(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
    let match;
    while ((match = functionRegex.exec(jsContent)) !== null) {
      if (match[1] !== "init") functionNames.push(match[1]);
    }
    if (/function\s+init\s*\(/.test(jsContent)) {
      functionNames.push("init");
    }
    const functionExports = functionNames.map((name) => `if (typeof ${name} === 'function') api.${name} = ${name};`).join("\n");
    const wrappedScript = `
            ${jsContent}
            try {
                ${functionExports}
            } catch (e) {
                console.error('Function export error:', e);
            }
        `;
    cached = new Function("api", `with(api) { ${wrappedScript} }`);
    this.compiledWidgetScriptCache.set(jsContent, cached);
    return cached;
  }
  getCompiledEventHandler(eventName, code) {
    const cacheKey = `${eventName}::${code}`;
    let cached = this.compiledEventHandlerCache.get(cacheKey);
    if (cached) return cached;
    cached = new Function("api", "event", `with(api) { ${code} }`);
    this.compiledEventHandlerCache.set(cacheKey, cached);
    return cached;
  }
  bindEvents(root, apiProxy) {
    const elements = root.querySelectorAll("*");
    elements.forEach((el) => {
      const htmlEl = el;
      const attrs = htmlEl.attributes;
      if (!attrs || attrs.length === 0) return;
      const toRemove = [];
      for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i];
        if (!attr.name.startsWith("on") || attr.name === "on") continue;
        const eventName = attr.name.substring(2);
        const code = attr.value;
        let eventFunc;
        try {
          eventFunc = this.getCompiledEventHandler(eventName, code);
        } catch (err) {
          console.error(`Error compiling widget event [${eventName}]:`, err);
          continue;
        }
        el.addEventListener(eventName, (e) => {
          try {
            eventFunc(apiProxy, e);
          } catch (err) {
            console.error(`Error in widget event [${eventName}]:`, err);
          }
        });
        toRemove.push(attr.name);
      }
      for (const attrName of toRemove) {
        htmlEl.removeAttribute(attrName);
        htmlEl[attrName] = null;
      }
    });
  }
};
