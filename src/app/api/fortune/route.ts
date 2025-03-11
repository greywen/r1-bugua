import { interpretationTypes } from '@/app/types';
import { calculateAge, calculateFourPillars, getChineseHour } from '@/utils';
import { Lunar } from 'lunar-typescript';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, gender, birthplace, date, selectedTypes } =
      await request.json();

    if (name.length > 4) {
      throw new Error('Name is to long');
    }

    if (birthplace.length > 20) {
      throw new Error('Birthplace is to long');
    }

    if (selectedTypes?.length > 4) {
      throw new Error('Too many types');
    }

    if (
      selectedTypes?.filter((x: string) =>
        interpretationTypes.flat().includes(x)
      ).length !== selectedTypes?.length
    ) {
      throw new Error('Type is error');
    }

    const newDate = new Date(date);
    const age = calculateAge(new Date(newDate)).years;
    const lunar = Lunar.fromDate(newDate);

    const pillars = calculateFourPillars(newDate);

    const prompt = `作为一位精通易学、命理的专业算命师，请根据以下信息为求测者${name}进行全面周详的命运分析：

【基本信息】
姓名：${name}
性别：${gender}
${birthplace ? `出生地：${birthplace}` : ''}
今日阳历：${new Date().toLocaleDateString()}
出生阳历：${date}
出生农历：${`${lunar.getYearInChinese()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`}
出生时辰：${getChineseHour(newDate)}
当前年龄：${age}岁

【八字信息】
${pillars?.year ? `年柱：${pillars.year}` : ''}
${pillars?.month ? `月柱：${pillars.month}` : ''}
${pillars?.day ? `日柱：${pillars.day}` : ''}
${pillars?.hour ? `时柱：${pillars.hour}` : ''}

【分析范围】
请根据求测者年龄阶段重点分析：
${
  selectedTypes?.length > 0
    ? selectedTypes.join('、')
    : `${age < 18 ? '- 学业发展、天赋潜能、健康成长、亲子关系' : ''}
    ${age >= 18 && age < 30 ? '- 事业起步、学业深造、感情发展、自我定位' : ''}
    ${age >= 30 && age < 45 ? '- 事业发展、财富积累、婚姻家庭、健康管理' : ''}
    ${age >= 45 && age < 60 ? '- 事业巅峰、财富规划、家庭和谐、健康养生' : ''}
    ${age >= 60 ? '- 健康长寿、晚年规划、家庭和睦、心灵修养' : ''}`
}

请以通俗易懂的语言进行分析，既要有传统命理的专业性，又要符合现代人的思维方式。
最后，请给予求测者积极向上、助其趋吉避凶的指导，帮助其了解自身优势与挑战，从而更好地把握人生方向。`;

    const response = await fetch(
      `${
        process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
      }/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || 'deepseek-reasoner',
          messages: [
            {
              role: 'system',
              content:
                '你是一位经验丰富的算命师，精通八字、紫微斗数、阴阳五行学说、天干地支、八卦、历法、命理学基础等传统命理学说。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          stream: true,
          temperature: 0.7,
          top_p: 0.9,
          presence_penalty: 0.6,
          frequency_penalty: 0.5,
          max_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('API 请求失败');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      new Error('无法读取响应');
    }

    let buffer = '';
    const decoder = new TextDecoder();

    return new NextResponse(
      new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();
          const push = (data: { t: string; r?: string }) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
            );
          };

          try {
            while (true) {
              const { value, done } = await reader!.read();
              if (done) {
                break;
              }

              if (value) {
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.startsWith('data: ')) {
                    const l = line.slice(6);
                    if (l === '[DONE]') {
                      push({
                        t: 'end',
                      });
                      controller.close();
                      return;
                    }
                    const parsed = JSON.parse(l);
                    if (parsed.choices?.[0]?.delta?.reasoning_content) {
                      const message = {
                        t: 'reasoning',
                        r: parsed.choices[0].delta.reasoning_content,
                      };
                      push(message);
                    } else if (parsed.choices?.[0]?.delta?.content) {
                      const message = {
                        t: 'content',
                        r: parsed.choices[0].delta.content,
                      };
                      push(message);
                    } else if (parsed.choices?.[0]?.finish_reason === 'stop') {
                      push({
                        t: 'end',
                      });
                      controller.close();
                    }
                  }
                }
              }
            }
          } catch {
            push({
              t: 'error',
            });
          } finally {
            controller.close();
          }
        },
        cancel() {
          reader?.cancel();
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      }
    );
  } catch (error) {
    console.error('处理请求时出错:', error);
    return NextResponse.json(
      { error: '获取运势失败，请稍后重试' },
      { status: 500 }
    );
  }
}
