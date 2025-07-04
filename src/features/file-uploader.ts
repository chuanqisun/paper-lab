import { distinctUntilChanged, map, Observable, Subject } from "rxjs";
import { html } from "../lib/html";
import type { Intent, State } from "../types";

export function activeFileReducer(state: State, intent: Intent): State {
  if (intent.clearUpload) {
    return {
      ...state,
      activeFile: undefined,
    };
  } else if (intent.uploadFile) {
    return {
      ...state,
      activeFile: intent.uploadFile,
    };
  } else return state;
}

export function FileUploader(state$: Observable<State>, intent$: Subject<Intent>) {
  const currentFileInfo$ = state$.pipe(
    map((s) => s.activeFile),
    distinctUntilChanged(),
    map((file) => {
      return file
        ? html`
            <span>${file.name} ${file.size}</span>
            <button @click=${() => intent$.next({ clearUpload: true })}>Clear</button>
          `
        : null;
    }),
  );

  const uploadSingleFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf";
    input.onchange = () => {
      if (input.files) {
        for (const file of input.files) {
          intent$.next({ uploadFile: file });
        }
      }
      input.remove();
    };
    input.click();
  };

  return html`
    <button @click=${uploadSingleFile}>Upload PDF</button>
      <div>${currentFileInfo$}</div>
    </button>
  `;
}
