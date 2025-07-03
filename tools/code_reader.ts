import fs from 'fs';
import path from 'path';

export const code_reader = async ({ file_path }: { file_path: string }) => {
    try {
        console.log(`[工具] 开始读取文件: ${file_path}`);
        
        // 检查文件是否存在
        if (!fs.existsSync(file_path)) {
            return {
                success: false,
                content: '',
                file_path,
                size: 0,
                lines: 0,
                file_type: '',
                encoding: 'utf8',
                message: `文件不存在: ${file_path}`
            };
        }
        
        // 读取文件内容
        const content = await fs.promises.readFile(file_path, 'utf8');
        
        // 获取文件信息
        const stats = await fs.promises.stat(file_path);
        const fileSize = stats.size;
        const lines = content.split('\n').length;
        const fileExtension = path.extname(file_path).toLowerCase();
        
        // 确定文件类型
        const getFileType = (ext: string): string => {
            const typeMap: { [key: string]: string } = {
                '.js': 'JavaScript',
                '.ts': 'TypeScript',
                '.py': 'Python',
                '.java': 'Java',
                '.cpp': 'C++',
                '.c': 'C',
                '.html': 'HTML',
                '.css': 'CSS',
                '.json': 'JSON',
                '.xml': 'XML',
                '.md': 'Markdown',
                '.txt': 'Text',
                '.yml': 'YAML',
                '.yaml': 'YAML',
                '.sql': 'SQL',
                '.sh': 'Shell Script',
                '.bat': 'Batch Script'
            };
            return typeMap[ext] || 'Unknown';
        };
        
        const fileType = getFileType(fileExtension);
        
        console.log(`[工具] 文件读取成功: ${file_path} (${fileSize} bytes, ${lines} 行, ${fileType})`);
        
        return `文件 ${file_path} 写入成功，内容为: ${content} ` ;
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[工具] 文件读取失败: ${file_path}`, errorMessage);
        return {
            success: false,
            content: '',
            file_path,
            size: 0,
            lines: 0,
            file_type: '',
            encoding: 'utf8',
            message: `文件读取失败: ${errorMessage}`
        };
    }
};