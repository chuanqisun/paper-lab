import { command$ } from "../main";
import type { Command, State } from "../types";

export function pickFileEffect(command: Command) {
  if (!command.pickFile) return;
  uploadSingleFile();
}

export function uploadFilesReducer(state: State, intent: Command): State {
  if (intent.clearUpload) {
    return {
      ...state,
      files: [],
    };
  } else if (intent.uploadFiles) {
    return {
      ...state,
      files: [...state.files, ...intent.uploadFiles],
    };
  } else return state;
}

const uploadSingleFile = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".pdf";
  input.multiple = true;
  input.onchange = () => {
    if (input.files) {
      command$.next({ uploadFiles: [...input.files] });
    }
    input.remove();
  };
  input.click();
};
