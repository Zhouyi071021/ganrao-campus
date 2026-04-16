// 赣饶·广丰校圈 QQ频道配置
const qrcodeUrl = new URL('/images/qrcode.jpg', import.meta.url).href

export const channelConfig = {
  name: '赣饶·广丰校圈',
  url: 'https://pd.qq.com/s/9y1wupend?b=9', // 替换为你的真实频道链接
  qrcode: qrcodeUrl,
  joinText: '扫码加入QQ频道，一起聊天',
}