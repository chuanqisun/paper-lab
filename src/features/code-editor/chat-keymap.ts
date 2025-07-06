import { type KeyBinding } from "@codemirror/view";

export interface CommandEventDetails {
  command: string;
}

export const chatKeymap = () =>
  [
    {
      key: "Mod-Enter",
      run: (view) => {
        view.dom.dispatchEvent(new CustomEvent("run", { detail: view.state.doc.toString(), bubbles: true }));
        return true;
      },
    },
    {
      key: "Escape",
      run: (view) => {
        // if there is selection, collapse to head
        if (!view.state.selection.main.empty) return false;
        view.dom.dispatchEvent(new Event("escape", { bubbles: true }));
        return true;
      },
    },
  ] as KeyBinding[];
