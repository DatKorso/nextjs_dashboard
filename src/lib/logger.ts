import { writeFile, appendFile, mkdir, readdir, stat, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  error?: Error
}

export interface FileUploadLogContext {
  fileName: string
  fileSize: number
  reportType: string
  uploadId?: number
  userId?: string
  stage: 'validation' | 'parsing' | 'processing' | 'storage' | 'completion'
}

class Logger {
  private logDir: string
  private maxLogFiles: number
  private maxLogAge: number // в днях

  constructor() {
    this.logDir = join(process.cwd(), 'logs')
    this.maxLogFiles = 30
    this.maxLogAge = 30
  }

  /**
   * Инициализация директории логов
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      if (!existsSync(this.logDir)) {
        await mkdir(this.logDir, { recursive: true })
      }
    } catch (error) {
      console.error('Failed to create logs directory:', error)
    }
  }

  /**
   * Получение имени файла лога для текущей даты
   */
  private getLogFileName(date: Date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0]
    return `upload-${dateStr}.log`
  }

  /**
   * Форматирование записи лога
   */
  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry
    
    let logLine = `[${timestamp}] [${level}] ${message}`
    
    if (context) {
      logLine += ` | Context: ${JSON.stringify(context)}`
    }
    
    if (error) {
      logLine += ` | Error: ${error.message}`
      if (error.stack) {
        logLine += ` | Stack: ${error.stack}`
      }
    }
    
    return logLine + '\n'
  }

  /**
   * Запись в лог файл
   */
  private async writeToLogFile(entry: LogEntry): Promise<void> {
    try {
      await this.ensureLogDirectory()
      
      const logFileName = this.getLogFileName()
      const logFilePath = join(this.logDir, logFileName)
      const logLine = this.formatLogEntry(entry)
      
      await appendFile(logFilePath, logLine, 'utf8')
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  /**
   * Очистка старых логов
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const files = await readdir(this.logDir)
      const logFiles = files.filter(file => file.startsWith('upload-') && file.endsWith('.log'))
      
      // Сортируем по дате
      const sortedFiles = logFiles.sort().reverse()
      
      // Удаляем файлы старше maxLogAge дней
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.maxLogAge)
      
      for (const file of sortedFiles) {
        const filePath = join(this.logDir, file)
        const stats = await stat(filePath)
        
        if (stats.mtime < cutoffDate) {
          await unlink(filePath)
        }
      }
      
      // Удаляем лишние файлы если их больше maxLogFiles
      if (sortedFiles.length > this.maxLogFiles) {
        const filesToRemove = sortedFiles.slice(this.maxLogFiles)
        for (const file of filesToRemove) {
          const filePath = join(this.logDir, file)
          await unlink(filePath)
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error)
    }
  }

  /**
   * Создание записи лога
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    }
  }

  /**
   * Основной метод логирования
   */
  private async log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    const entry = this.createLogEntry(level, message, context, error)
    
    // Записываем в файл
    await this.writeToLogFile(entry)
    
    // Также выводим в консоль для разработки
    const consoleMessage = this.formatLogEntry(entry).trim()
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(consoleMessage)
        break
      case LogLevel.INFO:
        console.info(consoleMessage)
        break
      case LogLevel.WARN:
        console.warn(consoleMessage)
        break
      case LogLevel.ERROR:
        console.error(consoleMessage)
        break
    }
    
    // Периодически очищаем старые логи
    if (Math.random() < 0.01) { // 1% шанс при каждой записи
      await this.cleanupOldLogs()
    }
  }

  /**
   * Методы для разных уровней логирования
   */
  async debug(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.DEBUG, message, context)
  }

  async info(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.INFO, message, context)
  }

  async warn(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.WARN, message, context)
  }

  async error(message: string, context?: Record<string, any>, error?: Error): Promise<void> {
    await this.log(LogLevel.ERROR, message, context, error)
  }

  /**
   * Специализированные методы для логирования загрузки файлов
   */
  async logFileUploadStart(context: FileUploadLogContext): Promise<void> {
    await this.info('File upload started', {
      ...context,
      stage: 'validation'
    })
  }

  async logFileUploadProgress(
    message: string,
    context: FileUploadLogContext,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.info(message, {
      ...context,
      ...additionalData
    })
  }

  async logFileUploadSuccess(
    context: FileUploadLogContext,
    results: { recordsProcessed: number; warnings?: string[] }
  ): Promise<void> {
    await this.info('File upload completed successfully', {
      ...context,
      stage: 'completion',
      recordsProcessed: results.recordsProcessed,
      warnings: results.warnings
    })
  }

  async logFileUploadError(
    context: FileUploadLogContext,
    error: Error,
    additionalData?: Record<string, any>
  ): Promise<void> {
    await this.error('File upload failed', {
      ...context,
      ...additionalData
    }, error)
  }

  async logParsingError(
    context: FileUploadLogContext,
    errors: string[],
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.error('File parsing failed', {
      ...context,
      stage: 'parsing',
      parsingErrors: errors,
      metadata
    })
  }

  async logValidationError(
    context: FileUploadLogContext,
    validationErrors: string[],
    rowCount?: number
  ): Promise<void> {
    await this.error('File validation failed', {
      ...context,
      stage: 'validation',
      validationErrors,
      rowCount
    })
  }

  /**
   * Получение последних логов для отображения в UI
   */
  async getRecentLogs(count: number = 100): Promise<LogEntry[]> {
    try {
      await this.ensureLogDirectory()
      
      const files = await readdir(this.logDir)
      const logFiles = files
        .filter(file => file.startsWith('upload-') && file.endsWith('.log'))
        .sort()
        .reverse()
        .slice(0, 3) // Последние 3 файла
      
      const logs: LogEntry[] = []
      
      for (const file of logFiles) {
        const filePath = join(this.logDir, file)
        const content = await readFile(filePath, 'utf8')
        const lines = content.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            const entry = this.parseLogLine(line)
            if (entry) {
              logs.push(entry)
            }
          } catch (error) {
            console.warn('Failed to parse log line:', line)
          }
        }
      }
      
      return logs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, count)
    } catch (error) {
      console.error('Failed to get recent logs:', error)
      return []
    }
  }

  /**
   * Парсинг строки лога обратно в объект
   */
  private parseLogLine(line: string): LogEntry | null {
    try {
      const timestampMatch = line.match(/\[([^\]]+)\]/)
      const levelMatch = line.match(/\[([^\]]+)\].*?\[([^\]]+)\]/)
      const messageMatch = line.match(/\[([^\]]+)\].*?\[([^\]]+)\] ([^|]+)/)
      
      if (!timestampMatch || !levelMatch || !messageMatch) {
        return null
      }
      
      const timestamp = timestampMatch[1]
      const level = levelMatch[2] as LogLevel
      const message = messageMatch[3].trim()
      
      let context: Record<string, any> | undefined
      let error: Error | undefined
      
      const contextMatch = line.match(/Context: ({[^}]+})/)
      if (contextMatch) {
        try {
          context = JSON.parse(contextMatch[1])
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      const errorMatch = line.match(/Error: ([^|]+)/)
      if (errorMatch) {
        error = new Error(errorMatch[1].trim())
      }
      
      return {
        timestamp,
        level,
        message,
        context,
        error
      }
    } catch (error) {
      return null
    }
  }
}

// Экспорт синглтона
export const logger = new Logger()

// Экспорт для удобства
export const logFileUploadStart = logger.logFileUploadStart.bind(logger)
export const logFileUploadProgress = logger.logFileUploadProgress.bind(logger)
export const logFileUploadSuccess = logger.logFileUploadSuccess.bind(logger)
export const logFileUploadError = logger.logFileUploadError.bind(logger)
export const logParsingError = logger.logParsingError.bind(logger)
export const logValidationError = logger.logValidationError.bind(logger)