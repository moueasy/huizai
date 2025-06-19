import { useEffect, useCallback, useRef } from 'react';

// 定义接收数据的类型
export interface UniAppData {
  appVersion?: string;
  appVersionCode?: string;
  [key: string]: any;
}

// 定义回调函数类型
export type UniAppDataCallback = (data: UniAppData) => void;

// 临时数据存储的类型
interface TempUniAppData {
  type: string;
  data: UniAppData;
  timestamp: number;
}

// 自定义事件的详情类型
interface AppDataUpdatedDetail {
  key: string;
  value: any;
}

// 扩展window对象类型
declare global {
  interface Window {
    _tempUniAppData?: TempUniAppData[];
  }
  interface WindowEventMap {
    appDataUpdated: CustomEvent<AppDataUpdatedDetail>;
  }
}

/**
 * 用于接收来自uni-app x的数据的Hook
 * @param callback 接收到数据时的回调函数
 * @returns 返回手动注册接收函数的方法和其他工具函数
 */
export const useUniAppData = (callback?: UniAppDataCallback) => {
  const callbackRef = useRef<UniAppDataCallback | undefined>(callback);

  // 更新回调函数引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 安全的数据处理函数
  const handleDataSafely = useCallback((data: any, source = 'unknown') => {
    try {
      // 确保数据是有效的
      const processedData = typeof data === 'string' ? JSON.parse(data) : data;

      console.log(`收到uni-app数据 (${source}):`, processedData);

      if (callbackRef.current) {
        callbackRef.current(processedData);
      }
    } catch (error) {
      console.error(`处理uni-app数据时出错 (${source}):`, error, 'raw data:', data);
    }
  }, []);

  // 注册全局接收数据函数
  const registerReceiveFunction = useCallback(
    (functionName = 'receiveAppData') => {
      if (typeof window !== 'undefined') {
        (window as any)[functionName] = (data: UniAppData) => {
          handleDataSafely(data, functionName);
        };
      }
    },
    [handleDataSafely],
  );

  // 处理临时存储的数据
  const processTempData = useCallback(() => {
    if (typeof window !== 'undefined' && window._tempUniAppData && window._tempUniAppData.length > 0) {
      console.log(`处理 ${window._tempUniAppData.length} 条临时存储的uni-app数据`);

      window._tempUniAppData.forEach(tempData => {
        handleDataSafely(tempData.data, `temp-${tempData.type}`);
      });

      // 清空临时数据
      window._tempUniAppData = [];
    }
  }, [handleDataSafely]);

  // 手动触发数据接收（用于测试）
  const triggerReceive = useCallback((data: UniAppData, functionName = 'receiveAppData') => {
    if (typeof window !== 'undefined' && (window as any)[functionName]) {
      (window as any)[functionName](data);
    }
  }, []);

  // 检查是否在uni-app环境中
  const checkUniAppEnvironment = useCallback(() => {
    if (typeof window !== 'undefined') {
      const hasUniAppX = !!(window as any).__uniapp_x_postMessage || !!(window as any).__uniapp_x_;
      const hasDcloudWeex = !!(window as any).__dcloud_weex_postMessage || !!(window as any).__dcloud_weex_;
      const hasUni = !!(window as any).uni;
      const hasPlus = !!(window as any).plus;

      return hasUniAppX || hasDcloudWeex || hasUni || hasPlus;
    }
    return false;
  }, []);

  // 获取环境详情
  const getEnvironmentInfo = useCallback(() => {
    if (typeof window !== 'undefined') {
      return {
        hasUniAppX: !!(window as any).__uniapp_x_postMessage || !!(window as any).__uniapp_x_,
        hasDcloudWeex: !!(window as any).__dcloud_weex_postMessage || !!(window as any).__dcloud_weex_,
        hasUni: !!(window as any).uni,
        hasPlus: !!(window as any).plus,
        userAgent: navigator.userAgent,
        isUniApp: /uni-app/i.test(navigator.userAgent),
        isHtml5Plus: /Html5Plus/i.test(navigator.userAgent),
      };
    }
    return {};
  }, []);

  // 组件挂载时的初始化
  useEffect(() => {
    // 注册默认接收函数
    registerReceiveFunction('receiveAppData');

    // 注册handleAppMessage函数
    if (typeof window !== 'undefined') {
      (window as any).handleAppMessage = (data: UniAppData) => {
        handleDataSafely(data, 'handleAppMessage');
      };

      // 注册全局变量更新监听
      const handleAppDataUpdated = (event: CustomEvent<AppDataUpdatedDetail>) => {
        const { key, value } = event.detail;
        handleDataSafely({ [key]: value }, 'appDataUpdated');
      };

      window.addEventListener('appDataUpdated', handleAppDataUpdated);

      // 处理组件挂载前收到的临时数据
      processTempData();

      // 清理函数
      return () => {
        if ((window as any).receiveAppData) {
          delete (window as any).receiveAppData;
        }
        if ((window as any).handleAppMessage) {
          delete (window as any).handleAppMessage;
        }
        window.removeEventListener('appDataUpdated', handleAppDataUpdated);
      };
    }
  }, [registerReceiveFunction, handleDataSafely, processTempData]);

  return {
    registerReceiveFunction,
    triggerReceive,
    checkUniAppEnvironment,
    getEnvironmentInfo,
    processTempData,
  };
};
