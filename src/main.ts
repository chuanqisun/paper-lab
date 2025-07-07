import { render } from "lit-html";

import { BehaviorSubject, map, scan, Subject, tap } from "rxjs";
import { CodeEditorElement } from "./features/code-editor/code-editor-element";
import { activeFileReducer, FileUploader } from "./features/file-uploader";
import { getStoredApiKey, MarkdownEditor } from "./features/markdown-editor";
import { debug } from "./lib/debug";
import { html } from "./lib/html";
import { reducerPipe } from "./lib/reducer-pipe";
import "./style.css";
import type { Intent, State } from "./types";

CodeEditorElement.define();

export const intent$ = new Subject<Intent>();

const initialState: State = {
  openaiApiKey: getStoredApiKey(),
};

export const state$ = new BehaviorSubject<State>(initialState);

intent$
  .pipe(tap(debug("intent")), scan(reducerPipe([activeFileReducer]), initialState), tap(debug("state")))
  .subscribe(state$);

const App = () => html`
  <h2>Paper Lab</h2>
  ${FileUploader(state$, intent$)} ${state$.pipe(map((s) => (s.activeFile ? html` ${MarkdownEditor(state$)} ` : null)))}
`;

// Bind to DOM
render(App(), document.getElementById("app")!);
