export interface State {
  files: File[];
  openaiApiKey: string;
}

export interface Command {
  newFile?: true;
  pickFile?: true;
  uploadFiles?: File[];
  clearUpload?: true;
  run?: RunRequest;
}

export interface RunRequest {
  code: string;
}
