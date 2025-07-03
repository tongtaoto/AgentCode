import React, { useState, useEffect } from 'react';
import { agentNode, toolNode } from '../agent/langgraph_agent';
import { AgentState, InternalMessage } from '../types';

// 动态导入ink组件
let render: any, Box: any, Text: any, useInput: any, useApp: any, TextInput: any;

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
const Message: React.FC<{ message: InternalMessage; index: number }> = ({ message, index }) => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'human': return '#4CAF50'; // 绿色
      case 'ai': return '#2196F3';    // 蓝色
      case 'tool': return '#FF9800';  // 橙色
      default: return '#9E9E9E';      // 灰色
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'human': return '👤';
      case 'ai': return '🤖';
      case 'tool': return '🔧';
      default: return '❓';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'human': return '用户';
      case 'ai': return 'AI助手';
      case 'tool': return '工具';
      default: return '未知';
    }
  };

  return (
    <Box key={index} marginY={1} flexDirection="column">
      <Box>
        <Text color={getRoleColor(message.role)} bold>
          {getRoleIcon(message.role)} {getRoleName(message.role)}
        </Text>
        <Text color="#666"> • {new Date().toLocaleTimeString()}</Text>
      </Box>
      <Box marginLeft={2} marginTop={1}>
        <Text color="#E0E0E0" wrap="wrap">
          {message.content}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color="#333">─</Text>
      </Box>
    </Box>
  );
};

// 输入组件
const InputArea: React.FC<{
  onSubmit: (input: string) => void;
  disabled: boolean;
}> = ({ onSubmit, disabled }) => {
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSubmit(input.trim());
      setInput('');
    }
  };

  useInput((input: string, key: { return: boolean }) => {
    if (key.return && !disabled) {
      handleSubmit();
    }
  });

  return (
    <Box marginTop={2} flexDirection="row" alignItems="center">
      <Text color="#4CAF50" bold>💬 </Text>
      <Text color="#666">输入消息: </Text>
      <Box marginLeft={1} flexGrow={1}>
        <TextInput
          value={input}
          onChange={setInput}
          placeholder="输入你的问题..."
        />
      </Box>
      {disabled && (
        <Text color="#FF9800">
          ⏳ 处理中...
        </Text>
      )}
    </Box>
  );
};

// 状态指示器
const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return '#4CAF50';
      case 'thinking': return '#FF9800';
      case 'processing': return '#2196F3';
      case 'error': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return '🟢';
      case 'thinking': return '🟡';
      case 'processing': return '🔵';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <Box marginBottom={1}>
      <Text color={getStatusColor(status)}>
        {getStatusIcon(status)} {status}
      </Text>
    </Box>
  );
};

// 主应用组件
const App: React.FC = () => {
  const [state, setState] = useState<AgentState>({
    messages: [],
    tool_calls: [],
    tool_results: []
  });
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'thinking' | 'processing' | 'error'>('idle');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (userInput: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setStatus('thinking');

    try {
      // 添加用户消息
      const newState: AgentState = {
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
        const agentResult = await agentNode(currentState);
        currentState = {
          ...currentState,
          messages: [...currentState.messages, ...agentResult.messages],
          tool_calls: agentResult.tool_calls
        };

        setState(currentState);

        // 检查是否有工具调用
        if (currentState.tool_calls.length > 0) {
          const toolResult = await toolNode(currentState);
          currentState = {
            ...currentState,
            messages: [...currentState.messages, ...toolResult.messages],
            tool_results: toolResult.tool_results,
            tool_calls: []
          };

          setState(currentState);
        } else {
          // 没有工具调用，退出循环
          break;
        }

        // 添加延迟以便观察过程
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setStatus('idle');
    } catch (error) {
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
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Box flexDirection="column" height="100%" padding={1}>
      {/* 标题 */}
      <Box marginBottom={2} justifyContent="center">
        <Text color="#4CAF50" bold>
          🚀 AI 编程助手 - 终端版
        </Text>
      </Box>

      {/* 状态指示器 */}
      <StatusIndicator status={status} />

      {/* 消息列表 */}
      <Box flexDirection="column" flexGrow={1} marginBottom={2}>
        {state.messages.length === 0 ? (
          <Box justifyContent="center" alignItems="center" height="50%">
            <Text color="#666" italic>
              欢迎使用AI编程助手！请输入你的问题开始对话。
            </Text>
          </Box>
        ) : (
          state.messages.map((message, index) => (
            <Message key={index} message={message} index={index} />
          ))
        )}
      </Box>

      {/* 输入区域 */}
      <InputArea onSubmit={handleSubmit} disabled={isProcessing} />

      {/* 帮助信息 */}
      <Box marginTop={1}>
        <Text color="#666" italic>
          提示: 按 Enter 发送消息，输入 "exit" 退出程序
        </Text>
      </Box>
    </Box>
  );
};

// 启动函数
export const startInkUI = async () => {
  await initInk();
  render(<App />);
};

export default App; 