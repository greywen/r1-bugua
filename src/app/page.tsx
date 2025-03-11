'use client';

import Image from 'next/image';
import { useState } from 'react';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { Lunar } from 'lunar-typescript';
import { motion } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import zhCN from 'date-fns/locale/zh-CN';
import { FourPillars, tabTypes, interpretationTypes } from './types';
import Markdown from 'react-markdown';
import {
  calculateAge,
  calculateFourPillars,
  getChineseHour,
  getDefaultTypes,
} from '@/utils';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
registerLocale('zh-CN', zhCN);

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [lunarDate, setLunarDate] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [gender, setGender] = useState<'男' | '女'>('男');
  const [birthplace, setBirthplace] = useState<string>('');
  const [age, setAge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fortune, setFortune] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [reasoning, setReasoning] = useState<string>('');
  const [pillar, setPillar] = useState<FourPillars>({
    year: '',
    month: '',
    day: '',
    hour: '',
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  const handleDateChange = (date: Date | null) => {
    if (!date) return;
    const { years, months } = calculateAge(date);
    console.log(selectedDate);
    if (!selectedDate) {
      setSelectedTypes(getDefaultTypes(years));
    }
    setSelectedDate(date);
    setPillar(calculateFourPillars(date));
    setAge(`${years}岁${months}个月`);
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
          selectedTypes,
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

          const lines = buffer.split('\n\n');
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

  const handleCopy = (value: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(value).then(() => {
      alert('复制成功');
    });
  };

  const handleSelectType = (type: string) => {
    if (!selectedTypes.includes(type) && selectedTypes.length >= 4) {
      alert('探寻天机，点到为止。过多追问，恐失其真意。');
      return;
    }
    setSelectedTypes((prev) => {
      if (prev?.includes(type)) {
        return prev.filter((x) => x !== type);
      }
      return [...prev, type];
    });
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
                    alt='R1-BuGua logo'
                    width={40}
                    height={38}
                    priority
                  />
                  R1卜卦
                </span>
              </motion.div>
            </div>
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className='flex items-center space-x-2'
              >
                <a href='https://github.com/greywen/r1-bugua'>
                  <Image
                    src='/github.svg'
                    alt='Github logo'
                    width={28}
                    height={28}
                  />
                </a>
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
                  maxLength={4}
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
                    maxDate={new Date()}
                    placeholderText='请选择您的出生日期'
                    className='w-full min-w-full glass-input z-50'
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
                            onChange={({ target: { value } }) => {
                              const newDate = new Date(
                                date.setFullYear(Number(value))
                              );
                              changeYear(Number(value));
                              handleDateChange(newDate);
                            }}
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
                            onChange={({ target: { value } }) => {
                              const newDate = new Date(
                                date.setMonth(Number(value))
                              );
                              changeMonth(Number(value));
                              handleDateChange(newDate);
                            }}
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
                  <p className='text-sm text-gray-300 py-2'>
                    {lunarDate} {getChineseHour(selectedDate)} {age}
                  </p>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  出生地
                </label>
                <input
                  type='text'
                  maxLength={20}
                  value={birthplace}
                  onChange={(e) => setBirthplace(e.target.value)}
                  className='glass-input'
                  placeholder='请输入您的出生地'
                />
              </div>
            </div>
            {selectedDate && (
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2 my-2'>
                <div className='flex'>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    年柱
                  </label>
                  <input
                    type='text'
                    readOnly
                    value={pillar.year}
                    onChange={(e) =>
                      setPillar({ ...pillar, year: e.target.value })
                    }
                    className='glass-input'
                  />
                </div>
                <div className='flex items-center'>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    月柱
                  </label>
                  <input
                    type='text'
                    readOnly
                    value={pillar.month}
                    onChange={(e) =>
                      setPillar({ ...pillar, month: e.target.value })
                    }
                    className='glass-input'
                  />
                </div>
                <div className='flex'>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    日柱
                  </label>
                  <input
                    type='text'
                    readOnly
                    value={pillar.day}
                    onChange={(e) =>
                      setPillar({ ...pillar, day: e.target.value })
                    }
                    className='glass-input'
                  />
                </div>
                <div className='flex'>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    时柱
                  </label>
                  <input
                    type='text'
                    readOnly
                    value={pillar.hour}
                    onChange={(e) =>
                      setPillar({ ...pillar, hour: e.target.value })
                    }
                    className='glass-input'
                  />
                </div>
              </div>
            )}
            <div>
              <label className='block text-sm font-medium text-gray-300 mt-4'>
                解读内容（默认根据年龄）
              </label>
              <div className='glass-card p-2 mt-4'>
                <div>
                  {selectedTypes.map((x, index) => (
                    <button
                      onClick={() => {
                        handleSelectType(x);
                      }}
                      className='glass-button-outline p-2 m-2'
                      key={'btn-' + index}
                    >
                      {x} <span className='text-lg font-extrabold'>×</span>
                    </button>
                  ))}
                </div>
                <Tabs className='flex gap-4'>
                  <TabList className='flex flex-col space-y-2 min-w-[120px]'>
                    {tabTypes.map((type) => (
                      <Tab
                        key={type}
                        className='cursor-pointer px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-700/50 transition-colors duration-200 outline-none'
                        selectedClassName='bg-[#6366f14d] !text-white'
                      >
                        {type}
                      </Tab>
                    ))}
                  </TabList>
                  <div className='flex-1'>
                    {interpretationTypes.map((type, index) => (
                      <TabPanel
                        key={'tab-panel-' + index}
                        className='prose prose-invert max-w-none break-words whitespace-pre-wrap'
                      >
                        {type.map((x, index) => (
                          <button
                            onClick={() => {
                              handleSelectType(x);
                            }}
                            key={'type-' + index}
                            className={`glass-button-outline p-2 m-2 ${
                              selectedTypes.includes(x)
                                ? 'glass-button-active'
                                : ''
                            }`}
                          >
                            {x}
                          </button>
                        ))}
                      </TabPanel>
                    ))}
                  </div>
                </Tabs>
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
                  <h3 className='text-lg font-semibold text-gray-200 mb-3 flex gap-2'>
                    推理过程
                    <Image
                      onClick={() => {
                        handleCopy(reasoning);
                      }}
                      title='复制'
                      src='/copy.svg'
                      alt='Copy'
                      width={16}
                      height={16}
                      priority
                    />
                  </h3>
                  <div className='text-gray-400 text-sm whitespace-pre-wrap'>
                    <Markdown key='reasoning'>{reasoning}</Markdown>
                  </div>
                </div>
              )}
              {fortune && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-200 mb-3 flex gap-2'>
                    运势解读
                    <Image
                      onClick={() => {
                        handleCopy(fortune);
                      }}
                      title='复制'
                      src='/copy.svg'
                      alt='Copy'
                      width={16}
                      height={16}
                      priority
                    />
                  </h3>
                  <div className='text-gray-300 whitespace-pre-wrap'>
                    <Markdown key='fortune'>{fortune}</Markdown>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className='text-gray-400 tracking-wider'>
              <p className='text-2xl font-bold py-2'>免责声明</p>
              本网站提供的所有内容仅供娱乐和参考用途，不具有任何科学依据或专业建议性质。本站所涉及的算命、占卜等相关服务仅为用户提供休闲娱乐体验，不能作为决策依据或替代专业建议。
              <p className='font-bold py-1'>请注意：</p>
              <p>1. 本网站不保证内容的准确性或可靠性，相关结果仅供参考。</p>
              <p>2. 用户需自行判断和承担使用本网站服务所产生的任何后果。</p>
              <p>
                3. 本网站不支持、不鼓励任何形式的迷信活动，请理性看待相关内容。
              </p>
              <p className='text-lg font-bold py-2'>隐私保护声明</p>
              本网站严格遵守用户隐私保护原则：
              <p>
                1.
                本网站完全开源免费、不会收集、存储或分享任何用户的个人信息或数据。
              </p>
              <p>
                2.
                用户在使用服务过程中所输入的信息均不被保存，所有操作均完全匿名。
              </p>
              <p>
                3.
                本网站的服务基于即时生成，用户数据不会被记录或用于任何其他用途。
              </p>
              如您对任何个人或专业问题有疑问，请寻求专业人士或机构的建议。
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
