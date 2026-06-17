<div align="center">

# 🎮 遇见 · 宝箱怪自动挂机脚本

<p>
  <strong>Auto.js 零门槛自动化 — 自动切图打宝箱怪，护肝神器</strong>
</p>

<p>
  <a href="https://github.com/YTZL2026/meetlove-chest-bot/stargazers"><img src="https://img.shields.io/github/stars/86132/meetlove-chest-bot?style=flat-square" alt="Stars"></a>
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
git clone https://github.com/YTZL2026/meetlove-chest-bot.git
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

# 馃幃 閬囪 路 瀹濈鎬嚜鍔ㄦ寕鏈鸿剼鏈?
  <strong>Auto.js 闆堕棬妲涜嚜鍔ㄥ寲 鈥?鑷姩鍒囧浘鎵撳疂绠辨€紝鎶よ倽绁炲櫒</strong>
  <a href="https://github.com/YTZL2026/meetlove-chest-bot/stargazers"><img src="https://img.shields.io/github/stars/YTZL2026/meetlove-chest-bot?style=flat-square" alt="Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/YTZL2026/meetlove-chest-bot?style=flat-square" alt="License"></a>
  <a href="#-鍔熻兘鐗规€?>鍔熻兘</a> 路
  <a href="#-蹇€熷紑濮?>蹇€熷紑濮?/a> 路
  <a href="#-鏁堢巼鍙傝€?>鏁堢巼鍙傝€?/a> 路
  <a href="#-寮€婧愬崗璁?>寮€婧愬崗璁?/a>
## 绠€浠?
"閬囪"鎵嬫父鐨勫疂绠辨€嚜鍔ㄦ寕鏈鸿剼鏈€斺€斿熀浜庡浘鍍忚瘑鍒殑鍏ㄨ嚜鍔ㄥ埛鎬柟妗堬紝鏀寔鎵嬫満绔紙Auto.js锛夊拰鐢佃剳绔紙ADB Python锛夈€?
> 鈿狅笍 **閮戦噸澹版槑**锛氭湰鑴氭湰浣跨敤绾壊鍧楄瘑鍒?鍧愭爣鎿嶄綔锛屼笉淇敼娓告垙鍐呭瓨銆佷笉娉ㄥ叆杩涚▼銆備絾浠讳綍绗笁鏂瑰伐鍏烽兘瀛樺湪涓€瀹氶闄╋紝浣跨敤鍓嶈纭浣犳帴鍙楀彲鑳界殑璐﹀彿澶勭綒銆?
## 鍔熻兘鐗规€?
|  馃 **鑷姩鍒囧浘** | 3鏉￠璁捐窇鍥捐矾寰勶紝鑷姩鍒囨崲鍦板浘锛屾棤闄愬惊鐜?|
|  鈿旓笍 **鑷姩鎴樻枟** | 鍥惧儚璇嗗埆閿佸畾瀹濈鎬?鈫?鑷姩鏀诲嚮 鈫?绛夋垬鏂楃粨鏉?|
|  馃惔 **鑷姩涓婂潗楠?* | 鍒囧浘鍚庤嚜鍔ㄩ獞鍧愰獞鍔犻€燂紝鍙姣?N 杞己鍒堕噸涓?|
|  鉂わ笍 **琛€閲忕洃鎺?* | 瀹炴椂妫€娴嬭閲忥紝浣庝簬闃堝€艰嚜鍔ㄥ悆鑽?鍒囧畨鍏ㄥ浘 |
|  馃搳 **鏁堢巼缁熻** | 瀹炴椂鏄剧ず鍑绘潃鏁般€佹瘡灏忔椂鏁堢巼銆佽繍琛屾椂闀?|
|  馃敀 **鍙嶆娴?* | 闅忔満寤惰繜銆侀殢鏈虹偣鍑诲亸绉汇€佹搷浣滈棿闅旀ā鎷熺湡浜?|
## 蹇€熷紑濮?
1. 涓嬭浇瀹夎 [AutoX.js v7](https://github.com/aiselp/AutoX/releases)锛堢ぞ鍖虹淮鎶ょ増锛?2. 鎵撳紑 AutoX.js 鈫?鏂板缓鑴氭湰 鈫?绮樿创 `chest_farm_main.js` 鍏ㄩ儴浠ｇ爜
3. 杩涘叆娓告垙锛岀珯鍦ㄤ换鎰忓湴鍥?4. 鐐瑰嚮 AutoX.js 杩愯鎸夐挳 鈻?5. 鍒囧洖娓告垙锛岃剼鏈嚜鍔ㄥ紑濮?
### 鏂规 B锛氱數鑴戠锛圓DB 鎺у埗锛?
git clone https://github.com/YTZL2026/meetlove-chest-bot.git
# 鎵嬫満寮€鍚?USB 璋冭瘯锛岃繛鎺ョ數鑴?python chest_farm_adb.py
缂栬緫鑴氭湰椤堕儴 `CONFIG` 瀵硅薄锛?```javascript
    mount: { enabled: true },      // 鏄惁鑷姩涓婂潗楠?    health: { threshold: 30 },     // 琛€閲忎綆浜?30% 鍚冭嵂
    antiDetect: { enabled: true }, // 鍙嶆娴嬪紑鍏?    remountEveryN: 5,              // 姣?5 杞己鍒堕噸涓婂潗楠?};
## 鏁堢巼鍙傝€?
| 鎵嬪姩鍒?| ~80 鍙?h | 鍙栧喅浜庢搷浣?| 涓嶅彲鎸佺画 |
| 鏈剼鏈?| ~120 鍙?h | ~50-100 鍙?h | 400-800 鍙?|
> 瀹炴祴鏁版嵁鏉ユ簮锛氱ぞ鍖虹敤鎴峰弽棣?+ TapTap/7723 鏀荤暐甯栵紙2024骞达級銆傛晥鐜囧彈娓告垙鍒锋柊 RNG銆丄I 閿佹晫鏈哄埗褰卞搷銆?
鏈剼鏈娇鐢ㄧ函鍥惧儚璇嗗埆 + 鍧愭爣鐐瑰嚮锛屼笉淇敼娓告垙鍐呭瓨銆備絾浠讳綍绗笁鏂瑰伐鍏峰畼鏂归兘涓嶆敮鎸侊紝椋庨櫓鑷礋銆傚缓璁皬鍙峰厛娴嬭瘯銆?</details>
<summary><b>Q: 鎵嬫満鐗?AutoX.js 鏂囦欢鎬庝箞瀵煎叆锛?/b></summary>
AutoX.js v7 涓嶆敮鎸佺洿鎺ュ鍏ユ枃浠讹紝闇€瑕侊細鏂板缓鏂囦欢 鈫?绮樿创浠ｇ爜 鈫?淇濆瓨銆傝繖鏄洰鍓嶆渶鍙潬鐨勬柟寮忋€?</details>
<summary><b>Q: 鍧愰獞涓嶈嚜鍔ㄤ笂锛?/b></summary>
妫€鏌?`mount.btnX` 鍜?`mount.btnY` 鍧愭爣鏄惁鍖归厤浣犵殑灞忓箷鍒嗚鲸鐜囥€備笉鍚屾墜鏈洪渶瑕佸井璋冦€?</details>
## 寮€婧愬崗璁?
鏈」鐩噰鐢?[MIT License](LICENSE) 寮€婧愩€傛杩?Fork 鍜屾敼杩涳紒
  <sub>Built with 鉂わ笍 by <a href="https://github.com/YTZL2026">YTZL2026</a> 路 鎶よ倽浠庤剼鏈紑濮?/sub>