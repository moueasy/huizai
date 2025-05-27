import { type RolesType } from '@ant-design/x/es/bubble/BubbleList';
import { Bot, User } from 'lucide-react';
import OpenAI from 'openai';
import { env } from '@/env';
export const client = new OpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const roles: RolesType = {
  system: {
    placement: 'start',
    avatar: { icon: <Bot />, style: { background: '#fde3cf' } },
    typing: { step: 5, interval: 20 },
    style: {
      maxWidth: 600,
      color: 'red',
    },
  },
  user: {
    placement: 'end',
    avatar: { icon: <User />, style: { background: '#87d068' } },
  },
};
