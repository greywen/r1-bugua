import { calculateAge } from '@/utils';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { name, gender, birthplace, date, lunarDate, chineseHour, pillars } =
      await request.json();

    if (name.length > 4) {
      throw new Error('Name is to long');
    }

    if (birthplace.length > 20) {
      throw new Error('Birthplace is to long');
    }

    const age = calculateAge(date);

    const prompt = `作为一个专业的算命师，请根据以下信息为这位求测者进行运势分析：
个人信息：
姓名：${name}
性别：${gender}
${birthplace && `出生地点：${birthplace}`}

时间信息：
阳历：${date}
农历：${lunarDate}
时辰：${chineseHour}
年龄：${age}
${pillars?.year && `年注：${pillars.year}`}
${pillars?.month && `月注：${pillars.month}`}
${pillars?.day && `日注：${pillars.day}`}
${pillars?.hour && `时注：${pillars.hour}`}

请从以下几个方面进行分析：
1. 整体运势
2. 事业运势
3. 财运分析
4. 感情运势
5. 健康提醒
6. 开运建议
7. 流年运势
8. 五行分析
9. 性格分析
10. 吉凶方位
11. 灾难规避
等

请用专业且富有诗意的语言描述，并给出具体的建议。在分析时请考虑：
- 姓名对运势的影响
- 当前年龄段需要关注的点
- 性别特点
- 出生地点的地理特征
- 农历日期和时辰的五行属性

请给出详细且专业的分析。`;

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
          model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
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
