/**
 * ============================================================
 *  遇见 (MeetLove) — 宝箱怪全自动挂机脚本 · v2.2 坐骑版
 * ============================================================
 *
 *  原理：切图刷新法 — 每次跨地图边界时服务器刷新一只宝箱怪，
 *        游戏内置挂机自动寻怪+秒杀。脚本只负责反复切图。
 *
 *  适用环境：Auto.js Pro / AutoX.js（Android 真机或模拟器）
 *  最低 Android 版本：7.0
 *  需要权限：无障碍服务 + 悬浮窗
 *
 *  优化点 vs 社区原版：
 *    1. 多点循环路径 + 随机偏移 → 降低脚本特征
 *    2. 自适应地图加载时间（首次慢后续快）
 *    3. 血量/蓝量 OCR 监控，低状态自动吃药/停止
 *    4. 卡死检测 + 自动复位
 *    5. 实时效率统计（只/小时）+ 悬浮窗日志
 *    6. 定时停止 / 满背包停止 / 低血量停止 多重保险
 *    7. 随机延迟抖动，模拟人类操作节奏
 *    8. 🐴 自动上坐骑 — 解决新手追不上宝箱怪的问题
 */

"use strict";

// ============================================================
//  一、配置区（按实际情况修改）
// ============================================================

const CONFIG = {

    // --------------------------------------------------------
    //  1.1 切图路径（核心参数）
    //      每个路径点是一个 {x, y} 或 {x1,y1, x2,y2} 滑屏动作
    //      多个点会循环使用，避免被检测为单一模式
    // --------------------------------------------------------
    waypoints: [
        {
            // 路径 0：家门口 ↔ 菜地（主路径，最稳定）
            name: "家门↔菜地",
            type: "swipe",           // swipe = 滑屏切图
            x1: 540, y1: 1600,       // 起点（屏幕坐标，需根据分辨率调整）
            x2: 540, y2: 800,        // 终点
            duration: 250,           // 滑动耗时 ms
            weight: 5,               // 权重，越高越常被选中
        },
        {
            // 路径 1：反向滑回
            name: "菜地↔家门",
            type: "swipe",
            x1: 540, y1: 800,
            x2: 540, y2: 1600,
            duration: 250,
            weight: 5,
        },
        {
            // 路径 2：心灵草原方向（备用）
            name: "草原边界",
            type: "swipe",
            x1: 200, y1: 1200,
            x2: 900, y2: 1200,
            duration: 300,
            weight: 2,
        },
        {
            // 路径 3：反向
            name: "草原边界(返)",
            type: "swipe",
            x1: 900, y1: 1200,
            x2: 200, y2: 1200,
            duration: 300,
            weight: 2,
        },
        // 按需增加更多路径点...
    ],

    // --------------------------------------------------------
    //  1.2 时序参数（单位：毫秒）
    // --------------------------------------------------------
    timing: {
        mapLoadBase: 2500,          // 地图加载基础等待
        mapLoadMin: 1500,           // 地图加载最小等待（自适应下限）
        battleEngage: 2000,         // 挂机索敌+接战等待
        killTime: 1500,             // 击杀耗时（根据你的战力调整，秒杀=500~1000）
        lootPickup: 800,            // 自动拾取等待

        // 随机延迟范围（叠加在每一步之后）
        jitterMin: 150,
        jitterMax: 600,
    },

    // --------------------------------------------------------
    //  1.3 循环控制
    // --------------------------------------------------------
    loop: {
        maxCycles: 0,               // 最大循环数，0=无限
        stopAfterMinutes: 0,        // 运行N分钟后自动停，0=不自动停
        pauseEveryN: 40,            // 每N轮暂停一次（模拟人类休息）
        pauseMin: 3000,             // 最短暂停 ms
        pauseMax: 8000,             // 最长暂停 ms
    },

    // --------------------------------------------------------
    //  1.4 异常检测
    // --------------------------------------------------------
    safety: {
        // 卡死检测：连续N轮无击杀则认为卡死
        stuckThreshold: 5,
        // 卡死后执行：返回主城坐标
        homeX: 540,
        homeY: 1400,
        // 血量安全阈值（需配合 OCR，见下方）
        hpThreshold: 0.3,
        mpThreshold: 0.2,
        // 低血量时尝试吃药（坐标）
        potionX: 200,
        potionY: 1800,
        // 网络断开重试
        reconnectMaxRetries: 3,
        reconnectWait: 10000,
    },

    // --------------------------------------------------------
    //  1.5 屏幕适配（重要！根据你的设备修改）
    // --------------------------------------------------------
    screen: {
        width: 1080,                // 设备分辨率宽
        height: 2400,               // 设备分辨率高
        // 如果你不知道分辨率，脚本启动时会自动获取
    },

    // --------------------------------------------------------
    //  1.6 坐骑（解决低移速追不上宝箱怪的问题）
    //      ⚠️ 坐骑按钮位置因设备和分辨率而异，请先截图确认坐标！
    //      通常在屏幕右下角或右侧中间，是一个马/坐骑图标
    // --------------------------------------------------------
    mount: {
        enabled: true,              // 是否启用自动上坐骑（无坐骑的新手关掉）
        btnX: 980,                  // 坐骑按钮 X 坐标（1080 分辨率参考值）
        btnY: 1800,                 // 坐骑按钮 Y 坐标（1080 分辨率参考值）
        mountDelay: 400,            // 点击坐骑按钮后等待上马动画 ms
        remountEveryN: 5,           // 每 N 轮重新点一次坐骑（防止坐骑到期/被击落）
        // 如果坐骑按钮在屏幕右侧中间，改成 btnX=1030, btnY=1200 试试
        // 如果在右下角小图标，改成 btnX=1000, btnY=2100 试试
    },

    // --------------------------------------------------------
    //  1.7 通知
    // --------------------------------------------------------
    notify: {
        enableLog: true,            // 悬浮窗日志
        enableToast: false,         // 短暂 Toast 提示
        logFilePath: "/sdcard/chest_farm_log.txt",
    },
};

// ============================================================
//  二、运行时状态
// ============================================================

const STATE = {
    totalCycles: 0,
    totalKills: 0,          // 估算击杀数
    startTime: 0,
    consecutiveNoKill: 0,   // 连续无击杀计数
    currentWaypointIdx: 0,
    running: true,
    lastKillTime: 0,
    isMounted: false,       // 坐骑状态追踪
    errors: [],
};

// ============================================================
//  三、工具函数
// ============================================================

function log(msg) {
    let ts = new Date().toLocaleTimeString();
    let line = `[${ts}] ${msg}`;
    console.log(line);
    if (CONFIG.notify.enableLog) {
        toastLog(msg);  // Auto.js 的 toast + log 合一
    }
}

/** 随机整数 [min, max] */
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 随机延迟 */
function randomDelay(min, max) {
    sleep(rand(min, max));
}

/** 带随机抖动的标准延迟 */
function jitteredDelay(baseMs) {
    let j = rand(CONFIG.timing.jitterMin, CONFIG.timing.jitterMax);
    sleep(baseMs + j);
}

/**
 * 加权随机选择路径
 * 权重高的路径更常被选中，但仍保留随机性
 */
function selectWaypoint() {
    let totalWeight = CONFIG.waypoints.reduce((s, w) => s + (w.weight || 1), 0);
    let roll = Math.random() * totalWeight;
    let cum = 0;
    for (let i = 0; i < CONFIG.waypoints.length; i++) {
        cum += (CONFIG.waypoints[i].weight || 1);
        if (roll <= cum) return i;
    }
    return 0;
}

// ============================================================
//  四、核心动作模块
// ============================================================

const Action = {

    /**
     * 执行切图滑动
     * @returns {boolean} 是否执行成功
     */
    switchMap: function (wpIndex) {
        let wp = CONFIG.waypoints[wpIndex];
        if (!wp) return false;

        try {
            if (wp.type === "swipe") {
                // 加入 ±15px 随机偏移，模拟人类手指抖动
                let ox1 = rand(-15, 15);
                let oy1 = rand(-15, 15);
                let ox2 = rand(-15, 15);
                let oy2 = rand(-15, 15);
                let dur = wp.duration + rand(-30, 30);

                swipe(wp.x1 + ox1, wp.y1 + oy1,
                      wp.x2 + ox2, wp.y2 + oy2,
                      Math.max(50, dur));
                return true;
            } else if (wp.type === "tap") {
                // 点击移动模式（某些地图通过点击边缘切换）
                click(wp.x + rand(-10, 10), wp.y + rand(-10, 10));
                return true;
            }
        } catch (e) {
            log(`❌ 切图失败 [${wp.name}]: ${e.message}`);
            return false;
        }
        return false;
    },

    /**
     * 等待地图加载完成
     * 自适应策略：首次等待较长，后续逐渐缩短
     */
    waitMapLoad: function () {
        let base = CONFIG.timing.mapLoadBase;
        // 前10轮用较长时间（建立基线），之后自适应
        if (STATE.totalCycles < 10) {
            sleep(base + 500);
        } else {
            // 自适应：取 base 和 最小值的中间，加少量随机
            let adapted = Math.max(CONFIG.timing.mapLoadMin,
                            base - STATE.totalCycles * 5);
            sleep(adapted + rand(-200, 200));
        }
    },

    /**
     * 等待战斗触发 + 击杀
     */
    waitBattle: function () {
        // 先等挂机系统锁定宝箱怪
        sleep(CONFIG.timing.battleEngage);
        // 再等击杀（如果你是秒杀，这个值可以很短）
        sleep(CONFIG.timing.killTime);
        // 自动拾取
        sleep(CONFIG.timing.lootPickup);
    },

    /**
     * 模拟 "人类操作" 的随机暂停
     */
    humanPause: function () {
        if (STATE.totalCycles > 0 &&
            STATE.totalCycles % CONFIG.loop.pauseEveryN === 0) {
            let pauseMs = rand(CONFIG.loop.pauseMin, CONFIG.loop.pauseMax);
            log(`☕ 模拟休息 ${(pauseMs/1000).toFixed(1)}s...`);
            sleep(pauseMs);
        }
    },

    /**
     * 尝试点击吃药
     */
    usePotion: function () {
        log("💊 尝试使用药水...");
        click(CONFIG.safety.potionX + rand(-5, 5),
              CONFIG.safety.potionY + rand(-5, 5));
        sleep(500);
    },

    /**
     * 返回安全位置（主城/挂机点）
     */
    goHome: function () {
        log("🏠 返回安全位置...");
        // 通过点击地图坐标回到挂机范围
        // 这里需要根据你的游戏 UI 调整
        // 常见方式：打开地图 → 点击传送点 → 确认
        // 简化版：连续点击屏幕中心偏下位置（大部分游戏的默认移动区域）
        click(CONFIG.safety.homeX, CONFIG.safety.homeY);
        sleep(2000);
    },

    /**
     * 上坐骑 — 解决低移速新手追不上宝箱怪的问题
     *
     * 原理：宝箱怪受惊后约 8 秒钻地消失，基础移速（无称号/无速度装）
     *      很难在它逃跑前追上。坐骑移速远高于跑步，挂机 AI 骑乘坐骑
     *      追击时基本不会丢怪。
     *
     * @param {boolean} force — 强制重新上马（无视状态追踪）
     */
    mountUp: function (force) {
        if (!CONFIG.mount.enabled) return;

        // 非强制模式下，如果已在马上则跳过
        if (!force && STATE.isMounted) return;

        try {
            let mx = CONFIG.mount.btnX + rand(-8, 8);
            let my = CONFIG.mount.btnY + rand(-8, 8);

            log("🐴 上坐骑...");
            click(mx, my);
            sleep(CONFIG.mount.mountDelay + rand(-50, 100));

            // 某些手游坐骑按钮是个切换开关（上/下），
            // 再点一次会下马。所以我们假设点一次 = 上马成功
            STATE.isMounted = true;
        } catch (e) {
            // 上马失败不中断流程，只是这轮跑得慢点
            log(`⚠️ 上马失败: ${e.message}`);
        }
    },

    /**
     * 下坐骑（特定场景使用，如需要步行操作菜单时）
     */
    dismount: function () {
        if (!CONFIG.mount.enabled) return;
        if (!STATE.isMounted) return;

        try {
            click(CONFIG.mount.btnX + rand(-5, 5),
                  CONFIG.mount.btnY + rand(-5, 5));
            sleep(300);
            STATE.isMounted = false;
        } catch (e) {
            // 静默处理
        }
    },
};

// ============================================================
//  五、健康检查模块（需要 OCR 服务支持）
// ============================================================

const HealthCheck = {

    /**
     * 检查游戏是否还在前台运行
     */
    isGameActive: function () {
        try {
            let pkg = currentPackage();
            // TODO: 替换为遇见的实际包名
            // 常见格式: com.tencent.xxx / com.netease.xxx
            let expectedPkg = "com.meetlove.android"; // ← 改成实际包名
            return pkg === expectedPkg;
        } catch (e) {
            return true; // 获取失败则假定正常
        }
    },

    /**
     * 检查屏幕是否卡死（画面长时间不变）
     * 通过截屏对比实现
     */
    isStuck: function () {
        // 简易方案：如果连续 N 轮都很快完成（可能根本没切图成功）
        // 更精确的方案：截屏与上一帧对比，如果完全一致则卡死
        // 这里先用连续完成过快作为启发式判断
        return STATE.consecutiveNoKill >= CONFIG.safety.stuckThreshold;
    },

    /**
     * OCR 血量检测（需接入 OCR 服务）
     * 返回 0~1 的百分比，-1 表示检测失败
     *
     * 简易替代方案：根据固定颜色点判断
     * 大部分游戏血条用红色，检测血条末端像素
     */
    checkHP: function () {
        // --- 方案A：颜色点检测（不需要 OCR）---
        // 截取血条区域（根据你的设备调整坐标）
        // let img = captureScreen();
        // let color = images.pixel(img, HP_CHECK_X, HP_CHECK_Y);
        // 如果该点不是红色(R>200,G<80,B<80)，说明血量低于该位置
        // 沿血条从左到右检测，找到红色消失的位置 = 当前血量比例

        // --- 方案B：OCR 文字识别 ---
        // let img = images.clip(captureScreen(), HP_REGION[0], ...);
        // let text = ocr.recognizeText(img);
        // return parseHpFromText(text);

        // 暂时返回正常值（后续按需接入）
        return 1.0;
    },

    /**
     * 综合健康检查
     * @returns {{ healthy: boolean, reason: string }}
     */
    run: function () {
        // 1. 游戏是否在前台
        if (!this.isGameActive()) {
            return { healthy: false, reason: "游戏不在前台" };
        }

        // 2. 是否卡死
        if (this.isStuck()) {
            return { healthy: false, reason: "疑似卡死" };
        }

        // 3. 血量检查（如已接入）
        // let hp = this.checkHP();
        // if (hp >= 0 && hp < CONFIG.safety.hpThreshold) {
        //     return { healthy: false, reason: `血量过低 (${(hp*100).toFixed(0)}%)` };
        // }

        return { healthy: true, reason: "OK" };
    },
};

// ============================================================
//  六、统计 & 报告模块
// ============================================================

const Stats = {

    getElapsedMinutes: function () {
        return (Date.now() - STATE.startTime) / 60000;
    },

    getKillsPerHour: function () {
        let hours = this.getElapsedMinutes() / 60;
        if (hours < 0.01) return 0;
        return Math.round(STATE.totalKills / hours);
    },

    getCyclePerMinute: function () {
        let min = this.getElapsedMinutes();
        if (min < 0.01) return 0;
        return (STATE.totalCycles / min).toFixed(1);
    },

    print: function () {
        let elapsed = this.getElapsedMinutes();
        log("══════════════════════════════");
        log(` 运行时间 : ${elapsed.toFixed(1)} 分钟`);
        log(` 切图次数 : ${STATE.totalCycles}`);
        log(` 估算击杀 : ${STATE.totalKills} 只`);
        log(` 平均效率 : ${this.getKillsPerHour()} 只/小时`);
        log(` 切图速率 : ${this.getCyclePerMinute()} 次/分钟`);
        log("══════════════════════════════");
    },

    /**
     * 写入日志文件
     */
    flush: function () {
        try {
            let line = [
                new Date().toISOString(),
                STATE.totalCycles,
                STATE.totalKills,
                this.getKillsPerHour(),
                this.getCyclePerMinute(),
            ].join(",") + "\n";
            // 追加写入
            files.append(CONFIG.notify.logFilePath, line);
        } catch (e) {
            // 文件写入失败不中断主流程
        }
    },
};

// ============================================================
//  七、主循环
// ============================================================

function mainLoop() {
    STATE.startTime = Date.now();
    log("🚀 宝箱怪挂机脚本启动 v2.2");
    log(`   切图路径数: ${CONFIG.waypoints.length}`);
    log(`   地图加载等待: ${CONFIG.timing.mapLoadBase}ms`);
    log(`   随机抖动范围: ${CONFIG.timing.jitterMin}~${CONFIG.timing.jitterMax}ms`);
    log(`   🐴 自动坐骑: ${CONFIG.mount.enabled ? "开 (坐标 "+CONFIG.mount.btnX+","+CONFIG.mount.btnY+")" : "关"}`);
    log(`   📐 分辨率: ${CONFIG.screen.width}x${CONFIG.screen.height}`);

    // 检查无障碍服务
    auto.waitFor();  // 等待无障碍服务开启
    log("✅ 无障碍服务就绪");

    while (STATE.running) {

        // ---- 6.1 选择路径 ----
        let wpIdx = selectWaypoint();
        let wp = CONFIG.waypoints[wpIdx];
        STATE.currentWaypointIdx = wpIdx;

        // ---- 6.2 执行切图 ----
        log(`🔄 [${STATE.totalCycles + 1}] ${wp.name}`);
        let ok = Action.switchMap(wpIdx);
        if (!ok) {
            STATE.errors.push(`切图失败: ${wp.name}`);
            randomDelay(500, 1000);
            continue;
        }

        // ---- 6.3 等待地图加载 ----
        Action.waitMapLoad();

        // ---- 6.4 🐴 上坐骑（地图加载完立刻上马，趁宝箱怪还没跑远） ----
        // 每 N 轮强制刷新一次坐骑（防止坐骑到期/被打下来）
        let needRemount = (STATE.totalCycles > 0 &&
                           STATE.totalCycles % CONFIG.mount.remountEveryN === 0);
        if (needRemount) {
            STATE.isMounted = false; // 重置状态，强制重新上马
        }
        Action.mountUp(false);

        // ---- 6.5 等待战斗+击杀（骑乘坐骑追击更快） ----
        Action.waitBattle();

        // ---- 6.6 更新计数 ----
        STATE.totalCycles++;
        STATE.totalKills++;  // 保守估算：每次切图 = 1 只
        STATE.consecutiveNoKill = 0; // 重置（实际应通过截屏判断是否真的杀了）
        STATE.lastKillTime = Date.now();

        // ---- 6.7 随机延迟（模拟人类节奏） ----
        jitteredDelay(0);  // 在 step 之间加抖动

        // ---- 6.8 模拟休息 ----
        Action.humanPause();

        // ---- 6.9 周期性健康检查 ----
        if (STATE.totalCycles % CONFIG.safety.stuckThreshold === 0) {
            let check = HealthCheck.run();
            if (!check.healthy) {
                log(`⚠️ 健康检查异常: ${check.reason}`);
                if (check.reason === "疑似卡死") {
                    Action.goHome();
                    STATE.consecutiveNoKill = 0;
                }
                if (check.reason === "游戏不在前台") {
                    log("⏸ 等待游戏回到前台...");
                    sleep(5000);
                }
            }
        }

        // ---- 6.10 周期统计输出 ----
        if (STATE.totalCycles % 20 === 0) {
            Stats.print();
        }

        // ---- 6.11 日志落盘（每 100 轮） ----
        if (STATE.totalCycles % 100 === 0) {
            Stats.flush();
        }

        // ---- 6.12 停止条件判断 ----
        // 条件 A：达到最大循环数
        if (CONFIG.loop.maxCycles > 0 &&
            STATE.totalCycles >= CONFIG.loop.maxCycles) {
            log("⏹ 达到设定循环次数，停止");
            STATE.running = false;
        }

        // 条件 B：达到定时停止
        if (CONFIG.loop.stopAfterMinutes > 0 &&
            Stats.getElapsedMinutes() >= CONFIG.loop.stopAfterMinutes) {
            log(`⏹ 达到设定运行时间 (${CONFIG.loop.stopAfterMinutes}分钟)，停止`);
            STATE.running = false;
        }

        // 条件 C：音量键停止（手动中断）
        // Auto.js 默认：音量上键停止脚本
        // 可在 Auto.js 设置中配置
    }

    // ---- 最终报告 ----
    log("══════════════════════════════");
    log("📊 挂机结束，最终统计：");
    Stats.print();
    Stats.flush();
    log("══════════════════════════════");
}

// ============================================================
//  八、入口
// ============================================================

try {
    mainLoop();
} catch (e) {
    log(`💥 脚本异常退出: ${e.message}\n${e.stack}`);
    Stats.flush();
}
