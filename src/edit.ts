import "./edit.css";
import { CodeEditorElement } from "./features/code-editor/code-editor-element";

CodeEditorElement.define();

const sourceEditor = document.querySelector<CodeEditorElement>("#source-editor")!;
const promptEditor = document.querySelector<CodeEditorElement>("#prompt-editor")!;

sourceEditor.addEventListener("run", () => console.log("Run prompt editor content:", sourceEditor.value));
promptEditor.addEventListener("run", () => console.log("Run prompt editor content:", promptEditor.value));
