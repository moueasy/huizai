import type { DefineMessageType } from '../types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt({ html: true, breaks: true });

const MessageRender = ({
  content,
  handleClearMessages,
}: {
  content: DefineMessageType;
  handleClearMessages: () => void;
}) => {
  return (
    <div className="rounded-2xl text-white">
      {content.reasoningContentText && (
        <Accordion type="single" collapsible defaultValue="thinking">
          <AccordionItem value="thinking">
            <AccordionTrigger className="rounded-t-2xl bg-[#374887] px-4 py-2">
              已深度思考（用时{content.thinkingTime}秒）
            </AccordionTrigger>
            <AccordionContent className="bg-[#374079] px-4 py-2 text-[rgba(255,255,255,0.8)]">
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
        <div dangerouslySetInnerHTML={{ __html: md.render(content.contentText ?? '') }}></div>

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
            <div className="mb-2 flex flex-col">
              {content.routeConfig?.map(item => {
                return (
                  <Button key={item.btnName} className="h-8 rounded-full bg-white text-[#6678CE]">
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
