import * as esbuild from "esbuild-wasm";
import esbuildWasmURL from "esbuild-wasm/esbuild.wasm?url";
import { OpenAI } from "openai/client.js";
import { finalize, from, fromEvent, merge, switchMap, tap } from "rxjs";
import "./edit.css";
import { CodeEditorElement } from "./features/code-editor/code-editor-element";
import { getStoredApiKey } from "./features/markdown-editor";

CodeEditorElement.define();

async function initEsbuild() {
  await esbuild.initialize({
    wasmURL: esbuildWasmURL,
  });

  return esbuild;
}

const esbuildAsync = initEsbuild();

const sourceEditor = document.querySelector<CodeEditorElement>("#source-editor")!;
const promptEditor = document.querySelector<CodeEditorElement>("#prompt-editor")!;
const scriptEditor = document.querySelector<CodeEditorElement>("#script-editor")!;

const sourceEditorRun$ = fromEvent(sourceEditor, "run").pipe(
  tap(() => console.log("Run prompt editor content:", sourceEditor.value)),
);

const savedValue = localStorage.getItem("paper-lab:source-editor-value");
if (savedValue !== null) {
  sourceEditor.value = savedValue;
}

fromEvent<CustomEvent<string>>(sourceEditor, "contentchange")
  .pipe(
    tap((e) => {
      localStorage.setItem("paper-lab:source-editor-value", e.detail);
    }),
  )
  .subscribe();

const promptEditorRun$ = fromEvent(promptEditor, "run").pipe(
  switchMap(async (e) => {
    const prompt = (e as CustomEvent<string>).detail;
    const source = sourceEditor.value;

    const openai = new OpenAI({
      dangerouslyAllowBrowser: true,
      apiKey: getStoredApiKey(),
    });

    const response = await openai.responses.create({
      stream: true,
      model: "gpt-4.1",
      user: "paper-lab-edit",
      input: [
        {
          role: "developer",
          content: `The user is editing the following document:
\`\`\`
${source}
\`\`\`      

Write a typescript function to perform the edit based on user's goal or instruction.
- You can return string literal directly when write content from script
- Use string replacement function to make precise edits, pay attention to whitespace
- Use regex to match complex patterns
- Use logic for data manipulation

Write compact code without comments. When performing multiple types of edit, delimit the their code by a new line.

Respond with typescript. No markup or markdown wrapper.

async function edit(content: string): string {
  /** Your implementation here */
  return updatedContent;
}
      `.trim(),
        },
        {
          role: "user",
          content: `Just say "hello"`,
        },
        {
          role: "assistant",
          content: `
async function edit(content: string): string {
  return \`
hello
\`.trim();
}`.trim(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return response;
  }),
  switchMap((response) => {
    scriptEditor.value = "";
    const aiCursor = scriptEditor.spawnCursor();

    return from(response).pipe(
      tap((chunk) => {
        if (chunk.type === "response.output_text.delta") {
          // Write the delta to the prompt editor
          aiCursor.write(chunk.delta);
        }
      }),
      finalize(() => aiCursor.close()),
    );
  }),
);

const scriptEditorRun$ = fromEvent<CustomEvent<string>>(scriptEditor, "run").pipe(
  switchMap(async (e) => {
    const script = e.detail;
    const esbuild = await esbuildAsync;
    const output = await esbuild
      .transform(script, { loader: "ts" })
      .then((r) => r.code)
      .catch((error) => {
        console.error("Error transforming script:", error);
        return null;
      });

    if (!output) return;
    const editFunction = new Function("content", output + " return edit(content);");
    const content = sourceEditor.value;
    const updatedContent = await editFunction(content);
    sourceEditor.value = updatedContent;
  }),
);

merge(sourceEditorRun$, promptEditorRun$, scriptEditorRun$).subscribe();
