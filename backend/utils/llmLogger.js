// utils/llmLogger.js
const fs = require('fs');
const path = require('path');

class LLMLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  sanitizeForLogging(data) {
    // Create a deep copy to avoid modifying original data
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Remove or mask sensitive information
    if (sanitized.messages) {
      sanitized.messages.forEach(message => {
        if (message.content && typeof message.content === 'string') {
          // Truncate very long content for readability
          if (message.content.length > 2000) {
            message.content = message.content.substring(0, 2000) + '...[TRUNCATED]';
          }
        }
      });
    }
    
    return sanitized;
  }

  logRequest(serviceName, functionName, requestData) {
    const timestamp = this.formatTimestamp();
    const logEntry = {
      timestamp,
      type: 'REQUEST',
      service: serviceName,
      function: functionName,
      data: this.sanitizeForLogging(requestData)
    };

    // Console log for immediate visibility
    console.log(`\n🤖 [LLM REQUEST] ${serviceName}.${functionName} at ${timestamp}`);
    console.log('📤 Request Data:', JSON.stringify(logEntry.data, null, 2));

    // File log for persistence
    this.writeToFile('llm-requests.log', logEntry);
  }

  logResponse(serviceName, functionName, responseData, processingTime) {
    const timestamp = this.formatTimestamp();
    const logEntry = {
      timestamp,
      type: 'RESPONSE',
      service: serviceName,
      function: functionName,
      processingTime: processingTime ? `${processingTime}ms` : 'unknown',
      data: this.sanitizeForLogging(responseData)
    };

    // Console log for immediate visibility
    console.log(`\n✅ [LLM RESPONSE] ${serviceName}.${functionName} at ${timestamp} (${logEntry.processingTime})`);
    console.log('📥 Response Data:', JSON.stringify(logEntry.data, null, 2));

    // File log for persistence
    this.writeToFile('llm-responses.log', logEntry);
  }

  logError(serviceName, functionName, error, requestData = null) {
    const timestamp = this.formatTimestamp();
    const logEntry = {
      timestamp,
      type: 'ERROR',
      service: serviceName,
      function: functionName,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      requestData: requestData ? this.sanitizeForLogging(requestData) : null
    };

    // Console log for immediate visibility
    console.error(`\n❌ [LLM ERROR] ${serviceName}.${functionName} at ${timestamp}`);
    console.error('🚨 Error:', error.message);
    if (requestData) {
      console.error('📤 Request Data:', JSON.stringify(logEntry.requestData, null, 2));
    }

    // File log for persistence
    this.writeToFile('llm-errors.log', logEntry);
  }

  writeToFile(filename, data) {
    try {
      const filePath = path.join(this.logDir, filename);
      const logLine = JSON.stringify(data) + '\n';
      fs.appendFileSync(filePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Method to get recent logs (useful for debugging)
  getRecentLogs(type = 'all', limit = 50) {
    try {
      const files = {
        'requests': 'llm-requests.log',
        'responses': 'llm-responses.log',
        'errors': 'llm-errors.log'
      };

      if (type === 'all') {
        const allLogs = [];
        Object.values(files).forEach(filename => {
          const filePath = path.join(this.logDir, filename);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.trim().split('\n').filter(line => line);
            const logs = lines.map(line => JSON.parse(line));
            allLogs.push(...logs);
          }
        });
        return allLogs
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit);
      } else if (files[type]) {
        const filePath = path.join(this.logDir, files[type]);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.trim().split('\n').filter(line => line);
          const logs = lines.map(line => JSON.parse(line));
          return logs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to read logs:', error);
      return [];
    }
  }
}

// Create singleton instance
const llmLogger = new LLMLogger();

module.exports = llmLogger;

