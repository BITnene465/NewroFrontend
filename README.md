# Live2D Vue3 PIXI 集成项目

使用 PIXI.js + pixi-live2d-display 对 live2d 进行渲染。它提供了实时口型同步、模型动作控制和参数调整等功能。

## 功能

*   **Live2D 模型显示**: 使用 `pixi-live2d-display` 在 Vue 组件中加载和渲染 Live2D Cubism 4 模型。
*   **实时口型同步**:
    *   通过麦克风输入捕捉音频。
    *   分析音频频率数据，提取元音（'a', 'i', 'u', 'e', 'o'）的权重。
    *   根据提取的权重实时驱动 Live2D 模型的口型参数 (`ParamMouthA`, `ParamMouthI`, `ParamMouthU`, `ParamMouthE`, `ParamMouthO`) 和嘴巴张开度 (`ParamMouthOpen`)。
*   **手动口型控制**:
    *   提供滑块界面，允许用户手动调整各个口型参数 (`ParamA`, `ParamI`, `ParamU`, `ParamE`, `ParamO`)。
    *   可以重置所有口型参数为默认值。
*   **模型动作和状态控制**:
    *   播放模型内置的动作 (motions)。
    *   **暂停/恢复模型**: 实现了一个全面的暂停功能，可以“冻结”模型，包括：
        *   停止所有正在播放的动作。
        *   禁用/启用眼睛眨动 (`eyeBlink`)。
        *   禁用/启用物理效果 (`physics`)。
        *   禁用/启用呼吸动画 (`breathing`)。
        *   覆盖/恢复核心模型的 `update` 方法，以完全停止/恢复内部更新。
    *   此暂停功能对于确保口型同步动画不会被模型的默认空闲动作（如呼吸、眨眼）覆盖至关重要。
*   **表情切换**: 支持加载和应用不同的表情。
*   **测试视图 (`TestView.vue`)**:
    *   一个专门用于测试 Live2D 功能的页面。
    *   包含用于加载模型、播放动作、切换表情、测试口型同步和手动调整口型参数的控件。
    *   显示模型当前状态（如动作是否暂停、口型同步是否激活等）。
    *   提供多种口型同步测试数据。
    *   响应式设计，兼容桌面和移动设备。

## 安装和运行

1.  **安装依赖**:
    ```bash
    npm install
    ```
    或者，如果您使用 `yarn` 或 `pnpm`:
    ```bash
    yarn install
    # 或
    pnpm install
    ```

2.  **运行开发服务器**:
    ```bash
    npm run dev
    ```
    此命令将启动 Vite 开发服务器。默认情况下，应用程序将在 `http://localhost:5173` (或 Vite 自动选择的下一个可用端口) 上可用。

    或
    ```bash
    npm run build
    npm run preview
    ```

## 已知问题和未来工作

*   **口型同步准确性**: 当前的元音提取算法 (`AudioService.ts`) 非常简化，主要用于演示目的。其准确性和鲁棒性有待提高。
*   **模型兼容性**: 主要使用 `Mao` 模型进行测试。与其他 Live2D 模型的兼容性可能需要进一步测试和调整。
*   **动画序列**: 未来可以考虑添加定义和播放复杂动画序列的功能。
*   **性能优化**: 对于更复杂的场景或低端设备，可能需要进一步的性能优化。
*   **更精细的音频处理**: 实现更高级的音频处理技术，例如 MFCC (梅尔频率倒谱系数) 或基于机器学习的音素识别，以获得更自然和准确的口型同步。

## 项目结构 (部分相关文件)

```
NewroFrontend/
├── public/
│   └── Resources/
│       └── Mao/                  # Live2D 模型资源
│           ├── Mao.model3.json   # 模型配置文件
│           ├── Mao.physics3.json # 物理配置文件
│           ├── Mao.cdi3.json     # 参数配置文件
│           ├── expressions/      # 表情文件
│           └── motions/          # 动作文件
├── src/
│   ├── services/
│   │   └── AudioService.ts     # 音频处理和口型同步逻辑
│   ├── views/
│   │   ├── TestView.vue        # Live2D 测试和演示页面
│   │   └── Live2dChatView.vue  # (早期版本中使用的视图)
│   ├── router/
│   │   └── index.ts            # Vue Router 配置
│   └── App.vue
│   └── main.ts
├── package.json                  # 项目依赖和脚本
└── README.md                     # 本文件
```