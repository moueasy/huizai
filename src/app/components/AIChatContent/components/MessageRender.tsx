import { Button } from '@/components/ui/button';
import type { DefineMessageType } from '../types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { ThumbsUp } from 'lucide-react';
import MarkdownIt from 'markdown-it';
const md = new MarkdownIt({ html: true, breaks: true });

const handleCopy = () => {
  navigator.clipboard.writeText('123123123123123');
};

const MessageRender = (content: DefineMessageType) => {
  return (
    <div className="rounded-2xl text-white">
      {content.reasoningContentText && (
        <Accordion type="single" collapsible defaultValue="thinking">
          <AccordionItem value="thinking">
            <AccordionTrigger className="rounded-t-2xl bg-[#374887] px-4 py-2">
              已深度思考（用时{content.thinkingTime}秒）
            </AccordionTrigger>
            <AccordionContent className="bg-[#374079] px-4 py-2">{content.reasoningContentText}</AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      <div
        className={cn(
          'rounded-2xl bg-[#6678CE] px-4 py-2 text-white',
          content.reasoningContentText && '!rounded-t-none',
        )}
      >
        <div dangerouslySetInnerHTML={{ __html: md.render(content.contentText ?? '') }}></div>

        {/* 点赞 */}
        {!content.isLocal && content.isFinish && !content.isError && (
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
        )}
      </div>
    </div>
  );
};
export default MessageRender;
