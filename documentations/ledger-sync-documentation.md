# Ledger Sync Data Feature

## Overview
The Ledger Sync Data feature provides a beautiful, real-time interface for synchronizing all sales invoices, purchase invoices, and expenses with the ledger system. It ensures that all financial transactions are properly tracked and balanced.

## Features

### 🎨 Beautiful UI
- **Gradient Background**: Modern glassmorphism design with gradient backgrounds
- **Real-time Progress**: Live progress bar with percentage completion
- **Timeline View**: Step-by-step visual timeline of the sync process
- **Statistics Cards**: Real-time statistics showing sync progress
- **Smooth Animations**: Fade and zoom animations for better UX

### 🔄 Real-time Updates
- **WebSocket Integration**: Real-time progress updates via Socket.IO
- **Live Statistics**: Shows counts of synced, skipped, and error transactions
- **Step-by-step Feedback**: Clear indication of which step is currently running
- **Error Handling**: Graceful error display with detailed messages

### 📊 Comprehensive Sync Process
1. **Checking Existing Transactions**: Verifies current ledger state
2. **Syncing Sales Invoices**: Processes all sales invoices and payments
3. **Syncing Purchase Invoices**: Processes all purchase entries and payments
4. **Syncing Expenses**: Processes all expense records
5. **Completion**: Final verification and statistics

## How to Use

### Frontend Integration
1. **Import the Component**:
   ```jsx
   import LedgerSyncModal from '@/components/dialogs/LedgerSyncModal'
   ```

2. **Add State Management**:
   ```jsx
   const [syncModalOpen, setSyncModalOpen] = useState(false)
   ```

3. **Add Sync Button**:
   ```jsx
   <Button
     variant='outlined'
     startIcon={<i className='tabler-refresh' />}
     onClick={() => setSyncModalOpen(true)}
   >
     Sync Data
   </Button>
   ```

4. **Include the Modal**:
   ```jsx
   <LedgerSyncModal
     open={syncModalOpen}
     onClose={() => setSyncModalOpen(false)}
     onSyncComplete={handleSyncComplete}
   />
   ```

### Backend API
The sync process is handled by the `/api/ledger/sync-data` endpoint:

```javascript
POST /api/ledger/sync-data
Authorization: Bearer <token>
```

**Response**:
```json
{
  "success": true,
  "message": "Data sync started. You will receive real-time updates.",
  "syncId": "sync_vendorId_timestamp"
}
```

### WebSocket Events
The system uses Socket.IO for real-time communication:

**Client Events**:
- `join_vendor_room`: Join vendor-specific room for updates

**Server Events**:
- `sync_progress`: Real-time progress updates
- `sync_complete`: Sync completion notification
- `sync_error`: Error notification

## Technical Implementation

### Backend Components

#### 1. Enhanced LedgerService
- **Progress Tracking**: Real-time progress callbacks
- **Error Handling**: Comprehensive error tracking
- **Statistics**: Detailed sync statistics
- **Batch Processing**: Efficient processing of large datasets

#### 2. WebSocket Integration
- **Socket.IO Server**: Real-time communication
- **Vendor Rooms**: Isolated communication per vendor
- **Progress Broadcasting**: Live progress updates

#### 3. Controller Updates
- **Async Processing**: Non-blocking sync operations
- **WebSocket Integration**: Real-time progress updates
- **Error Handling**: Graceful error management

### Frontend Components

#### 1. LedgerSyncModal Component
- **Modern Design**: Glassmorphism and gradient backgrounds
- **Real-time Updates**: WebSocket integration
- **Progress Visualization**: Multiple progress indicators
- **Statistics Display**: Real-time sync statistics

#### 2. Integration Points
- **Authentication**: Uses NextAuth session for vendor ID
- **State Management**: React state for modal and progress
- **Error Handling**: Toast notifications and error display

## Configuration

### Environment Variables
```env
# Server
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# WebSocket
SOCKET_IO_URL=http://localhost:4000
```

### Dependencies
**Backend**:
- `socket.io`: WebSocket server
- `mongoose`: Database operations
- `express`: HTTP server

**Frontend**:
- `socket.io-client`: WebSocket client
- `@mui/material`: UI components
- `next-auth`: Authentication
- `@tanstack/react-query`: Data fetching

## Error Handling

### Common Errors
1. **Authentication Errors**: Invalid or expired tokens
2. **Database Errors**: Connection or query failures
3. **WebSocket Errors**: Connection or communication failures
4. **Validation Errors**: Invalid data or missing fields

### Error Recovery
- **Automatic Retry**: Built-in retry mechanisms
- **Graceful Degradation**: Fallback to polling if WebSocket fails
- **User Feedback**: Clear error messages and recovery suggestions

## Performance Considerations

### Optimization Strategies
1. **Batch Processing**: Process transactions in batches
2. **Progress Throttling**: Limit progress update frequency
3. **Memory Management**: Efficient data handling
4. **Connection Pooling**: Optimized database connections

### Monitoring
- **Progress Tracking**: Real-time progress monitoring
- **Error Logging**: Comprehensive error logging
- **Performance Metrics**: Sync time and throughput tracking

## Future Enhancements

### Planned Features
1. **Resume Capability**: Resume interrupted syncs
2. **Selective Sync**: Sync specific date ranges or transaction types
3. **Background Sync**: Automatic periodic synchronization
4. **Advanced Analytics**: Detailed sync analytics and reporting

### Scalability Improvements
1. **Queue System**: Redis-based job queue for large datasets
2. **Distributed Processing**: Multi-server sync processing
3. **Caching**: Redis caching for improved performance
4. **Load Balancing**: Multiple server instances

## Troubleshooting

### Common Issues
1. **WebSocket Connection Failed**: Check server status and network
2. **Sync Stuck**: Check database connections and server logs
3. **Authentication Errors**: Verify token validity and permissions
4. **UI Not Updating**: Check WebSocket connection and event handling

### Debug Steps
1. **Check Server Logs**: Review backend console output
2. **Verify WebSocket Connection**: Check browser network tab
3. **Test API Endpoints**: Use Postman or curl to test endpoints
4. **Check Database**: Verify data integrity and connections

## Support

For issues or questions regarding the Ledger Sync Data feature:
1. Check the troubleshooting section above
2. Review server and browser console logs
3. Verify all dependencies are properly installed
4. Ensure proper environment configuration
