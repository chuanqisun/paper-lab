export interface State {
  activeFile?: File;
  openaiApiKey: string;
}

export type Intent = {
  uploadFile?: File;
  clearUpload?: true;
};
