# BASE-02 静态视觉素材

- 文件：`lake-editorial.jpg`（1200 × 800，约 283 KB）。
- 下载来源：https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=85
- 来源平台许可：https://unsplash.com/license
- 下载日期：2026-09-24。
- 用途：发现页静态排版样例；按用户确认的参考图方案，底部仅保留“静态样例 · 不可领取”，无图片角标。照片不作为国内具体地点的实拍证明，样例文案为虚构。
- 这不是业务 fixture 或 Asset 数据。后续真实问题图片须遵循服务契约，通过 assetId 与 Asset API 读取。

## INT-01 预置故事照片

`demo/` 中的六张 PNG 由用户提供，替换 Mock 故事的场景占位图。它们是演示素材，不代表已核实的地点现场照片。初始化和 fixture 升级时，`demoAssets.ts` 将文件写入对应 Asset 元数据与 Blob；业务组件仍按 `assetId` 经 Asset API 读取。

| 文件 | Asset ID | 用途 |
| --- | --- | --- |
| `demo/xuyuan-reference.png` | `a_demo_xuyuan_ref` | 静安公园许愿树参照图 |
| `demo/alley-reference.png` | `a_demo_alley_ref` | 虹口老弄堂参照图 |
| `demo/bridge-reference.png` | `a_demo_bridge_ref` | 西湖断桥参照图 |
| `demo/tree-reference.png` | `a_demo_tree_ref` | 故宫角楼老槐树参照图 |
| `demo/xuyuan-reply-1.png` | `a_demo_reply_xuyuan_1` | 第一条模拟未来回信图 |
| `demo/xuyuan-reply-2.png` | `a_demo_reply_xuyuan_2` | 第二条模拟未来回信图 |
