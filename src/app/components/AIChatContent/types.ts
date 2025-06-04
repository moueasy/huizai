// export type DefineMessageType = [string, string] | string;
export type DefineMessageType = {
  isLocal: boolean;
  contentText: string;
  reasoningContentText?: string;
  thinkingTime?: number;
  isFinish?: boolean;
  isError?: boolean;
};

export type MessageResponseType = {
  content: string;
  reasoning_content: string;
};
