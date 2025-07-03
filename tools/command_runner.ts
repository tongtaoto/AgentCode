import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

export const command_runner = async ({ command, cwd, timeout = 30000, openNewWindow = true, windowTitle, keepWindowOpen = true }: { command: string; cwd?: string; timeout?: number; openNewWindow?: boolean; windowTitle?: string; keepWindowOpen?: boolean }) => {
    try {
        console.log(`[工具] 开始执行命令: ${command}`);
        
        // 设置工作目录
        let workingDir = cwd || process.cwd();
        
        // 检查工作目录是否存在
        if (cwd && !fs.existsSync(cwd)) {
            throw new Error(`指定目录不存在: ${cwd}`);
        }
        
        // 规范化路径
        workingDir = path.resolve(workingDir);
        console.log(`[工具] 工作目录: ${workingDir}`);
        
        // 执行命令
        const startTime = Date.now();
        
        // 如果需要在新窗口中运行命令
        if (openNewWindow) {
            console.log(`[工具] 在新窗口中执行命令: ${command}`);
            
            let cmdProcess;
            const isWindows = os.platform() === 'win32';
            
            try {
                if (isWindows) {
                    // 在Windows系统中，使用cmd /c start "title" cmd /k "command" 打开新窗口并执行命令
                     // /c 表示执行完命令后关闭窗口，/k 表示执行完命令后保持窗口打开
                     console.log(`[工具] 在Windows系统中打开新命令窗口`);
                     
                     // 设置窗口标题，如果没有提供则使用命令本身作为标题
                      const title = windowTitle || `执行命令: ${command.length > 30 ? command.substring(0, 30) + '...' : command}`;
                      
                      // 根据keepWindowOpen选项决定使用/k还是/c参数
                      // /k: 执行完命令后保持窗口打开
                      // /c: 执行完命令后关闭窗口
                      const cmdFlag = keepWindowOpen ? '/k' : '/c';
                      
                      cmdProcess = spawn('cmd', ['/c', 'start', `"${title}"`, 'cmd', cmdFlag, `"${command}"`], {
                cwd: workingDir,
                detached: true,  // 分离子进程，使其在新窗口中运行
                shell: true,     // 使用shell
                stdio: 'ignore'  // 忽略标准输入输出
                    });
                    
                    // 添加错误处理
                    cmdProcess.on('error', (err) => {
                        console.error(`[工具] 启动CMD窗口失败:`, err);
                    });
                } else {
                    // 在Linux/Mac系统中，使用终端模拟器打开新窗口
                    console.log(`[工具] 在非Windows系统中尝试打开新终端窗口`);
                    
                    if (fs.existsSync('/usr/bin/gnome-terminal')) {
                        // GNOME桌面环境 (Ubuntu等)
                        cmdProcess = spawn('gnome-terminal', ['--', 'bash', '-c', `${command}; exec bash`], {
                            cwd: workingDir,
                            detached: true,
                            stdio: 'ignore'
                        });
                    } else if (fs.existsSync('/usr/bin/xterm')) {
                        // 通用X终端
                        cmdProcess = spawn('xterm', ['-e', `${command}; exec bash`], {
                            cwd: workingDir,
                            detached: true,
                            stdio: 'ignore'
                        });
                    } else if (fs.existsSync('/Applications/Utilities/Terminal.app/Contents/MacOS/Terminal')) {
                        // macOS终端
                        cmdProcess = spawn('open', ['-a', 'Terminal', command], {
                            cwd: workingDir,
                            detached: true,
                            stdio: 'ignore'
                        });
                    } else {
                        throw new Error('无法找到合适的终端模拟器');
                    }
                    
                    // 添加错误处理
                    cmdProcess.on('error', (err) => {
                        console.error(`[工具] 启动终端窗口失败:`, err);
                    });
                }
                
                // 解除父进程对子进程的引用，允许父进程独立退出
                if (cmdProcess) cmdProcess.unref();
            } catch (err) {
                console.error(`[工具] 打开新命令窗口失败:`, err);
            }
            
            // 已在try块中处理
            
            const endTime = Date.now();
            const executionTime = endTime - startTime;
            
            console.log(`[工具] 命令窗口已打开: ${command}`);
            
            return {
                command,
                cwd: workingDir,
                execution_time: executionTime,
                success: true,
                new_window: true,
                platform: os.platform(),
                window_title: windowTitle || `执行命令: ${command.length > 30 ? command.substring(0, 30) + '...' : command}`,
                keep_window_open: keepWindowOpen,
                message: `命令 "${command}" 已在新${isWindows ? 'CMD' : '终端'}窗口中启动，` +
                         `标题: "${windowTitle || `执行命令: ${command.length > 30 ? command.substring(0, 30) + '...' : command}`}", ` +
                         `工作目录: "${workingDir}", ` +
                         `${keepWindowOpen ? '执行完成后窗口将保持打开' : '执行完成后窗口将自动关闭'}`
            };
        }
        
        // 如果不需要新窗口，使用原来的方式执行
        const { stdout, stderr } = await execAsync(command, {
            cwd: workingDir,
            timeout: timeout,
            encoding: 'utf8',
            maxBuffer: 1024 * 1024 * 10 // 10MB buffer
        });
        
        const endTime = Date.now();
        const executionTime = endTime - startTime;
        
        // 处理输出
        const output = stdout.trim();
        const errorOutput = stderr.trim();
        
        let result = {
            command,
            cwd: workingDir,
            execution_time: executionTime,
            stdout: output,
            stderr: errorOutput,
            success: true
        };
        
        if (errorOutput) {
            console.warn(`[工具] 命令执行有警告: ${command}`, errorOutput);
        }
        
        console.log(`[工具] 命令执行成功: ${command} (${executionTime}ms)`);
        
        return {
            ...result,
            message: `命令 "${command}" 在目录 "${workingDir}" 执行成功，耗时: ${executionTime}ms${output ? `\n输出: ${output}` : ''}${errorOutput ? `\n警告: ${errorOutput}` : ''}`
        };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT');
        
        console.error(`[工具] 命令执行失败: ${command}`, errorMessage);
        
        // 返回错误信息而不是抛出异常，让调用者决定如何处理
        return {
            command,
            cwd: cwd || process.cwd(),
            success: false,
            error: errorMessage,
            timeout: isTimeout,
            message: `命令 "${command}" 执行失败: ${errorMessage}${isTimeout ? ' (超时)' : ''}`
        };
    }
};