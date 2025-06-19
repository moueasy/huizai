// export type DefineMessageType = [string, string] | string;
export interface RouteConfig {
  key: string;
  btnName: string;
  path: string;
  params: Record<string, string>;
}

export type DefineMessageType = {
  isLocal: boolean;
  contentText: string; // 这里加了后缀text是因为content与antd的message组件的content属性冲突
  reasoningContentText?: string; // 这里加了后缀text是因为content与antd的message组件的content属性冲突
  thinkingTime?: number;
  isFinish?: boolean;
  isError?: boolean;
  isLast?: boolean;
  routeConfig?: RouteConfig[];
};

export type MessageResponseType = {
  content: string;
  reasoning_content: string;
  routeConfig?: RouteConfig[];
};
