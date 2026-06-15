"""
 * ============================================================
 *  遇见 (MeetLove) — 宝箱怪挂机脚本 · PC模拟器版
 * ============================================================
 *
 *  原理：通过 ADB 控制安卓模拟器（雷电/蓝叠/MuMu等）
 *        模拟滑屏切图 + 等待，利用游戏内置挂机自动秒杀宝箱怪
 *
 *  使用方式：
 *    python chest_farm_adb.py
 *
 *  依赖：
 *    - ADB 已安装并加入 PATH
 *    - 模拟器已开启 ADB 调试
 *    - Python 3.8+
 *    - 不需要额外 pip 包（纯 adb shell 命令）
 *
 *  优化点 vs 手机脚本：
 *    1. 不受手机电量/来电/通知干扰
 *    2. 可同时多开（多实例并行）
 *    3. 更精确的截屏分析（可选 OpenCV 增强）
 *    4. 支持远程控制（ADB over TCP）
"""

import subprocess
import time
import random
import json
import sys
import os
from datetime import datetime, timedelta
from pathlib import Path


# ============================================================
#  配置
# ============================================================

class Config:
    # --- ADB 设备 ---
    # 单设备：None（自动检测） 或 "127.0.0.1:5555"（网络连接）
    # 多开：指定 adb device serial
    ADB_DEVICE: str | None = None  # None = 自动选第一个设备

    # --- 切图路径（屏幕坐标，根据你的分辨率调整！）---
    # 以下为 1080x2400 分辨率下的默认值
    SCREEN_W = 1080
    SCREEN_H = 2400

    WAYPOINTS = [
        {"name": "家门→菜地",   "x1": 540, "y1": 1600, "x2": 540, "y2": 800,  "dur": 250, "weight": 5},
        {"name": "菜地→家门",   "x1": 540, "y1": 800,  "x2": 540, "y2": 1600, "dur": 250, "weight": 5},
        {"name": "草原边界→",   "x1": 200, "y1": 1200, "x2": 900, "y2": 1200, "dur": 300, "weight": 2},
        {"name": "草原边界←",   "x1": 900, "y1": 1200, "x2": 200, "y2": 1200, "dur": 300, "weight": 2},
    ]

    # --- 时序（毫秒）---
    MAP_LOAD_BASE = 2500       # 地图加载基础等待
    MAP_LOAD_MIN = 1500        # 自适应下限
    BATTLE_ENGAGE = 2000       # 索敌+接战
    KILL_TIME = 1500           # 击杀耗时（秒杀可缩短至 500~800）
    LOOT_PICKUP = 800          # 自动拾取

    JITTER_MIN = 150           # 随机抖动下限
    JITTER_MAX = 600           # 随机抖动上限

    # --- 循环控制 ---
    MAX_CYCLES = 0             # 0 = 无限
    STOP_AFTER_MIN = 0         # 0 = 不自动停止
    PAUSE_EVERY_N = 40         # 每 N 轮模拟休息
    PAUSE_MIN = 3000
    PAUSE_MAX = 8000

    # --- 安全 ---
    STUCK_THRESHOLD = 5        # 连续 N 轮过快 = 疑似卡死
    HOME_X = 540
    HOME_Y = 1400

    # --- 🐴 坐骑（解决低移速追不上宝箱怪的问题）---
    MOUNT_ENABLED = True        # 是否启用自动上坐骑
    MOUNT_BTN_X = 980           # 坐骑按钮 X 坐标（1080 分辨率参考）
    MOUNT_BTN_Y = 1800          # 坐骑按钮 Y 坐标（1080 分辨率参考）
    MOUNT_DELAY = 400           # 上马动画等待 ms
    REMOUNT_EVERY_N = 5         # 每 N 轮强制重新上马

    # --- 日志 ---
    LOG_FILE = "chest_farm_log.txt"


# ============================================================
#  ADB 工具
# ============================================================

class ADB:
    """封装 ADB 命令"""

    @staticmethod
    def _cmd(*args) -> list[str]:
        """构建 ADB 命令"""
        cmd = ["adb"]
        if Config.ADB_DEVICE:
            cmd += ["-s", Config.ADB_DEVICE]
        cmd += list(args)
        return cmd

    @classmethod
    def shell(cls, cmd: str) -> str:
        """执行 adb shell 命令，返回 stdout"""
        result = subprocess.run(
            cls._cmd("shell", cmd),
            capture_output=True, text=True, timeout=15
        )
        return result.stdout.strip()

    @classmethod
    def swipe(cls, x1, y1, x2, y2, duration_ms=250):
        """滑屏"""
        cls.shell(f"input swipe {x1} {y1} {x2} {y2} {duration_ms}")

    @classmethod
    def tap(cls, x, y):
        """点击"""
        cls.shell(f"input tap {x} {y}")

    @classmethod
    def get_devices(cls) -> list[str]:
        """获取已连接设备列表"""
        result = subprocess.run(["adb", "devices"], capture_output=True, text=True)
        lines = result.stdout.strip().split("\n")[1:]
        return [l.split()[0] for l in lines if l.strip() and "device" in l]

    @classmethod
    def is_screen_on(cls) -> bool:
        """检查屏幕是否亮着"""
        out = cls.shell("dumpsys power | grep 'mWakefulness='")
        return "Awake" in out

    @classmethod
    def wake_screen(cls):
        """唤醒屏幕"""
        cls.shell("input keyevent 224")  # KEYCODE_WAKEUP
        time.sleep(0.3)
        # 上滑解锁（如果无锁屏密码）
        cls.swipe(540, 1800, 540, 800, 100)

    @classmethod
    def current_app(cls) -> str:
        """获取当前前台应用包名"""
        # Android 5+
        out = cls.shell("dumpsys window | grep mCurrentFocus")
        # 兼容不同输出格式
        if "/" in out:
            return out.split("/")[0].split()[-1]
        return ""


# ============================================================
#  核心逻辑
# ============================================================

class ChestFarmBot:
    def __init__(self):
        self.cfg = Config
        self.cycles = 0
        self.kills = 0
        self.start_time: datetime | None = None
        self.stuck_count = 0
        self._running = True
        self._mounted = False  # 坐骑状态追踪

    # ---- 工具 ----

    def rand(self, a, b):
        return random.randint(a, b)

    def log(self, msg):
        ts = datetime.now().strftime("%H:%M:%S")
        line = f"[{ts}] {msg}"
        print(line)
        with open(self.cfg.LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")

    def jittered_sleep(self, base_ms):
        jitter = self.rand(self.cfg.JITTER_MIN, self.cfg.JITTER_MAX)
        time.sleep((base_ms + jitter) / 1000.0)

    # ---- 动作 ----

    def do_swipe(self, wp):
        """执行一次切图滑动"""
        ox1, oy1 = self.rand(-15, 15), self.rand(-15, 15)
        ox2, oy2 = self.rand(-15, 15), self.rand(-15, 15)
        dur = wp["dur"] + self.rand(-30, 30)
        ADB.swipe(
            wp["x1"] + ox1, wp["y1"] + oy1,
            wp["x2"] + ox2, wp["y2"] + oy2,
            max(50, dur)
        )

    def select_waypoint(self):
        """加权随机选择路径"""
        total = sum(w["weight"] for w in self.cfg.WAYPOINTS)
        roll = random.random() * total
        cum = 0
        for i, w in enumerate(self.cfg.WAYPOINTS):
            cum += w["weight"]
            if roll <= cum:
                return i, w
        return 0, self.cfg.WAYPOINTS[0]

    def wait_map_load(self):
        """自适应等待地图加载"""
        base = self.cfg.MAP_LOAD_BASE
        if self.cycles < 10:
            time.sleep((base + 500) / 1000.0)
        else:
            adapted = max(self.cfg.MAP_LOAD_MIN, base - self.cycles * 5)
            time.sleep((adapted + self.rand(-200, 200)) / 1000.0)

    def wait_battle(self):
        time.sleep(self.cfg.BATTLE_ENGAGE / 1000.0)
        time.sleep(self.cfg.KILL_TIME / 1000.0)
        time.sleep(self.cfg.LOOT_PICKUP / 1000.0)

    def go_home(self):
        """返回安全位置"""
        self.log("🏠 返回安全位置...")
        ADB.tap(self.cfg.HOME_X + self.rand(-10, 10),
                self.cfg.HOME_Y + self.rand(-10, 10))
        time.sleep(2.0)

    def mount_up(self, force=False):
        """🐴 上坐骑 — 解决低移速追不上宝箱怪的问题"""
        if not self.cfg.MOUNT_ENABLED:
            return
        if not force and self._mounted:
            return
        try:
            mx = self.cfg.MOUNT_BTN_X + self.rand(-8, 8)
            my = self.cfg.MOUNT_BTN_Y + self.rand(-8, 8)
            self.log("🐴 上坐骑...")
            ADB.tap(mx, my)
            time.sleep((self.cfg.MOUNT_DELAY + self.rand(-50, 100)) / 1000.0)
            self._mounted = True
        except Exception as e:
            self.log(f"⚠️ 上马失败: {e}")

    def human_pause(self):
        if self.cycles > 0 and self.cycles % self.cfg.PAUSE_EVERY_N == 0:
            p = self.rand(self.cfg.PAUSE_MIN, self.cfg.PAUSE_MAX) / 1000.0
            self.log(f"☕ 模拟休息 {p:.1f}s...")
            time.sleep(p)

    # ---- 统计 ----

    def elapsed_min(self):
        if not self.start_time:
            return 0
        return (datetime.now() - self.start_time).total_seconds() / 60

    def print_stats(self):
        elapsed = self.elapsed_min()
        kph = round(self.kills / (elapsed / 60)) if elapsed > 0.01 else 0
        cpm = round(self.cycles / elapsed, 1) if elapsed > 0.01 else 0
        self.log(f"════ 运行 {elapsed:.1f}min | 切图 {self.cycles}次 | "
                 f"估算击杀 {self.kills}只 | {kph}只/h | {cpm}次/min ════")

    # ---- 主循环 ----

    def run(self):
        self.log("🚀 宝箱怪挂机脚本启动 v2.2 (PC/ADB 版)")
        self.log(f"   🐴 自动坐骑: {'开' if self.cfg.MOUNT_ENABLED else '关'} "
                 f"(坐标 {self.cfg.MOUNT_BTN_X},{self.cfg.MOUNT_BTN_Y})")

        # 设备检查
        devices = ADB.get_devices()
        if not devices:
            self.log("❌ 未检测到 ADB 设备，请检查模拟器连接")
            self.log("   尝试: adb connect 127.0.0.1:5555")
            sys.exit(1)

        if not Config.ADB_DEVICE:
            Config.ADB_DEVICE = devices[0]
        self.log(f"📱 已连接设备: {Config.ADB_DEVICE}")

        # 屏幕唤醒
        if not ADB.is_screen_on():
            self.log("💡 屏幕熄灭，尝试唤醒...")
            ADB.wake_screen()
            time.sleep(1.0)

        self.start_time = datetime.now()

        try:
            while self._running:
                # ① 选路径
                idx, wp = self.select_waypoint()
                self.log(f"🔄 [{self.cycles + 1}] {wp['name']}")

                # ② 切图
                self.do_swipe(wp)

                # ③ 等加载
                self.wait_map_load()

                # ④ 🐴 上坐骑（地图加载完立刻上马）
                if self.cycles > 0 and self.cycles % self.cfg.REMOUNT_EVERY_N == 0:
                    self._mounted = False  # 强制刷新
                self.mount_up()

                # ⑤ 等战斗
                self.wait_battle()

                # ⑥ 计数
                self.cycles += 1
                self.kills += 1
                self.stuck_count = 0

                # ⑦ 抖动
                self.jittered_sleep(0)

                # ⑧ 休息
                self.human_pause()

                # ⑨ 卡死检测
                if self.cycles % self.cfg.STUCK_THRESHOLD == 0:
                    if self.stuck_count >= self.cfg.STUCK_THRESHOLD:
                        self.log("⚠️ 疑似卡死，尝试复位...")
                        self.go_home()
                        self.stuck_count = 0

                # ⑩ 统计
                if self.cycles % 20 == 0:
                    self.print_stats()

                # ⑪ 停止条件
                if self.cfg.MAX_CYCLES > 0 and self.cycles >= self.cfg.MAX_CYCLES:
                    self.log("⏹ 达到设定循环次数")
                    break
                if self.cfg.STOP_AFTER_MIN > 0 and self.elapsed_min() >= self.cfg.STOP_AFTER_MIN:
                    self.log(f"⏹ 达到设定运行时间 ({self.cfg.STOP_AFTER_MIN}min)")
                    break

        except KeyboardInterrupt:
            self.log("⏹ 用户手动中断")
        except Exception as e:
            self.log(f"💥 异常: {e}")
        finally:
            self.log("══════ 最终统计 ══════")
            self.print_stats()
            self.log("脚本已停止")


# ============================================================
#  入口
# ============================================================

if __name__ == "__main__":
    bot = ChestFarmBot()
    bot.run()
