import OpenAI from "openai";
import { BehaviorSubject, from, lastValueFrom, map, tap } from "rxjs";
import { html } from "../lib/html";
import { observe } from "../lib/observe";
import type { Intent, State } from "../types";
import type { CodeEditorElement } from "./code-editor/code-editor-element";

export function markdownEditorReducer(state: State, _intent: Intent): State {
  return state;
}

export function MarkdownEditor(state$: BehaviorSubject<State>) {
  const abortController$ = new BehaviorSubject<AbortController | null>(null);

  const handleStop = () => {
    abortController$.value?.abort();
  };

  const handleGenerateMarkdown = async () => {
    const openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      apiKey: getStoredApiKey(),
    });

    const markdownEditor = document.querySelector<CodeEditorElement>("#markdownEditor")!;
    const cursor = markdownEditor.spawnCursor();

    try {
      abortController$.value?.abort(); // Cancel any previous request
      abortController$.next(new AbortController());
      const file = state$.value.activeFile;
      if (!file) throw new Error("No active file to process");
      const dataUrl = await fileToDataUrl(file);
      const responseStream = await openai.responses.create(
        {
          input: [
            {
              role: "developer",
              content: document.querySelector<CodeEditorElement>("#promptEditor")!.value,
            },
            {
              role: "user",
              content: [
                {
                  type: "input_file",
                  file_data: dataUrl,
                  filename: file.name,
                },
              ],
            },
          ],
          model: "gpt-4.1-mini",
          stream: true,
        },
        {
          signal: abortController$.value!.signal,
        },
      );

      markdownEditor.value = ""; // Clear the editor before writing new content

      const genStream$ = from(responseStream).pipe(
        tap((chunk) => {
          if (chunk.type === "response.output_text.delta") {
            cursor.write(chunk.delta);
          }
        }),
      );

      await lastValueFrom(genStream$);
    } finally {
      cursor.close();
      abortController$.next(null);
    }
  };

  const handleApiKeyInput = (event: Event) => {
    // side effect
    localStorage.setItem("paper-lab:openaiApiKey", (event.target as HTMLInputElement).value);
  };

  return html` <label for="promptEditor">Instruction</label>
    <code-editor-element id="promptEditor" data-value="Convert the PDF to markdown"></code-editor-element>
    <br />
    <div>
      <label for="openaiApiKey">OpenAI API Key</label>
      <input
        id="openaiApiKey"
        name="openaiApiKey"
        type="password"
        data-1p-ignore.
        @input=${handleApiKeyInput}
        .value=${observe(state$.pipe(map((s) => s.openaiApiKey)))}
      />
      ${abortController$.pipe(
        map((controller) =>
          controller
            ? html`<button @click=${handleStop}>Stop</button>`
            : html`<button @click=${handleGenerateMarkdown}>Generate Markdown</button>`,
        ),
      )}
    </div>
    <br />
    <label for="markdownEditor">Markdown</label>
    <code-editor-element id="markdownEditor"></code-editor-element>`;
}

export function getStoredApiKey(): string {
  return localStorage.getItem("paper-lab:openaiApiKey") ?? "";
}

async function fileToDataUrl(file: File): Promise<string> {
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
