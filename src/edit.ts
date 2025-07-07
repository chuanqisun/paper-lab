import { OpenAI } from "openai/client.js";
import { from, tap } from "rxjs";
import "./edit.css";
import { CodeEditorElement } from "./features/code-editor/code-editor-element";
import { getStoredApiKey } from "./features/markdown-editor";

CodeEditorElement.define();

const sourceEditor = document.querySelector<CodeEditorElement>("#source-editor")!;
const promptEditor = document.querySelector<CodeEditorElement>("#prompt-editor")!;

sourceEditor.addEventListener("run", () => console.log("Run prompt editor content:", sourceEditor.value));
promptEditor.addEventListener("run", async (e) => {
  const prompt = (e as CustomEvent<string>).detail;
  const source = sourceEditor.value;

  const openai = new OpenAI({
    dangerouslyAllowBrowser: true,
    apiKey: getStoredApiKey(),
  });

  const response = await openai.responses.create({
    stream: true,
    model: "gpt-4.1-mini",
    input: [
      {
        role: "developer",
        content: `The user is editing the following document:
\`\`\`
${source}
\`\`\`      

Based on user's editing goal or instructions, write a javascript function that performs the edit. Respond in the following format:

\`\`\`typescript
async function edit(content: string): string {
  /** Your implementation here */
  return updatedContent;
}
\`\`\`
      `.trim(),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const aiCursor = sourceEditor.spawnCursor();

  from(response)
    .pipe(
      tap((chunk) => {
        if (chunk.type === "response.output_text.delta") {
          // Write the delta to the prompt editor
          aiCursor.write(chunk.delta);
        }
      }),
    )
    .subscribe();
});
