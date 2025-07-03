import fs from 'fs';
import path from 'path';

export const code_deleter = async ({ file_path, backup = false }: { file_path: string; backup?: boolean }) => {
    try {
        console.log(`[工具] 开始删除文件: ${file_path}`);
        
        // 检查文件是否存在
        if (!fs.existsSync(file_path)) {
            console.log(`[工具] 文件不存在: ${file_path}`);
            return {
                file_path,
                deleted_size: 0,
                deleted_lines: 0,
                backup_path: null,
                backup_created: false,
                success: false,
                message: `文件不存在: ${file_path}`
            };
        }
        
        // 获取文件信息
        const stats = await fs.promises.stat(file_path);
        const fileSize = stats.size;
        const content = await fs.promises.readFile(file_path, 'utf8');
        const lines = content.split('\n').length;
        
        let backupPath = '';
        // 备份原文件（可选）
        // if (backup) {
        //     const dir = path.dirname(file_path);
        //     const basename = path.basename(file_path);
        //     const ext = path.extname(file_path);
        //     const name = path.basename(file_path, ext);
        //     backupPath = path.join(dir, `${name}.deleted.${Date.now()}${ext}`);
            
        //     await fs.promises.copyFile(file_path, backupPath);
        //     console.log(`[工具] 已创建备份文件: ${backupPath}`);
        // }
        
        // 删除文件
        await fs.promises.unlink(file_path);
        
        console.log(`[工具] 文件删除成功: ${file_path} (${fileSize} bytes, ${lines} 行)`);
        return {
            file_path,
            deleted_size: fileSize,
            deleted_lines: lines,
            backup_path: backup ? backupPath : null,
            backup_created: backup,
            success: true,
            message: `文件 ${file_path} 删除成功，原大小: ${fileSize} bytes，共 ${lines} 行${backup ? `，备份保存至: ${backupPath}` : ''}`
        };
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[工具] 文件删除失败: ${file_path}`, errorMessage);
        return {
            file_path,
            deleted_size: 0,
            deleted_lines: 0,
            backup_path: null,
            backup_created: false,
            success: false,
            message: `文件删除失败: ${errorMessage}`
        };
    }
};