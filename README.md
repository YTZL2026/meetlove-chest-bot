<div align="center">

# 🎮 遇见 · 宝箱怪自动挂机脚本

<p>
  <strong>Auto.js 零门槛自动化 — 自动切图打宝箱怪，护肝神器</strong>
</p>

<p>
  <a href="https://github.com/86132/meetlove-chest-bot/stargazers"><img src="https://img.shields.io/github/stars/86132/meetlove-chest-bot?style=flat-square" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/86132/meetlove-chest-bot?style=flat-square" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/Auto.js-7.0-green?style=flat-square" alt="Auto.js"></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-Welcome-green?style=flat-square" alt="PRs Welcome"></a>
</p>

<p>
  <a href="#-功能特性">功能</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-效率参考">效率参考</a> ·
  <a href="#-常见问题">FAQ</a> ·
  <a href="#-开源协议">开源协议</a>
</p>

</div>

---

## 简介

"遇见"手游的宝箱怪自动挂机脚本——基于图像识别的全自动刷怪方案，支持手机端（Auto.js）和电脑端（ADB Python）。

> ⚠️ **郑重声明**：本脚本使用纯色块识别+坐标操作，不修改游戏内存、不注入进程。但任何第三方工具都存在一定风险，使用前请确认你接受可能的账号处罚。

## 功能特性

| 功能 | 说明 |
| :---: | :--- |
|  🤖 **自动切图** | 3条预设跑图路径，自动切换地图，无限循环 |
|  ⚔️ **自动战斗** | 图像识别锁定宝箱怪 → 自动攻击 → 等战斗结束 |
|  🐴 **自动上坐骑** | 切图后自动骑坐骑加速，可设每 N 轮强制重上 |
|  ❤️ **血量监控** | 实时检测血量，低于阈值自动吃药/切安全图 |
|  📊 **效率统计** | 实时显示击杀数、每小时效率、运行时长 |
|  🔒 **反检测** | 随机延迟、随机点击偏移、操作间隔模拟真人 |
|  📱💻 **双端支持** | 手机 Auto.js 直装 + 电脑 ADB Python 远控 |

## 快速开始

### 方案 A：手机端（推荐小白）

1. 下载安装 [AutoX.js v7](https://github.com/aiselp/AutoX/releases)（社区维护版）
2. 打开 AutoX.js → 新建脚本 → 粘贴 `chest_farm_main.js` 全部代码
3. 进入游戏，站在任意地图
4. 点击 AutoX.js 运行按钮 ▶
5. 切回游戏，脚本自动开始

### 方案 B：电脑端（ADB 控制）

```bash
git clone https://github.com/86132/meetlove-chest-bot.git
cd meetlove-chest-bot

# 安装依赖
pip install opencv-python pillow

# 手机开启 USB 调试，连接电脑
python chest_farm_adb.py
```

### 配置修改

编辑脚本顶部 `CONFIG` 对象：
```javascript
const CONFIG = {
    mount: { enabled: true },      // 是否自动上坐骑
    health: { threshold: 30 },     // 血量低于 30% 吃药
    antiDetect: { enabled: true }, // 反检测开关
    remountEveryN: 5,              // 每 5 轮强制重上坐骑
};
```

## 效率参考

| 模式 | 理论效率 | 实测效率 | 8 小时预估 |
| :--- | :---: | :---: | :---: |
| 手动刷 | ~80 只/h | 取决于操作 | 不可持续 |
| 本脚本 | ~120 只/h | ~50-100 只/h | 400-800 只 |

> 实测数据来源：社区用户反馈 + TapTap/7723 攻略帖（2024年）。效率受游戏刷新 RNG、AI 锁敌机制影响。

## 常见问题

<details>
<summary><b>Q: 会被封号吗？</b></summary>

本脚本使用纯图像识别 + 坐标点击，不修改游戏内存。但任何第三方工具官方都不支持，风险自负。建议小号先测试。
</details>

<details>
<summary><b>Q: 手机版 AutoX.js 文件怎么导入？</b></summary>

AutoX.js v7 不支持直接导入文件，需要：新建文件 → 粘贴代码 → 保存。这是目前最可靠的方式。
</details>

<details>
<summary><b>Q: 坐骑不自动上？</b></summary>

检查 `mount.btnX` 和 `mount.btnY` 坐标是否匹配你的屏幕分辨率。不同手机需要微调。
</details>

## 开源协议

本项目采用 [MIT License](LICENSE) 开源。欢迎 Fork 和改进！

---

<p align="center">
  <sub>Built with ❤️ by <a href="https://github.com/86132">86132</a> · 护肝从脚本开始</sub>
</p>
