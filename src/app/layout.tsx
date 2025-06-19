import '@/styles/globals.css';
// import 'regenerator-runtime/runtime';
import Script from 'next/script';

import { type Metadata, type Viewport } from 'next';
import { Geist } from 'next/font/google';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Toaster } from '@/components/ui/sonner';
import WebViewMessage from '@/app/components/WebViewMessage';

// 扩展全局类型声明
declare global {
  interface Window {
    uni: any;
    // UniApp数据接收函数
    receiveAppData: (data: any) => void;
    handleAppMessage: (data: any) => void;
    // UniApp环境检查
    __uniapp_x_postMessage?: any;
    __uniapp_x_: any;
    __dcloud_weex_postMessage?: any;
    __dcloud_weex_: any;
    // 其他可能的全局变量
    plus?: any;
  }
}

export const metadata: Metadata = {
  title: 'UniApp WebView Demo',
  description: 'NextJS与UniApp WebView数据通信演示',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  userScalable: false,
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
};

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={`${geist.variable}`}>
      <head>
        {/* Define isSpace function globally to fix markdown-it issues with Next.js + Turbopack */}
        <Script id="markdown-it-fix" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined' && typeof window.isSpace === 'undefined') {
              window.isSpace = function(code) {
                return code === 0x20 || code === 0x09 || code === 0x0A || code === 0x0B || code === 0x0C || code === 0x0D;
              };
            }
          `}
        </Script>

        {/* 初始化UniApp数据接收环境 */}
        <Script id="uniapp-init" strategy="beforeInteractive">
          {`
            // 确保在所有组件加载前就准备好接收函数
            if (typeof window !== 'undefined') {
              // 预设一个默认的数据接收函数，防止uni-app端调用时函数不存在
              window.receiveAppData = window.receiveAppData || function(data) {
                console.log('默认receiveAppData被调用，数据:', data);
                // 将数据存储到临时位置，等待组件挂载后处理
                window._tempUniAppData = window._tempUniAppData || [];
                window._tempUniAppData.push({
                  type: 'receiveAppData',
                  data: data,
                  timestamp: Date.now()
                });
              };
              
              window.handleAppMessage = window.handleAppMessage || function(data) {
                console.log('默认handleAppMessage被调用，数据:', data);
                window._tempUniAppData = window._tempUniAppData || [];
                window._tempUniAppData.push({
                  type: 'handleAppMessage',
                  data: data,
                  timestamp: Date.now()
                });
              };
            }
          `}
        </Script>
      </head>
      <body>
        <WebViewMessage />
        <AntdRegistry>{children}</AntdRegistry>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#fef2f0',
              color: 'red',
            },
          }}
          duration={3000}
        />
        <Script src="/script/uni.webview.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
