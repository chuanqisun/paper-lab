import { render } from "lit-html";
import { BehaviorSubject, map, scan, Subject, tap } from "rxjs";
import { CodeEditorElement } from "./features/code-editor/code-editor-element";
import { pickFileEffect, uploadFilesReducer } from "./features/file-uploader";
import { getStoredApiKey } from "./features/markdown-editor";
import { debug } from "./lib/debug";
import { html } from "./lib/html";
import { reducerPipe, tapPipe } from "./lib/reducer-pipe";
import "./style.css";
import type { Command, State } from "./types";

CodeEditorElement.define();

export const command$ = new Subject<Command>();
const initialState: State = {
  files: [],
  openaiApiKey: getStoredApiKey(),
};
export const state$ = new BehaviorSubject<State>(initialState);

const sdk = {
  new: () => command$.next({ newFile: true }),
  upload: () => command$.next({ pickFile: true }),
};

// Effects
render(html`${ExplorerView(state$)}`, document.querySelector<HTMLElement>("#explorer")!);

command$
  .pipe(
    tap(tapPipe([debug("command"), pickFileEffect])),
    scan(reducerPipe([uploadFilesReducer]), initialState),
    tap(debug("state")),
  )
  .subscribe(state$);

function ExplorerView(state$: BehaviorSubject<State>) {
  return html` ${state$.pipe(map((state) => state.files.map((file) => html`<div>${file.name}</div>`)))} `;
}

const composerEditor = document.querySelector<CodeEditorElement>("#composer")!;
composerEditor.addEventListener("run", async (event) => {
  const detail = (event as CustomEvent<string>).detail;
  const runnableFunciton = new Function("$", detail);

  try {
    await runnableFunciton(sdk);
  } catch (error) {
    console.error("Error running code:", error);
  }
});
