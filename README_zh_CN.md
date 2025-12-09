




## 📝更新日志

见[CHANGELOG.md](https://cdn.jsdelivr.net/gh/Achuan-2/siyuan-plugin-copilot@main/CHANGELOG.md)


## 功能介绍

在思源笔记中编辑图片，支持裁剪、旋转，添加形状、文字等功能，最大亮点是已编辑的图片支持二次编辑

- 支持裁剪、添加文字、添加矩形等功能
- 保存png图片支持二次编辑之前的标记

![](https://fastly.jsdelivr.net/gh/Achuan-2/PicBed/assets/20251209155326-2025-12-09.png)


## 设置

- 编辑数据存储方式
  - 直接存储在当前图片里：- 图片永久存储编辑历史，不怕编辑历史丢失，图片发送给别人也能保留编辑数据，缺点是图片体积会变大
  - 存储在backup文件夹：减少图片体积，当不需要存储编辑数据再编辑图片时，可以把backup里的json文件直接删除



## 📄 许可证

MIT License


## 🔧 开发相关

```bash
pnpm install
pnpm run dev
```


## 🙏 致谢

- 基于 [plugin-sample-vite-svelte](https://github.com/siyuan-note/plugin-sample-vite-svelte/) 模板开发

## ❤️用爱发电

如果喜欢我的插件，欢迎给GitHub仓库点star和微信赞赏，这会激励我继续完善此插件和开发新插件。

维护插件费时费力，个人时间和精力有限，开源只是分享，不等于我要浪费我的时间免费帮用户实现ta需要的功能，

我需要的功能我会慢慢改进（打赏可以催更），有些我觉得可以改进、但是现阶段不必要的功能需要打赏才改进（会标注打赏标签和需要打赏金额），而不需要的功能、实现很麻烦的功能会直接关闭issue不考虑实现

累积赞赏50元的朋友如果想加我微信，可以发邮件到<span data-type="a" data-href="mailto:achuan-2@outlook.com">achuan-2@outlook.com</span>来进行好友申请（赞赏达不到50元的，我不会回复邮件和加好友哦，因为不想当免费客服）

![image](https://camo.githubusercontent.com/8052f6f2e7dafba534e781934efa9bcb084fa3a9dfa5c221a85ac63db8b043cb/68747470733a2f2f6173736574732e62336c6f6766696c652e636f6d2f73697975616e2f313631303230353735393030352f6173736574732f6e6574776f726b2d61737365742d696d6167652d32303235303631343132333535382d667568697235762e706e67)
