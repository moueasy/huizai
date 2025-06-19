'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Keyboard, Mic } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

// 声明语音识别类型
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceInputProps {
  searchValue: string;
  // setSearchValue: React.Dispatch<React.SetStateAction<string>>;
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
  handleSubmit: (value: string) => void;
}

const VoiceInput: React.FC<VoiceInputProps> = ({
  searchValue,
  // setSearchValue,
  isListening,
  onListeningChange,
  handleSubmit,
}) => {
  // 语音识别相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  // 是否在取消区域
  const [isInCancelZone, setIsInCancelZone] = useState(false);
  // 键盘/语音
  const [isInput, setIsInput] = useState(true);

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
  const MAX_RECORDING_DURATION = 60000; // 最大录音时间 60秒

  // 创建语音识别实例
  const createSpeechRecognition = useCallback(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
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
          // setSearchValue(prev => prev + finalTranscript);
          handleSubmit(finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error(
          '语音识别错误:',
          event.error,
          '设备类型:',
          /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? '移动端' : '桌面端',
        );

        // 只重置语音识别状态，不关闭弹窗
        onListeningChange(false);
        isListeningRef.current = false;

        if (event.error === 'not-allowed') {
          toast.error('请允许麦克风权限');
          window.uni.webView.postMessage({
            data: {
              key: 'permission',
              type: 'RECORD_AUDIO',
            },
          });
        } else if (event.error === 'no-speech') {
          // 移动端经常出现 no-speech，不要立即报错，而要重试
          const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
          if (isMobile && isPressing.current) {
            console.log('移动端检测到 no-speech，继续监听');
            // 尝试重新启动识别
            setTimeout(() => {
              if (isPressing.current) {
                handleStartListening();
              }
            }, 500);
            return;
          }
          // toast.warning('未检测到语音');
        } else if (event.error === 'aborted') {
          // 识别被中止，不显示错误
          console.log('语音识别被中止');
        } else if (event.error === 'network') {
          // toast.error('网络错误，请重试');
        } else {
          // toast.error('语音识别失败');
        }
      };

      recognition.onend = () => {
        const isMobile = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent);
        console.log('语音识别结束', '设备类型:', isMobile ? '移动端' : '桌面端', '按压状态:', isPressing.current);

        // 只重置语音识别状态，不关闭弹窗
        onListeningChange(false);
        isListeningRef.current = false;

        // 如果用户还在按压中，尝试重新启动识别
        if (isPressing.current) {
          console.log('用户仍在按压，尝试重新启动语音识别');
          setTimeout(() => {
            if (isPressing.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
                console.log('重新启动语音识别成功');
              } catch (error) {
                console.error('重新启动语音识别失败:', error);
                // 重新创建实例
                const newRecognition = createSpeechRecognition();
                if (newRecognition) {
                  setupRecognitionEvents(newRecognition);
                  recognitionRef.current = newRecognition;
                  try {
                    newRecognition.start();
                    console.log('重新创建实例并启动成功');
                  } catch (recreateError) {
                    console.error('重新创建实例失败:', recreateError);
                  }
                }
              }
            }
          }, 100);
        }
      };
    },
    [createSpeechRecognition, onListeningChange, handleSubmit],
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

  // 只停止语音识别，不关闭弹窗
  const stopSpeechRecognition = useCallback(() => {
    console.log('停止语音识别，保持弹窗开启');

    // 只重置语音识别状态
    onListeningChange(false);
    isListeningRef.current = false;

    // 停止语音识别实例
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }
    } catch (error) {
      console.log('停止语音识别时出错:', error);
    }
  }, [onListeningChange]);

  // 强制停止录音（仅在用户操作时调用）
  const forceStopRecording = useCallback(() => {
    console.log('用户操作：强制停止录音和关闭弹窗');

    isPressing.current = false;
    clearAllTimers();

    // 停止语音识别实例
    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      }
    } catch (error) {
      console.log('停止语音识别时出错:', error);
    }

    // 重置所有状态
    setIsRecording(false);
    onListeningChange(false);
    isListeningRef.current = false;

    console.log('用户操作：强制停止录音完成');
  }, [onListeningChange]);

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

    // 如果已经在监听中，直接返回
    if (isListeningRef.current) {
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
              // toast.error('语音识别启动失败，请重试');
            }
          }
        }
      }, 200);
    } catch (error) {
      console.error('启动语音识别失败:', error);
      // toast.error('启动语音识别失败');
    }
  };

  // 停止语音识别（不关闭弹窗）
  const handleStopListening = () => {
    try {
      onListeningChange(false);
      isListeningRef.current = false;

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error('停止语音识别失败:', error);
      // 强制重置语音识别状态
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

    // 如果已经在按压中，忽略
    if (isPressing.current) {
      console.log('已在按压状态中，忽略按压');
      return;
    }

    // 先停止之前的语音识别（但不重置弹窗状态）
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
                recognitionState: recognitionRef.current?.state ?? 'unknown',
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

    // 停止语音识别并关闭弹窗
    handleStopListening();
    setIsRecording(false);
    setIsInCancelZone(false);
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

  const handleMicTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isListening) return;
    // 获取触摸位置
    const touch = e.touches[0];
    if (!touch) return;

    const { clientY } = touch;
    const windowHeight = window.innerHeight;

    // 弹窗区域大致为屏幕底部 144px（h-36 = 144px）
    const popupZoneTop = windowHeight - 144;

    // 如果手指移动到弹窗区域之外（向上移动），则进入取消区域
    const inCancelZone = clientY < popupZoneTop;
    setIsInCancelZone(inCancelZone);
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
      const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
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

      // 添加页面可见性监听（页面隐藏时只停止语音识别，不关闭弹窗）
      const handleVisibilityChange = () => {
        if (document.hidden && isListening) {
          console.log('页面隐藏，停止语音识别但保持弹窗');
          stopSpeechRecognition();
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
  }, [createSpeechRecognition, setupRecognitionEvents, stopSpeechRecognition, isRecording, isListening]);

  return (
    <>
      {/* 录音状态提示 - 底部半圆形弹窗 */}
      {isRecording && (
        <>
          {/* 遮罩层 */}
          <div className="fixed inset-0 z-40 bg-black/50" />
          <div
            className="fixed right-0 bottom-0 left-0 z-50 flex w-full items-end justify-center"
            onClick={forceStopRecording}
          >
            <div
              className={`animate-in slide-in-from-bottom-4 relative flex h-36 w-full flex-col items-center justify-end rounded-t-full text-white shadow-2xl duration-300 ${
                isInCancelZone ? 'bg-red-500' : 'bg-[#6678CE]'
              }`}
              onClick={e => e.stopPropagation()}
            >
              {/* 提示文字 */}
              <p className="relative z-10 text-center text-sm font-medium">松开发送，上移取消</p>

              {/* 音轨无缝滚动 */}
              <div className="relative z-10 my-4 flex w-60 items-center overflow-hidden">
                <div className="track-scroll-animation flex items-center">
                  <Image src="/image/track.png" alt="track" width={240} height={20} className="flex-shrink-0" />
                  <Image src="/image/track.png" alt="track" width={240} height={20} className="flex-shrink-0" />
                </div>
              </div>

              {/* 麦克风图标 */}
              <div className="relative z-10 mb-4 flex items-center justify-center rounded-full">
                <Mic className="text-white" />
              </div>
            </div>
          </div>
        </>
      )}

      <Button
        className={`absolute bottom-3 left-3 h-8 w-8 rounded-full transition-all duration-200 select-none ${
          isRecording
            ? 'scale-110 animate-pulse bg-red-500'
            : isListening
              ? 'animate-pulse bg-green-500'
              : 'bg-[#6678CE] hover:bg-[#5a6bc4]'
        }`}
        onClick={() => setIsInput(!isInput)}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          touchAction: 'manipulation',
        }}
        size="icon"
      >
        {isInput ? <Mic className={isRecording ? 'animate-bounce' : ''} /> : <Keyboard />}
      </Button>

      {/* 麦克风按钮 */}
      {!isInput && (
        <Button
          onMouseDown={handleMicMouseDown}
          onMouseUp={handleMicMouseUp}
          onMouseLeave={handleMicMouseUp}
          onTouchStart={handleMicTouchStart}
          onTouchMove={handleMicTouchMove}
          onTouchEnd={handleMicTouchEnd}
          onTouchCancel={handleMicTouchCancel}
          className={`absolute right-3 bottom-3 z-10 h-8 w-[80%] rounded-full transition-all duration-200 select-none ${
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
        >
          按住说话
        </Button>
      )}
    </>
  );
};

export default VoiceInput;
