import fs from 'fs';
import path from 'path';

export const code_updater = async ({ file_path, content, backup = false }: { file_path: string; content: string; backup?: boolean }) => {
    try {
        console.log(`[工具] 开始修改文件: ${file_path}`);
        
        // 检查文件是否存在
        if (!fs.existsSync(file_path)) {
            throw new Error(`文件不存在: ${file_path}`);
        }
        
        // 备份原文件（可选）
        // if (backup) {
        //     const backupPath = `${file_path}.backup.${Date.now()}`;
        //     await fs.promises.copyFile(file_path, backupPath);
        //     console.log(`[工具] 已创建备份文件: ${backupPath}`);
        // }
        
        // 获取修改前的文件信息
        const oldStats = await fs.promises.stat(file_path);
        const oldSize = oldStats.size;
        
        // 写入新内容
        await fs.promises.writeFile(file_path, content, 'utf8');
        
        // 获取修改后的文件信息
        const newStats = await fs.promises.stat(file_path);
        const newSize = newStats.size;
        const lines = content.split('\n').length;
        
        console.log(`[工具] 文件修改成功: ${file_path} (${oldSize} -> ${newSize} bytes, ${lines} 行)`);
        return {
            file_path,
            old_size: oldSize,
            new_size: newSize,
            lines,
            backup_created: backup,
            message: `文件 ${file_path} 修改成功，大小: ${oldSize} -> ${newSize} bytes，共 ${lines} 行${backup ? '，已创建备份' : ''}`
        };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[工具] 文件修改失败: ${file_path}`, errorMessage);
        throw new Error(`文件修改失败: ${errorMessage}`);
    }
};