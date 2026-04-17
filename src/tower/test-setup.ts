// src/tower/test-setup.ts
//
// Vitest global setup:
// - 注入 fake-indexeddb 到 globalThis（Vitest 默认 jsdom 没有 IndexedDB）.
//
// `fake-indexeddb/auto` 会立刻替换全局 indexedDB / IDBKeyRange.
//
// Isolation note: persistence.test.ts 和 stores/tower.test.ts 共享同一 IDB
// namespace (`xiv-tower` / `tower-runs`). Vitest 默认 pool 是 `forks`（每文件
// 独立进程），所以每个 test 文件都会经由此 setupFile 得到自己的 fake-indexeddb
// 实例，彼此隔离. 若未来把 pool 切换为 `threads` / `vmForks`，需要补 per-test
// 清理（如在 beforeEach 调 `indexedDB.deleteDatabase('xiv-tower')`），否则
// cross-file 数据可能泄漏.
import 'fake-indexeddb/auto'
