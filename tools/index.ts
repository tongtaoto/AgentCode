/**
 * 工具定义
 */
import { code_writer } from './code_writer.js';
import { code_reader } from './code_reader.js';
import { code_updater } from './code_updater.js';
import { code_deleter } from './code_deleter.js';
import { command_runner } from './command_runner.js';


export const tools = [
  {
    name: 'code_writer',
    execute: code_writer
  },
  {
    name: 'code_reader',
    execute: code_reader
  }, 
  {
    name: 'code_updater',
    execute: code_updater
  },
  {
    name: 'code_deleter',
    execute: code_deleter
  },
  {
    name: 'command_runner',
    execute: command_runner
  }
];