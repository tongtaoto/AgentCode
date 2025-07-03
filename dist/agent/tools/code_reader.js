"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.code_reader = void 0;
const fs_1 = __importDefault(require("fs"));
const code_reader = async ({ file_path }) => {
    try {
        console.log(`[工具] 开始读取文件: ${file_path}`);
        // 检查文件是否存在
        if (!fs_1.default.existsSync(file_path)) {
            throw new Error(`文件不存在: ${file_path}`);
        }
        // 读取文件内容
        const content = await fs_1.default.promises.readFile(file_path, 'utf8');
        // 获取文件信息
        const stats = await fs_1.default.promises.stat(file_path);
        const fileSize = stats.size;
        const lines = content.split('\n').length;
        console.log(`[工具] 文件读取成功: ${file_path} (${fileSize} bytes, ${lines} 行)`);
        return {
            content,
            file_path,
            size: fileSize,
            lines,
            message: `文件 ${file_path} 读取成功，大小: ${fileSize} bytes，共 ${lines} 行`
        };
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[工具] 文件读取失败: ${file_path}`, errorMessage);
        throw new Error(`文件读取失败: ${errorMessage}`);
    }
};
exports.code_reader = code_reader;
