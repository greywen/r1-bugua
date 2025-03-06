'use client';

import Image from 'next/image';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { Lunar } from 'lunar-typescript';
import { motion } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';
// import '../../styles/datepicker.css';
import { registerLocale } from 'react-datepicker';
import zhCN from 'date-fns/locale/zh-CN';

// 注册中文语言包
registerLocale('zh-CN', zhCN);

// 时辰映射
const CHINESE_HOURS = {
  子时: '23:00',
  丑时: '01:00',
  寅时: '03:00',
  卯时: '05:00',
  辰时: '07:00',
  巳时: '09:00',
  午时: '11:00',
  未时: '13:00',
  申时: '15:00',
  酉时: '17:00',
  戌时: '19:00',
  亥时: '21:00',
};

// 获取时辰名称
const getChineseHour = (date: Date): string => {
  const hour = date.getHours();
  const hourMap: { [key: number]: string } = {
    23: '子时',
    0: '子时',
    1: '丑时',
    2: '丑时',
    3: '寅时',
    4: '寅时',
    5: '卯时',
    6: '卯时',
    7: '辰时',
    8: '辰时',
    9: '巳时',
    10: '巳时',
    11: '午时',
    12: '午时',
    13: '未时',
    14: '未时',
    15: '申时',
    16: '申时',
    17: '酉时',
    18: '酉时',
    19: '戌时',
    20: '戌时',
    21: '亥时',
    22: '亥时',
  };
  return hourMap[hour] || '';
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [lunarDate, setLunarDate] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [birthplace, setBirthplace] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [fortune, setFortune] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [reasoning, setReasoning] = useState<string>('');

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    const lunar = Lunar.fromDate(date!);
    setLunarDate(
      `${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`
    );
  };

  const handleFortuneTelling = async () => {
    if (!selectedDate || !name) {
      setError('请填写所有必要信息');
      return;
    }

    setIsLoading(true);
    setError('');
    setFortune('');
    setReasoning('');

    try {
      const response = await fetch('/api/fortune', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          gender,
          birthplace,
          date: format(selectedDate, 'yyyy-MM-dd HH:mm'),
          lunarDate,
          chineseHour: getChineseHour(selectedDate),
        }),
      });

      if (!response.ok) {
        throw new Error('获取运势失败');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      let result = '';
      let currentReasoning = '';
      let buffer = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          let lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const l = line.slice(6);
              if (l === '[DONE]') {
                reader?.cancel();
                break;
              }
              const parsed = JSON.parse(l);
              if (parsed.t === 'content') {
                result += parsed.r;
                setFortune(result);
              } else if (parsed.t === 'reasoning') {
                currentReasoning += parsed.r;
                setReasoning(currentReasoning);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        '少年郎，你我之缘，尚未落定。待时机成熟，贫道自会为你演上一卦，窥探天机。'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'>
      <nav className='glass-nav'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center'>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='flex items-center space-x-2'
              >
                <span className='flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent'>
                  <Image
                    src='/logo.svg'
                    alt='Bu logo'
                    width={40}
                    height={38}
                    priority
                  />
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </nav>

      <main className='pt-20 pb-8 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-3xl mx-auto space-y-8'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='text-center space-y-4'
          >
            <h1 className='text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent'>
              探索命运的奥秘
            </h1>
            <p className='text-gray-400 text-lg'>
              填写您的个人信息，让AI为您解读命运的密码
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='glass-card p-6'
          >
            <h2 className='text-xl font-semibold text-gray-200 mb-6'>
              个人信息
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  姓名<span className='text-red-400'>*</span>
                </label>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='glass-input'
                  placeholder='请输入您的姓名'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  性别<span className='text-red-400'>*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as '男' | '女')}
                  className='glass-input'
                >
                  <option className='bg-gray-600' value='男'>
                    男
                  </option>
                  <option className='bg-gray-600' value='女'>
                    女
                  </option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  出生日期<span className='text-red-400'>*</span>
                </label>
                <div className='relative'>
                  <DatePicker
                    placeholderText='请选择您的出生日期'
                    className='w-full min-w-full glass-input'
                    selected={selectedDate}
                    onChange={handleDateChange}
                    showTimeSelect
                    timeIntervals={60}
                    timeFormat='HH:mm'
                    dateFormat='yyyy年MM月dd日 HH:mm'
                    locale='zh-CN'
                    customInput={<input readOnly />}
                    renderCustomHeader={({
                      date,
                      changeYear,
                      changeMonth,
                      decreaseMonth,
                      increaseMonth,
                      prevMonthButtonDisabled,
                      nextMonthButtonDisabled,
                    }) => (
                      <div className='flex items-center justify-between px-2 py-2  rounded-t-lg'>
                        <button
                          onClick={decreaseMonth}
                          disabled={prevMonthButtonDisabled}
                          className='p-1  rounded-full disabled:opacity-50'
                        >
                          <svg
                            className='w-5 h-5 text-gray-300'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15 19l-7-7 7-7'
                            />
                          </svg>
                        </button>
                        <div className='flex items-center space-x-2'>
                          <select
                            value={date.getFullYear()}
                            onChange={({ target: { value } }) =>
                              changeYear(Number(value))
                            }
                            className=' scrollbar-none text-gray-700 rounded px-2 py-1 text-sm focus: outline-none'
                          >
                            {Array.from(
                              { length: 120 },
                              (_, i) => new Date().getFullYear() - i
                            ).map((year) => (
                              <option key={year} value={year}>
                                {year}年
                              </option>
                            ))}
                          </select>
                          <select
                            value={date.getMonth()}
                            onChange={({ target: { value } }) =>
                              changeMonth(Number(value))
                            }
                            className=' text-gray-700 rounded px-2 py-1 text-sm focus: outline-none'
                          >
                            {Array.from({ length: 12 }, (_, i) => i).map(
                              (month) => (
                                <option key={month} value={month}>
                                  {month + 1}月
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <button
                          onClick={increaseMonth}
                          disabled={nextMonthButtonDisabled}
                          className='p-1  rounded-full disabled:opacity-50'
                        >
                          <svg
                            className='w-5 h-5 text-gray-700'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 5l7 7-7 7'
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  />
                </div>
                {lunarDate && selectedDate && (
                  <p className='text-sm text-gray-300 pt-2'>
                    {lunarDate} {getChineseHour(selectedDate)}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  出生地
                </label>
                <input
                  type='text'
                  value={birthplace}
                  onChange={(e) => setBirthplace(e.target.value)}
                  className='glass-input'
                  placeholder='请输入您的出生地'
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className='flex justify-center'
          >
            <button
              onClick={handleFortuneTelling}
              disabled={isLoading}
              className='glass-button text-lg px-8 py-4'
            >
              {isLoading ? '正在解读...' : '开始解读'}
            </button>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className='text-red-400 text-center'
            >
              {error}
            </motion.div>
          )}

          {(fortune || reasoning) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className='glass-card p-6 space-y-6'
            >
              {reasoning && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-200 mb-3'>
                    推理过程
                  </h3>
                  <div className='text-gray-300 whitespace-pre-wrap'>
                    {reasoning}
                  </div>
                </div>
              )}
              {fortune && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-200 mb-3'>
                    运势解读
                  </h3>
                  <div className='text-gray-300 whitespace-pre-wrap'>
                    {fortune}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
