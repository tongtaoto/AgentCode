"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.startInkUI = void 0;
const react_1 = __importStar(require("react"));
const langgraph_agent_1 = require("../agent/langgraph_agent");
// 动态导入ink组件
let render, Box, Text, useInput, useApp, TextInput;
const initInk = async () => {
    const ink = await import('ink');
    const textInput = await import('ink-text-input');
    render = ink.render;
    Box = ink.Box;
    Text = ink.Text;
    useInput = ink.useInput;
    useApp = ink.useApp;
    TextInput = textInput.default;
};
// 消息组件
const Message = ({ message, index }) => {
    const getRoleColor = (role) => {
        switch (role) {
            case 'human': return '#4CAF50'; // 绿色
            case 'ai': return '#2196F3'; // 蓝色
            case 'tool': return '#FF9800'; // 橙色
            default: return '#9E9E9E'; // 灰色
        }
    };
    const getRoleIcon = (role) => {
        switch (role) {
            case 'human': return '👤';
            case 'ai': return '🤖';
            case 'tool': return '🔧';
            default: return '❓';
        }
    };
    const getRoleName = (role) => {
        switch (role) {
            case 'human': return '用户';
            case 'ai': return 'AI助手';
            case 'tool': return '工具';
            default: return '未知';
        }
    };
    return (react_1.default.createElement(Box, { key: index, marginY: 1, flexDirection: "column" },
        react_1.default.createElement(Box, null,
            react_1.default.createElement(Text, { color: getRoleColor(message.role), bold: true },
                getRoleIcon(message.role),
                " ",
                getRoleName(message.role)),
            react_1.default.createElement(Text, { color: "#666" },
                " \u2022 ",
                new Date().toLocaleTimeString())),
        react_1.default.createElement(Box, { marginLeft: 2, marginTop: 1 },
            react_1.default.createElement(Text, { color: "#E0E0E0", wrap: "wrap" }, message.content)),
        react_1.default.createElement(Box, { marginTop: 1 },
            react_1.default.createElement(Text, { color: "#333" }, "\u2500"))));
};
// 输入组件
const InputArea = ({ onSubmit, disabled }) => {
    const [input, setInput] = (0, react_1.useState)('');
    const handleSubmit = () => {
        if (input.trim() && !disabled) {
            onSubmit(input.trim());
            setInput('');
        }
    };
    useInput((input, key) => {
        if (key.return && !disabled) {
            handleSubmit();
        }
    });
    return (react_1.default.createElement(Box, { marginTop: 2, flexDirection: "row", alignItems: "center" },
        react_1.default.createElement(Text, { color: "#4CAF50", bold: true }, "\uD83D\uDCAC "),
        react_1.default.createElement(Text, { color: "#666" }, "\u8F93\u5165\u6D88\u606F: "),
        react_1.default.createElement(Box, { marginLeft: 1, flexGrow: 1 },
            react_1.default.createElement(TextInput, { value: input, onChange: setInput, placeholder: "\u8F93\u5165\u4F60\u7684\u95EE\u9898..." })),
        disabled && (react_1.default.createElement(Text, { color: "#FF9800" }, "\u23F3 \u5904\u7406\u4E2D..."))));
};
// 状态指示器
const StatusIndicator = ({ status }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'idle': return '#4CAF50';
            case 'thinking': return '#FF9800';
            case 'processing': return '#2196F3';
            case 'error': return '#F44336';
            default: return '#9E9E9E';
        }
    };
    const getStatusIcon = (status) => {
        switch (status) {
            case 'idle': return '🟢';
            case 'thinking': return '🟡';
            case 'processing': return '🔵';
            case 'error': return '🔴';
            default: return '⚪';
        }
    };
    return (react_1.default.createElement(Box, { marginBottom: 1 },
        react_1.default.createElement(Text, { color: getStatusColor(status) },
            getStatusIcon(status),
            " ",
            status)));
};
// 主应用组件
const App = () => {
    const [state, setState] = (0, react_1.useState)({
        messages: [],
        tool_calls: [],
        tool_results: []
    });
    const [input, setInput] = (0, react_1.useState)('');
    const [status, setStatus] = (0, react_1.useState)('idle');
    const [isProcessing, setIsProcessing] = (0, react_1.useState)(false);
    const handleSubmit = async (userInput) => {
        if (isProcessing)
            return;
        setIsProcessing(true);
        setStatus('thinking');
        try {
            // 添加用户消息
            const newState = {
                messages: [...state.messages, { role: 'human', content: userInput }],
                tool_calls: [],
                tool_results: []
            };
            setState(newState);
            // 执行Agent循环
            let currentState = newState;
            let iteration = 0;
            const maxIterations = 10;
            while (iteration < maxIterations) {
                iteration++;
                setStatus('processing');
                // 执行agent节点
                const agentResult = await (0, langgraph_agent_1.agentNode)(currentState);
                currentState = {
                    ...currentState,
                    messages: [...currentState.messages, ...agentResult.messages],
                    tool_calls: agentResult.tool_calls
                };
                setState(currentState);
                // 检查是否有工具调用
                if (currentState.tool_calls.length > 0) {
                    const toolResult = await (0, langgraph_agent_1.toolNode)(currentState);
                    currentState = {
                        ...currentState,
                        messages: [...currentState.messages, ...toolResult.messages],
                        tool_results: toolResult.tool_results,
                        tool_calls: []
                    };
                    setState(currentState);
                }
                else {
                    // 没有工具调用，退出循环
                    break;
                }
                // 添加延迟以便观察过程
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            setStatus('idle');
        }
        catch (error) {
            console.error('处理错误:', error);
            setStatus('error');
            // 添加错误消息
            setState(prev => ({
                ...prev,
                messages: [...prev.messages, {
                        role: 'ai',
                        content: `抱歉，处理过程中出现了错误: ${error instanceof Error ? error.message : '未知错误'}`
                    }]
            }));
        }
        finally {
            setIsProcessing(false);
        }
    };
    return (react_1.default.createElement(Box, { flexDirection: "column", height: "100%", padding: 1 },
        react_1.default.createElement(Box, { marginBottom: 2, justifyContent: "center" },
            react_1.default.createElement(Text, { color: "#4CAF50", bold: true }, "\uD83D\uDE80 AI \u7F16\u7A0B\u52A9\u624B - \u7EC8\u7AEF\u7248")),
        react_1.default.createElement(StatusIndicator, { status: status }),
        react_1.default.createElement(Box, { flexDirection: "column", flexGrow: 1, marginBottom: 2 }, state.messages.length === 0 ? (react_1.default.createElement(Box, { justifyContent: "center", alignItems: "center", height: "50%" },
            react_1.default.createElement(Text, { color: "#666", italic: true }, "\u6B22\u8FCE\u4F7F\u7528AI\u7F16\u7A0B\u52A9\u624B\uFF01\u8BF7\u8F93\u5165\u4F60\u7684\u95EE\u9898\u5F00\u59CB\u5BF9\u8BDD\u3002"))) : (state.messages.map((message, index) => (react_1.default.createElement(Message, { key: index, message: message, index: index }))))),
        react_1.default.createElement(InputArea, { onSubmit: handleSubmit, disabled: isProcessing }),
        react_1.default.createElement(Box, { marginTop: 1 },
            react_1.default.createElement(Text, { color: "#666", italic: true }, "\u63D0\u793A: \u6309 Enter \u53D1\u9001\u6D88\u606F\uFF0C\u8F93\u5165 \"exit\" \u9000\u51FA\u7A0B\u5E8F"))));
};
// 启动函数
const startInkUI = async () => {
    await initInk();
    render(react_1.default.createElement(App, null));
};
exports.startInkUI = startInkUI;
exports.default = App;
