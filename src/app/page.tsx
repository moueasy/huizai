import AiChatContent from './components/AIChatContent';
import { env } from '@/env';

export interface TipData {
  dictLabel: string;
  dictValue: string;
  dictType: string;
}

// 获取chat-welcome-message
const getChatWelcomeMessage = async () => {
  try {
    const res = await fetch(`${env.NEXT_API_BASE_URL}/open/dict/list?dictType=huizai_chat_tips`, {
      method: 'GET',
      cache: 'no-store', // 禁用缓存，每次都获取最新数据
    });
    const resJson: { data: TipData[] } = await res.json();
    return resJson.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default async function HomePage() {
  const tipData = await getChatWelcomeMessage();
  const welcomeTip =
    tipData.find(item => item.dictLabel === 'welcomeTip')?.dictValue ??
    '您好，这里是您的专属AI助手辉仔！ <br>您可以向我询问以下问题，比如：<br> <br> 辉途智能公司相关信息 <br>如何使用app <br> DHl报告解读 <br> 热应激知识 <br> 牧场碳排放和管理 <br> 牧场的生产数据（比如：昨天的产奶情况）<br> 其他牧场相关问题';
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#50587E] to-[rgba(102,120,206,0.94)] text-white">
      <div className="container flex h-[100vh] flex-col items-center pt-4 pr-4 pb-[14px] pl-4">
        <AiChatContent welcomeTip={welcomeTip} />
      </div>
    </main>
  );
}
