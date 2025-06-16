// app/UniWebviewScriptLoader.tsx
'use client';

import { useEffect, useState } from 'react';
import { useUniAppData, type UniAppData } from '@/hooks/useUniAppData';

interface UniMessageProps {
  onDataReceived?: (data: UniAppData) => void;
  showDebugInfo?: boolean;
}

const UniMessage: React.FC<UniMessageProps> = ({ onDataReceived, showDebugInfo = false }) => {
  const [receivedData, setReceivedData] = useState<UniAppData[]>([]);
  const [isUniApp, setIsUniApp] = useState(false);

  // 使用自定义Hook处理数据接收
  const { checkUniAppEnvironment, triggerReceive } = useUniAppData((data: UniAppData) => {
    console.log('UniMessage收到数据:', data);

    // 更新本地状态
    setReceivedData(prev => [...prev, { ...data, timestamp: Date.now() }]);

    // 调用外部回调
    if (onDataReceived) {
      onDataReceived(data);
    }
  });

  useEffect(() => {
    // 检查是否在uni-app环境中
    setIsUniApp(checkUniAppEnvironment());

    // 注册额外的接收函数（如果需要）
    if (typeof window !== 'undefined') {
      // 注册处理应用消息的函数
      (window as any).handleAppMessage = (data: UniAppData) => {
        console.log('收到handleAppMessage:', data);
        setReceivedData(prev => [...prev, { ...data, timestamp: Date.now(), source: 'handleAppMessage' }]);
        if (onDataReceived) {
          onDataReceived(data);
        }
      };

      // 注册全局变量更新监听
      (window as any).addEventListener('appDataUpdated', (event: CustomEvent) => {
        console.log('收到appDataUpdated事件:', event.detail);
        const { key, value } = event.detail;
        setReceivedData(prev => [...prev, { [key]: value, timestamp: Date.now(), source: 'appDataUpdated' }]);
        if (onDataReceived) {
          onDataReceived({ [key]: value });
        }
      });
    }

    return () => {
      // 清理函数
      if (typeof window !== 'undefined') {
        if ((window as any).handleAppMessage) {
          delete (window as any).handleAppMessage;
        }
      }
    };
  }, [checkUniAppEnvironment, onDataReceived]);

  // 测试函数（仅在开发模式下显示）
  const handleTestReceive = () => {
    const testData = {
      userId: 'test123',
      userName: '测试用户',
      message: '这是一条测试消息',
      timestamp: Date.now(),
    };
    triggerReceive(testData);
  };

  if (!showDebugInfo) {
    return null; // 不显示调试信息时返回null
  }

  return (
    <div className="fixed right-4 bottom-4 z-50 max-w-sm rounded-lg border border-gray-300 bg-white p-4 shadow-lg">
      <h3 className="mb-2 text-sm font-semibold">UniApp调试信息</h3>
      <div className="space-y-1 text-xs">
        <p>环境: {isUniApp ? '✅ UniApp' : '❌ 非UniApp'}</p>
        <p>接收数据次数: {receivedData.length}</p>

        {process.env.NODE_ENV === 'development' && (
          <button onClick={handleTestReceive} className="mt-2 rounded bg-blue-500 px-2 py-1 text-xs text-white">
            测试接收数据
          </button>
        )}

        {receivedData.length > 0 && (
          <div className="mt-2 max-h-32 overflow-y-auto">
            <p className="font-semibold">最近接收的数据:</p>
            {receivedData.slice(-3).map((data, index) => (
              <div key={index} className="mt-1 rounded bg-gray-100 p-1 text-xs">
                <pre className="text-xs">{JSON.stringify(data, null, 1)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UniMessage;
