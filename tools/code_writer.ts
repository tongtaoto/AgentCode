import fs from 'fs';
import path from 'path';

export const code_writer = async ({ file_path, content }: { file_path: string; content: string }) => {
    try {
        console.log(`[工具] 开始写入文件: ${file_path}`);
        
        // 确保目录存在
        const dir = path.dirname(file_path);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[工具] 创建目录: ${dir}`);
        }
        
        // 写入文件内容
        await fs.promises.writeFile(file_path, content, 'utf8');
        
        // 获取文件大小
        const stats = await fs.promises.stat(file_path);
        const fileSize = stats.size;
        
        console.log(`[工具] 文件写入成功: ${file_path} (${fileSize} bytes)`);
        return `文件 ${file_path} 写入成功，大小: ${fileSize} bytes`;
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[工具] 文件写入失败: ${file_path}`, errorMessage);
        throw new Error(`文件写入失败: ${errorMessage}`);
    }
};