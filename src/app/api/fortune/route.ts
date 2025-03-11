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

    const age = calculateAge(new Date(date)).years;
    console.log(date, age);

    const prompt = `作为一位精通易学、命理的专业算命师，请根据以下信息为求测者${name}进行全面周详的命运分析：

【基本信息】
姓名：${name}
性别：${gender}
${birthplace ? `出生地：${birthplace}` : ''}
今日阳历：${new Date().toLocaleDateString()}
出生阳历：${date}
出生农历：${lunarDate}
出生时辰：${chineseHour}
当前年龄：${age}岁

【八字信息】
${pillars?.year ? `年柱：${pillars.year}` : ''}
${pillars?.month ? `月柱：${pillars.month}` : ''}
${pillars?.day ? `日柱：${pillars.day}` : ''}
${pillars?.hour ? `时柱：${pillars.hour}` : ''}

【分析范围】
请根据求测者年龄阶段重点分析：
- ${age < 18 ? '学业发展、天赋潜能、健康成长、亲子关系' : ''}
- ${age >= 18 && age < 30 ? '事业起步、学业深造、感情发展、自我定位' : ''}
- ${age >= 30 && age < 45 ? '事业发展、财富积累、婚姻家庭、健康管理' : ''}
- ${age >= 45 && age < 60 ? '事业巅峰、财富规划、家庭和谐、健康养生' : ''}
- ${age >= 60 ? '健康长寿、晚年规划、家庭和睦、心灵修养' : ''}

【详细分析项目】
1. 命格总论：八字强弱、五行喜忌、命主格局
2. 当前运势：流年流月吉凶、近期运势波动
3. 事业分析：事业方向、职业适配、发展机遇与挑战
4. 财运解析：财富来源、积累方式、理财建议
5. 感情婚姻：感情特质、缘分际遇、婚姻质量
6. 健康状况：体质分析、易患疾病、养生建议
7. 家庭关系：与父母子女关系、家庭和谐度
8. 性格特质：先天性格、后天养成、人际关系
9. 学业/智慧：学习能力、知识获取、智慧发展
10. 吉凶方位：有利方向、忌讳方位、住居选择
11. 贵人与阻力：贵人特征、阻碍来源、如何获得助力
12. 开运指南：五行调和方法、吉祥物品、行为调整

请以古韵今风的语言进行分析，既要有传统命理的专业性，又要符合现代人的思维方式。分析时请特别注意：
- 姓名五行对命局的影响与调和
- 出生地理环境对命主的潜在影响
- 八字中的特殊格局与组合
- 当前大运流年与原命盘的互动关系
- 根据性别特点给予更具针对性的建议
- 提供实用且可操作的改运方法

最后，请给予求测者积极向上、助其趋吉避凶的指导，帮助其了解自身优势与挑战，从而更好地把握人生方向。`;

    const response = await fetch(
      `${process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
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
