import { OpenAI } from "openai/client.js";
import { finalize, from, tap } from "rxjs";
import "./edit.css";
import { CodeEditorElement } from "./features/code-editor/code-editor-element";
import { getStoredApiKey } from "./features/markdown-editor";

CodeEditorElement.define();

const sourceEditor = document.querySelector<CodeEditorElement>("#source-editor")!;
const promptEditor = document.querySelector<CodeEditorElement>("#prompt-editor")!;
const scriptEditor = document.querySelector<CodeEditorElement>("#script-editor")!;

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

Respond with a <script>:

<script type="text/typescript">
async function edit(content: string): string {
  /** Your implementation here */
  return updatedContent;
}
</script>
      `.trim(),
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  scriptEditor.value = "";
  const aiCursor = scriptEditor.spawnCursor();

  from(response)
    .pipe(
      tap((chunk) => {
        if (chunk.type === "response.output_text.delta") {
          // Write the delta to the prompt editor
          aiCursor.write(chunk.delta);
        }
      }),
      finalize(() => aiCursor.close()),
    )
    .subscribe();
});
