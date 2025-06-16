'use client';

import { type UniAppData } from '@/hooks/useUniAppData';
import UniMessage from '@/components/UniMessage';

const WebViewMessage = () => {
  // useState接收数据存储数据
  //   const [receivedMessages, setReceivedMessages] = useState<UniAppData[]>([]);

  //   const handleDataReceived = (data: UniAppData) => {
  //     console.log('页面接收到数据:', data);
  //     setReceivedMessages(prev => [{ ...data, receivedAt: new Date().toLocaleString() }, ...prev].slice(0, 10)); // 只保留最近10条
  //   };

  const handleDataReceived = (data: UniAppData) => {
    // 将数据存储到localStorage
    localStorage.setItem('appVersion', data.appVersion ?? '');
    localStorage.setItem('appVersionCode', data.appVersionCode ?? '');
  };

  return (
    <div>
      <UniMessage onDataReceived={handleDataReceived} showDebugInfo={process.env.NODE_ENV === 'development'} />
    </div>
  );
};

export default WebViewMessage;
