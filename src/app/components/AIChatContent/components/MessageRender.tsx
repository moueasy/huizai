import type { DefineMessageType } from '../types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MarkdownIt from 'markdown-it';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
const md = new MarkdownIt({ html: true, breaks: true });

const MessageRender = ({
  content,
  handleClearMessages,
}: {
  content: DefineMessageType;
  handleClearMessages: () => void;
}) => {
  const minAppVersion = '5.1.1';
  const minAppVersionCode = '501010';

  const appVersion = useRef('');
  const appVersionCode = useRef('');
  useEffect(() => {
    appVersion.current = localStorage.getItem('appVersion') ?? '';
    appVersionCode.current = localStorage.getItem('appVersionCode') ?? '';
  }, []);

  return (
    <div className="rounded-2xl text-white">
      {content.reasoningContentText && (
        <Accordion type="single" collapsible defaultValue="thinking">
          <AccordionItem value="thinking">
            <AccordionTrigger className="rounded-t-2xl bg-[#374887] px-4 py-2">
              已深度思考（用时{content.thinkingTime}秒
            </AccordionTrigger>
            <AccordionContent className="bg-[#374079] px-4 py-2 text-justify text-[rgba(255,255,255,0.8)]">
              {content.reasoningContentText}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      <div
        className={cn(
          'rounded-2xl px-4 py-2',
          content.reasoningContentText && '!rounded-t-none',
          content.isLocal ? 'bg-white text-[#6678CE]' : 'bg-[#6678CE] text-white',
        )}
      >
        <div className="text-justify" dangerouslySetInnerHTML={{ __html: md.render(content.contentText ?? '') }}></div>

        {/* 点赞 */}
        {/* {!content.isLocal && content.isFinish && !content.isError && (
          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" size="icon">
              <ThumbsUp color="#6678CE" />
            </Button>
            <Button variant="outline" size="icon">
              <ThumbsUp color="#6678CE" />
            </Button>
            <Button onClick={handleCopy} className="bg-white font-bold text-[#6678CE]">
              复制全文
            </Button>
          </div>
        )} */}

        {content.routeConfig && content.routeConfig.length > 0 && !content.isLocal && (
          <div className="mt-4 w-full">
            <p className="mb-2 text-white">您可能想访问的相关功能：</p>
            <div className="flex flex-col">
              {content.routeConfig?.map(item => {
                return (
                  <Button
                    key={item.key}
                    className="mb-2 h-8 rounded-full bg-white text-[#6678CE]"
                    onClick={() => {
                      if (parseInt(appVersionCode.current) < parseInt(minAppVersionCode)) {
                        toast.error('app版本过低，请升级到最新版本');
                        return;
                      }
                      window.uni.webView.postMessage({
                        data: item,
                      });
                    }}
                  >
                    {item.btnName}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!content.isLocal && content.isFinish && content.isLast && (
        <div className="mt-4 flex h-8 w-full items-center justify-center">
          <Button onClick={handleClearMessages} className="h-8 rounded-full bg-[#6678CE] text-white" variant="outline">
            开启新对话
          </Button>
        </div>
      )}
    </div>
  );
};
export default MessageRender;
