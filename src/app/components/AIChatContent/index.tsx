'use client';
import { useXAgent, useXChat, Bubble } from '@ant-design/x';
import React, { useMemo, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import type { RolesType } from '@ant-design/x/es/bubble/BubbleList';
import { ArrowUp, Bot, User } from 'lucide-react';
import MessageRender from './components/MessageRender';
import type { DefineMessageType, MessageResponseType } from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { env } from '@/env';

const AiChatContent: React.FC<{ welcomeTip: string }> = ({ welcomeTip }) => {
  const roles: RolesType = {
    system: {
      placement: 'start',
      typing: { step: 5, interval: 20 },
      messageRender: (content: DefineMessageType) => {
        return <MessageRender content={content} handleClearMessages={handleClearMessages} />;
      },
      variant: 'borderless',
    },
    user: {
      placement: 'end',
      messageRender: (content: DefineMessageType) => {
        return <MessageRender content={content} handleClearMessages={handleClearMessages} />;
      },
      variant: 'borderless',
    },
  };
  // 请求配置项
  const [currentModel, setCurrentModel] = useState('deepseek-reasoner');
  // 当前是否正在请求
  const [isRequesting, setIsRequesting] = useState(false);

  // 使用 ref 来存储最新的 currentModel 值，避免闭包问题
  const currentModelRef = useRef(currentModel);
  currentModelRef.current = currentModel;

  // 使用 useCallback 包装请求函数，并将 currentModel 作为依赖
  const requestHandler = useCallback(
    async ({ message }: { message: DefineMessageType }, { onSuccess, onUpdate }: any) => {
      let buffer = '';
      let contentText = ''; // 非思考文本
      let reasoningContentText = ''; // 思考文本
      const timeNow = Date.now(); // 请求开始时间
      let thinkingTime = 0; // 思考时间

      try {
        // 使用 encodeURIComponent 对参数进行编码
        const params = new URLSearchParams({
          message: message.contentText,
          model: currentModelRef.current, // 使用 ref 获取最新值
        });
        onUpdate({
          isLocal: false,
          contentText: '',
          reasoningContentText: '',
          thinkingTime: 0,
        });
        setIsRequesting(true);
        const stream = await fetch(`${env.NEXT_PUBLIC_API_CHAT_URL}/api/chat/stream?${params.toString()}`, {
          method: 'GET',
        });
        if (!stream.ok) {
          throw new Error('服务器繁忙');
        }
        const render = stream.body?.getReader();
        if (!render) {
          throw new Error('无法获取流读取器');
        }
        const decoder = new TextDecoder();
        while (true) {
          const result = await render.read();
          if (result.done) break;
          const text = decoder.decode(result.value, { stream: true });
          buffer += text;
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              try {
                const data: MessageResponseType = JSON.parse(jsonStr);
                thinkingTime = Math.floor((Date.now() - timeNow) / 1000);
                // 更新状态
                if (data.content) contentText += data.content;
                if (data.reasoning_content) reasoningContentText += data.reasoning_content;
                onUpdate({
                  isLocal: false,
                  contentText: contentText,
                  reasoningContentText: reasoningContentText,
                  thinkingTime: thinkingTime,
                });
              } catch (error) {
                console.error('JSON parse error:', error);
              }
            }
          }
        }
        onSuccess({
          isLocal: false,
          contentText: contentText,
          reasoningContentText: reasoningContentText,
          thinkingTime: thinkingTime,
          isFinish: true,
        });
        setIsRequesting(false);
      } catch (error) {
        onUpdate({
          isLocal: false,
          contentText: '服务器繁忙',
          reasoningContentText: '',
          thinkingTime: 0,
          isFinish: true,
          isError: true,
        });
        setIsRequesting(false);
        console.log('error', error);
      }
    },
    [currentModel],
  ); // 将 currentModel 作为依赖项

  const [agent] = useXAgent<DefineMessageType, { message: DefineMessageType }, DefineMessageType>({
    request: requestHandler,
  });

  const { onRequest, messages, setMessages } = useXChat({ agent });

  const items = messages.map(({ message, id, status }, index) => {
    return {
      key: id,
      role: status === 'local' ? 'user' : 'system',
      styles: {
        content: {
          maxWidth: status === 'local' ? '80%' : '100%',
        },
      },
      content: {
        ...message,
        isLast: messages.length - 1 === index,
      },
      loading: message.contentText === '' && message.reasoningContentText === '',
    };
  });

  const [searchValue, setSearchValue] = useState('');

  const handleSubmit = (value: string) => {
    if (!value) return;
    if (isRequesting) {
      toast.warning('请等待上条消息响应完成');
      return;
    }
    setSearchValue('');
    onRequest({
      isLocal: true,
      contentText: value,
    });
  };

  const handleClearMessages = () => {
    setMessages([]);
  };

  const mainRender = useMemo(() => {
    if (items.length === 0) {
      return (
        <ScrollArea className="w-full flex-1">
          <div className="flex items-start">
            <Image src="/image/moueasy.png" alt="logo" width={34} height={34} className="mr-3 rounded-full" priority />
            <div className="rounded-2xl bg-[#6678CE] p-4">
              <p className="text-sm whitespace-pre-line">{welcomeTip.replace(/<br>/g, '\n')}</p>
            </div>
          </div>
        </ScrollArea>
      );
    }
    return (
      <Bubble.List className="mb-14 h-full w-full" style={{ color: 'white' }} autoScroll roles={roles} items={items} />
    );
  }, [items]);

  const handleCheckedChange = (checked: boolean) => {
    setCurrentModel(checked ? 'deepseek-reasoner' : 'deepseek-chat');
  };

  return (
    <>
      {mainRender}
      <div className="fixed bottom-[80px] left-0 z-10 flex w-full items-center justify-center bg-[#374887] py-2 text-center text-xs text-white">
        <Image src="/image/logo.png" alt="logo" width={100} height={14} className="mr-2" priority />
        <div className="mr-4 ml-2 h-6 w-[1px] bg-white/50"></div>
        <span className="text-sm">辉仔，您的随身牧场专家</span>
        {/* <span className="mr-2">深度思考 (DeepSeek R1)</span>
        <Switch id="airplane-mode" defaultChecked onCheckedChange={handleCheckedChange} /> */}
      </div>

      <div className="relative w-full">
        <Input
          className="right-0 bottom-0 left-0 h-14 rounded-4xl border-none bg-[#444C6F] !text-white focus-visible:ring-0"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          // allowSpeech
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleSubmit(searchValue);
            }
          }}
        />
        <Button
          onClick={() => handleSubmit(searchValue)}
          className="absolute right-3 bottom-3 h-8 w-8 rounded-full bg-[#6678CE]"
          size="icon"
          disabled={!searchValue}
        >
          <ArrowUp />
        </Button>
      </div>
    </>
  );
};

export default AiChatContent;
