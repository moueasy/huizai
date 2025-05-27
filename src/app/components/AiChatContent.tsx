'use client';
import { useXAgent, useXChat, Sender, Bubble } from '@ant-design/x';
import React, { useMemo, useState } from 'react';
import { client, roles } from './config';
import Image from 'next/image';
import { ScrollArea } from '@radix-ui/react-scroll-area';

const AiChatContent: React.FC = () => {
  const [agent] = useXAgent<string, { message: string }, string>({
    request: ({ message }, { onSuccess, onUpdate }) => {
      (async () => {
        {
          let content = '';

          try {
            const stream = await client.chat.completions.create({
              model: 'qwq-plus',
              messages: [
                {
                  role: 'system',
                  content: '你是一名专业的健身教练和营养师，你的名字叫做Cal LightMan，请根据用户的问题给出回答。',
                },
                { role: 'user', content: message ?? '' },
              ],
              stream: true,
            });

            for await (const chunk of stream) {
              content += chunk.choices[0]?.delta?.content ?? '';
              onUpdate(content);
            }

            onSuccess([content]);
          } catch (error) {
            onUpdate('服务器繁忙');
            console.log('error', error);
          }
        }
      })();
    },
  });

  const { onRequest, messages } = useXChat({ agent });

  const items = messages.map(({ message, id, status }) => {
    console.log(message, status);
    return {
      key: id,
      role: status === 'local' ? 'user' : 'system',
      content: <div className="text-white">{message}</div>,
      loading: message === '',
    };
  });

  const [searchValue, setSearchValue] = useState('');

  const handleSubmit = (value: string) => {
    setSearchValue('');
    onRequest(value);
  };

  const mainRender = useMemo(() => {
    if (items.length === 0) {
      return (
        <ScrollArea className="w-full flex-1">
          <div className="rounded-2xl bg-[#6678CE] p-4">
            <p>你好，我是你的私人健身教练</p>
            <p>你好，我是你的私人健身教练</p>
            <p>你好，我是你的私人健身教练</p>
            <p>你好，我是你的私人健身教练</p>
          </div>
        </ScrollArea>
      );
    }
    return (
      <Bubble.List className="mb-14 h-full w-full" style={{ color: 'white' }} autoScroll roles={roles} items={items} />
    );
  }, [items]);

  return (
    <>
      {mainRender}
      <div className="fixed bottom-[80px] left-0 z-10 flex w-full items-center justify-center bg-[#374887] py-2 text-center text-xs text-white">
        <Image src="/logo.png" alt="logo" width={100} height={14} className="mr-2" />
        <div className="mr-4 ml-2 h-6 w-[1px] bg-white/50"></div>
        <span>深度思考 (DeepSeek R1)</span>
      </div>
      <Sender
        className="aiSender right-0 bottom-0 left-0 !text-white"
        value={searchValue}
        onChange={setSearchValue}
        allowSpeech
        onSubmit={handleSubmit}
      />
    </>
  );
};

export default AiChatContent;
