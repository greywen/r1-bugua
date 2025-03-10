# R1 卜卦

## 本地运行

1. 安装依赖

```bash
npm i 
```

2. 设置 DeepSeek

根目录下 .env 文件设置 DeepSeek 配置

```bash
DEEPSEEK_BASE_URL=Your URL 
DEEPSEEK_API_KEY=Your Key 
DEEPSEEK_MODEL=Your model name
```

3. 运行

```bash
npm run dev
```

## 部署

Docker
```bash
docker pull docker.io/graywen/r1-bugua
```
```bash
docker run --restart unless-stopped --name r1-bugua -p 3000:3000 -e DEEPSEEK_API_KEY=Your Key graywen/r1-bugua
```

其他 DeepSeek 提供商可传入环境变量：

```bash
docker run -e DEEPSEEK_BASE_URL=Your URL DEEPSEEK_API_KEY=Your Key DEEPSEEK_MODEL=Your model name --name r1-bugua -p 3000:3000 greywen/bugua
```

## 免责声明

本项目提供的所有内容仅供娱乐和参考用途，不具有任何科学依据或专业建议性质。项目所涉及的算命、占卜等相关服务仅为用户提供休闲娱乐体验，不能作为决策依据或替代专业建议。

请注意：
1. 本项目不保证内容的准确性或可靠性，相关结果仅供参考。
2. 用户需自行判断和承担使用本项目服务所产生的任何后果。
3. 本项目不支持、不鼓励任何形式的迷信活动，请理性看待相关内容。

隐私保护声明

本项目严格遵守用户隐私保护原则：
1. 本项目完全开源免费、不会收集、存储或分享任何用户的个人信息或数据。

2. 用户在使用服务过程中所输入的信息均不被保存，所有操作均完全匿名。

3. 本项目的服务基于即时生成，用户数据不会被记录或用于任何其他用途。

如您对任何个人或专业问题有疑问，请寻求专业人士或机构的建议。