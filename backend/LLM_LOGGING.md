# LLM Logging Documentation

This document describes the comprehensive logging system implemented for tracking LLM (Large Language Model) requests and responses in the business card analyzer backend.

## Overview

The LLM logging system provides detailed tracking of:
- All requests sent to OpenAI's GPT models
- All responses received from the models
- Processing times and performance metrics
- Error handling and retry attempts
- Token usage and cost tracking

## Files Added/Modified

### New Files
- `backend/utils/llmLogger.js` - Centralized logging utility
- `backend/test-llm-logging.js` - Test script for logging functionality
- `backend/LLM_LOGGING.md` - This documentation file

### Modified Files
- `backend/services/gptService.js` - Added logging to `callGPTParser` function
- `backend/controllers/ocrController.js` - Added logging to `parseCardsWithGPT` function

## Log Files

All logs are stored in the `backend/logs/` directory:

- `llm-requests.log` - All LLM requests with full details
- `llm-responses.log` - All LLM responses with processing times
- `llm-errors.log` - All LLM errors with context

## Log Format

Each log entry is a JSON object with the following structure:

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "type": "REQUEST|RESPONSE|ERROR",
  "service": "gptService|ocrController",
  "function": "functionName",
  "processingTime": "1500ms", // Only for responses
  "data": {
    // Request/Response data
  }
}
```

## Features

### Request Logging
- Full request payload including model, messages, and parameters
- Input hints and context information
- Batch information for bulk operations
- Sanitized content (long content is truncated for readability)

### Response Logging
- Complete response from the LLM
- Parsed and processed data
- Token usage statistics
- Processing time measurements
- Performance metrics

### Error Logging
- Detailed error information with stack traces
- Request context that caused the error
- Retry attempt tracking
- Fallback behavior logging

### Performance Tracking
- Individual request/response times
- Batch processing times
- Average processing times per card/batch
- Token usage and cost estimation

## Usage Examples

### Basic Logging
```javascript
const llmLogger = require('./utils/llmLogger');

// Log a request
llmLogger.logRequest('myService', 'myFunction', requestData);

// Log a response
llmLogger.logResponse('myService', 'myFunction', responseData, processingTime);

// Log an error
llmLogger.logError('myService', 'myFunction', error, requestData);
```

### Retrieving Logs
```javascript
// Get all recent logs
const recentLogs = llmLogger.getRecentLogs('all', 50);

// Get only request logs
const requestLogs = llmLogger.getRecentLogs('requests', 20);

// Get only error logs
const errorLogs = llmLogger.getRecentLogs('errors', 10);
```

## Console Output

The logger provides immediate console output with emojis for easy identification:

- 🤖 `[LLM REQUEST]` - New request being sent
- ✅ `[LLM RESPONSE]` - Successful response received
- ❌ `[LLM ERROR]` - Error occurred

## Testing

Run the test script to verify logging functionality:

```bash
cd backend
node test-llm-logging.js
```

This will:
1. Test basic logging functions
2. Verify log file creation
3. Test the gptService integration
4. Display recent logs

## Monitoring and Debugging

### Real-time Monitoring
- Watch console output during processing
- Monitor log files for patterns
- Track processing times and performance

### Debugging Issues
- Check error logs for failed requests
- Compare request/response pairs
- Analyze retry patterns and fallback behavior
- Monitor token usage for cost optimization

### Performance Analysis
- Review processing times per batch
- Identify slow operations
- Optimize batch sizes based on timing data
- Track token usage for cost management

## Security Considerations

- Sensitive data is sanitized before logging
- Long content is truncated to prevent log bloat
- API keys are not logged
- Personal information is handled according to privacy requirements

## Maintenance

### Log Rotation
Consider implementing log rotation for production:
- Archive old logs
- Compress historical data
- Set up automated cleanup

### Monitoring Alerts
Set up alerts for:
- High error rates
- Unusual processing times
- Token usage spikes
- API rate limit issues

## Integration Points

The logging system is integrated into:

1. **gptService.js** - Individual card parsing
2. **ocrController.js** - Batch card processing
3. **Future services** - Any new LLM integrations

## Benefits

- **Debugging**: Easy identification of issues and failures
- **Performance**: Track and optimize processing times
- **Cost Management**: Monitor token usage and API costs
- **Quality Assurance**: Verify data accuracy and completeness
- **Monitoring**: Real-time visibility into system health
- **Analytics**: Historical data for system improvements

