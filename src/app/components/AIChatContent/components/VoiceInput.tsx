'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';

// 声明语音识别类型
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceInputProps {
  searchValue: string;
  setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ searchValue, setSearchValue, isListening, onListeningChange }) => {
  // 语音识别相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // 语音识别实例
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // 长按相关状态
  const pressStartTimeRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxRecordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const keepAliveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPressing = useRef(false);
  const MIN_PRESS_DURATION = 800; // 最小按压时间 800ms
  const MAX_RECORDING_DURATION = 600000; // 最大录音时间 600秒

  // 创建语音识别实例
  const createSpeechRecognition = useCallback(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';

        // 移动端特殊配置
        if (isMobile) {
          // 移动端设置更保守的配置
          recognition.maxAlternatives = 1;
        }

        console.log('创建语音识别实例', '设备类型:', isMobile ? '移动端' : '桌面端');
        return recognition;
      }
    }
    return null;
  }, []);

  // 设置语音识别事件监听器
  const setupRecognitionEvents = useCallback(
    (recognition: any) => {
      recognition.onstart = () => {
        console.log('语音识别开始');
        onListeningChange(true);
        isListeningRef.current = true;
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setSearchValue(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error(
          '语音识别错误:',
          event.error,
          '设备类型:',
          /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? '移动端' : '桌面端',
        );
        if (event.error === 'not-allowed') {
          toast.error('请允许麦克风权限');
        } else if (event.error === 'no-speech') {
          // 移动端经常出现 no-speech，不要立即报错，而要重试
          const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
          if (isMobile && isPressing.current) {
            console.log('移动端检测到 no-speech，继续监听');
            return; // 不重置状态，继续监听
          }
          toast.warning('未检测到语音');
        } else if (event.error === 'aborted') {
          // 识别被中止，不显示错误
          console.log('语音识别被中止');
        } else if (event.error === 'network') {
          toast.error('网络错误，请重试');
        } else {
          toast.error('语音识别失败');
        }
        // 确保状态重置
        setTimeout(() => {
          onListeningChange(false);
          setIsRecording(false);
          isListeningRef.current = false;
        }, 0);
      };

      recognition.onend = () => {
        const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
        console.log('语音识别结束', '设备类型:', isMobile ? '移动端' : '桌面端', '按压状态:', isPressing.current);

        // 移动端如果还在按压中，尝试重新启动识别
        if (isMobile && isPressing.current && isListeningRef.current) {
          console.log('移动端语音识别意外结束，尝试重新启动');
          setTimeout(() => {
            if (isPressing.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log('移动端重新启动语音识别成功');
              } catch (error) {
                console.error('移动端重新启动语音识别失败:', error);
                // 重新创建实例
                const newRecognition = createSpeechRecognition();
                if (newRecognition) {
                  setupRecognitionEvents(newRecognition);
                  recognitionRef.current = newRecognition;
                  try {
                    newRecognition.start();
                    console.log('移动端重新创建实例并启动成功');
                  } catch (recreateError) {
                    console.error('移动端重新创建实例失败:', recreateError);
                    forceStopRecording();
                  }
                }
              }
            }
          }, 100);
          return;
        }

        // 延迟重置状态，确保所有异步操作完成
        setTimeout(() => {
          console.log('重置语音识别状态');
          onListeningChange(false);
          setIsRecording(false);
          isListeningRef.current = false;
          isPressing.current = false; // 确保按压状态也重置
        }, 0);
      };
    },
    [createSpeechRecognition, onListeningChange, setSearchValue],
  );

  // 清理所有定时器
  const clearAllTimers = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (maxRecordingTimerRef.current) {
      clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = null;
    }
    if (keepAliveTimerRef.current) {
      clearTimeout(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
    }
  };

  // 强制停止录音
  const forceStopRecording = useCallback(() => {
    console.log('强制停止录音，当前状态:', { isRecording, isListening, isPressing: isPressing.current });

    isPressing.current = false;
    clearAllTimers();

    // 强制停止语音识别实例
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort(); // 强制中止
      }
    } catch (error) {
      console.log('停止语音识别时出错:', error);
    }

    // 强制重置所有状态
    setIsRecording(false);
    onListeningChange(false);
    isListeningRef.current = false;

    console.log('强制停止录音完成');
  }, [isRecording, isListening, onListeningChange]);

  // 开始语音识别
  const handleStartListening = () => {
    console.log('尝试开始语音识别，当前状态:', {
      speechSupported,
      isListeningRef: isListeningRef.current,
      isRecording,
      isListening,
    });

    if (!speechSupported) {
      toast.error('浏览器不支持语音识别');
      return;
    }

    // 如果已经在录音或监听中，直接返回
    if (isListeningRef.current || isRecording || isListening) {
      console.log('已经在录音中，返回');
      return;
    }

    try {
      // 强制停止并重新创建语音识别实例
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (e) {
          console.log('停止之前的识别实例时出错:', e);
        }
      }

      // 延迟启动以确保之前的识别完全停止
      setTimeout(() => {
        if (!isListeningRef.current && isPressing.current) {
          console.log('开始启动语音识别');
          try {
            recognitionRef.current?.start();
          } catch (startError) {
            console.error('启动语音识别失败，尝试重新创建实例:', startError);
            // 重新创建语音识别实例
            try {
              const newRecognition = createSpeechRecognition();
              if (newRecognition) {
                // 重新绑定事件
                setupRecognitionEvents(newRecognition);
                recognitionRef.current = newRecognition;
                // 再次尝试启动
                newRecognition.start();
                console.log('重新创建实例并启动成功');
              } else {
                throw new Error('无法创建新的语音识别实例');
              }
            } catch (recreateError) {
              console.error('重新创建实例失败:', recreateError);
              forceStopRecording();
              toast.error('语音识别启动失败，请重试');
            }
          }
        }
      }, 200);
    } catch (error) {
      console.error('启动语音识别失败:', error);
      toast.error('启动语音识别失败');
      // 重置状态
      forceStopRecording();
    }
  };

  // 停止语音识别
  const handleStopListening = () => {
    try {
      setIsRecording(false);
      onListeningChange(false);
      isListeningRef.current = false;

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('停止语音识别失败:', error);
      // 强制重置状态
      setIsRecording(false);
      onListeningChange(false);
      isListeningRef.current = false;
    }
  };

  // 开始长按计时
  const handlePressStart = () => {
    const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
    console.log('开始按压，当前状态:', {
      isPressing: isPressing.current,
      isRecording,
      isListening,
      deviceType: isMobile ? '移动端' : '桌面端',
    });

    // 如果已经在按压中或者正在录音，忽略
    if (isPressing.current || isRecording || isListening) {
      console.log('已在录音状态中，忽略按压');
      return;
    }

    // 先强制清理之前的状态（防止异常状态残留）
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }
    } catch (e) {
      console.log('清理之前状态时出错:', e);
    }

    isPressing.current = true;
    pressStartTimeRef.current = Date.now();
    setIsRecording(true);
    onListeningChange(false);
    isListeningRef.current = false;

    console.log('开始长按计时');

    // 移动端请求屏幕保持唤醒
    if (isMobile) {
      try {
        if ('wakeLock' in navigator) {
          (navigator as any).wakeLock
            .request('screen')
            .then(() => {
              console.log('移动端录音时获取屏幕唤醒锁成功');
            })
            .catch((error: any) => {
              console.log('移动端获取屏幕唤醒锁失败:', error);
            });
        }
      } catch (error) {
        console.log('移动端屏幕唤醒锁不支持:', error);
      }
    }

    // 设置长按定时器
    longPressTimerRef.current = setTimeout(() => {
      if (isPressing.current) {
        handleStartListening();
        // 设置最大录音时间保护
        maxRecordingTimerRef.current = setTimeout(() => {
          toast.warning('录音时间已达上限');
          forceStopRecording();
        }, MAX_RECORDING_DURATION);

        // 移动端设置保活机制（每10秒检查一次语音识别状态）
        const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
        if (isMobile) {
          const keepAlive = () => {
            if (isPressing.current) {
              console.log('移动端保活检查，当前状态:', {
                isPressing: isPressing.current,
                isListening: isListeningRef.current,
                recognitionState: recognitionRef.current?.state || 'unknown',
              });

              // 如果按压中但语音识别未在监听，尝试重新启动
              if (!isListeningRef.current && recognitionRef.current) {
                console.log('移动端检测到语音识别异常停止，尝试重新启动');
                try {
                  recognitionRef.current.start();
                } catch (error) {
                  console.log('移动端重新启动失败，重新创建实例');
                  const newRecognition = createSpeechRecognition();
                  if (newRecognition) {
                    setupRecognitionEvents(newRecognition);
                    recognitionRef.current = newRecognition;
                    try {
                      newRecognition.start();
                    } catch (e) {
                      console.error('移动端重新创建实例后启动失败:', e);
                    }
                  }
                }
              }

              // 继续下一次检查
              keepAliveTimerRef.current = setTimeout(keepAlive, 10000);
            }
          };

          keepAliveTimerRef.current = setTimeout(keepAlive, 10000);
        }
      }
    }, MIN_PRESS_DURATION);
  };

  // 结束按压
  const handlePressEnd = () => {
    if (!isPressing.current) return;

    const pressDuration = Date.now() - pressStartTimeRef.current;
    isPressing.current = false;

    // 清除所有定时器
    clearAllTimers();

    // 如果按压时间太短
    if (pressDuration < MIN_PRESS_DURATION) {
      setIsRecording(false);
      toast.warning('说话时间太短，请长按录音');
      return;
    }

    // 如果正在监听，停止语音识别
    if (isListening) {
      handleStopListening();
    } else {
      setIsRecording(false);
    }
  };

  // 处理麦克风按钮的鼠标事件
  const handleMicMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePressStart();
  };

  const handleMicMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    handlePressEnd();
  };

  // 处理麦克风按钮的触摸事件（移动端）
  const handleMicTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlePressStart();
  };

  const handleMicTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlePressEnd();
  };

  // 处理触摸取消事件（系统中断触摸）
  const handleMicTouchCancel = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handlePressEnd();
  };

  // 初始化语音识别
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = createSpeechRecognition();

        if (!recognition) return;

        // 设置事件监听器
        setupRecognitionEvents(recognition);
        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
        console.warn('浏览器不支持语音识别');
      }

      // 添加页面可见性监听（防止页面隐藏时录音卡住）
      const handleVisibilityChange = () => {
        if (document.hidden && (isRecording || isListening)) {
          console.log('页面隐藏，强制停止录音');
          setTimeout(() => forceStopRecording(), 100);
        }
      };

      // 移动端添加特殊事件监听
      const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
      let wakeLock: any = null;

      if (isMobile) {
        // 尝试获取屏幕唤醒锁（防止屏幕休眠中断录音）
        const requestWakeLock = async () => {
          try {
            if ('wakeLock' in navigator) {
              wakeLock = await (navigator as any).wakeLock.request('screen');
              console.log('移动端获取屏幕唤醒锁成功');
            }
          } catch (error) {
            console.log('移动端获取屏幕唤醒锁失败:', error);
          }
        };

        // 监听录音状态变化
        const handleRecordingStateChange = () => {
          if (isRecording && !wakeLock) {
            requestWakeLock();
          } else if (!isRecording && wakeLock) {
            wakeLock.release();
            wakeLock = null;
            console.log('移动端释放屏幕唤醒锁');
          }
        };
      }

      // 监听页面隐藏事件
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (wakeLock) {
          wakeLock.release();
          console.log('清理时释放屏幕唤醒锁');
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // 清理所有定时器
      clearAllTimers();
    };
  }, [createSpeechRecognition, setupRecognitionEvents, forceStopRecording, isRecording, isListening]);

  return (
    <>
      {/* 录音状态提示 - 底部半圆形弹窗 */}
      {isRecording && (
        <div
          className="fixed right-0 bottom-0 left-0 z-50 flex w-full items-end justify-center"
          onClick={forceStopRecording}
        >
          <div
            className="animate-in slide-in-from-bottom-4 relative flex h-36 w-full flex-col items-center justify-center rounded-t-full bg-[#6678CE] text-white shadow-2xl duration-300"
            onClick={e => e.stopPropagation()}
          >
            {/* 半圆形背景渐变效果 */}
            <div className="absolute inset-0 rounded-t-full bg-gradient-to-t from-[#5a6bc4] to-[#6678CE] opacity-80"></div>

            {/* 麦克风图标 */}
            <div className="relative z-10 mb-2 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-white/20">
              <div className="flex h-10 w-10 animate-bounce items-center justify-center rounded-full bg-white/30">
                <Mic size={20} className="text-white" />
              </div>
            </div>

            {/* 提示文字 */}
            <p className="relative z-10 text-center text-sm font-medium">
              {!isListening ? '长按说话' : '松开发送，点击空白取消'}
            </p>

            {/* 音波动画 */}
            <div className="relative z-10 mt-2 flex items-center">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="mx-0.5 h-1 w-1 animate-pulse rounded-full bg-white"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '1s',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 麦克风按钮 */}
      <Button
        onMouseDown={handleMicMouseDown}
        onMouseUp={handleMicMouseUp}
        onMouseLeave={handleMicMouseUp}
        onTouchStart={handleMicTouchStart}
        onTouchEnd={handleMicTouchEnd}
        onTouchCancel={handleMicTouchCancel}
        className={`absolute bottom-3 left-3 h-8 w-8 rounded-full transition-all duration-200 select-none ${
          isRecording
            ? 'scale-110 animate-pulse bg-red-500'
            : isListening
              ? 'animate-pulse bg-green-500'
              : 'bg-[#6678CE] hover:bg-[#5a6bc4]'
        }`}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'manipulation',
        }}
        size="icon"
      >
        <Mic className={isRecording ? 'animate-bounce' : ''} />
      </Button>
    </>
  );
};

export default VoiceInput;
