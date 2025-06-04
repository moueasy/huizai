// 扩展OpenAI ChatCompletionChunk的Delta类型，添加reasoning_content属性
// 这是为了支持DeepSeek R1模型的推理内容功能
declare module 'openai/resources/chat/completions' {
  namespace ChatCompletionChunk {
    namespace Choice {
      interface Delta {
        /**
         * DeepSeek R1模型的推理过程内容
         */
        reasoning_content?: string;
      }
    }
  }
}

export {};
