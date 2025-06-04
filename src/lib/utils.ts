import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 睡眠函数
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
