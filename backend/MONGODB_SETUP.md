# MongoDB Setup Guide

## Prerequisites
- MongoDB Atlas account (or local MongoDB installation)
- Python environment with required packages installed

## Step 1: Get Your MongoDB Connection String

### Option A: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (if you haven't already)
3. Click "Connect" on your cluster
4. Choose "Connect your application"
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB
```
mongodb://localhost:27017
```

## Step 2: Configure the Backend

1. Open the `.env` file in `services/brainstorm_platform/`

2. Replace the placeholder with your actual connection string:
   ```env
   MONGODB_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB_NAME=brainstorm_platform
   ```

3. **Important**: Replace:
   - `<username>` with your MongoDB username
   - `<password>` with your MongoDB password
   - `cluster.mongodb.net` with your actual cluster URL

## Step 3: Test the Connection

Start the server:
```bash
cd d:\SLIIT\AgileSense-AI\services\brainstorm_platform
python -m uvicorn api.main:app --host 0.0.0.0 --port 8004
```

Look for this log message:
```
MongoDB connection successful! Database: brainstorm_platform
```

## Step 4: Test Storage Endpoints

Run the test script:
```bash
python test_api.py
```

Or manually test with curl:

### Create a Session
```bash
curl -X POST http://127.0.0.1:8004/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "session_name": "Sprint Planning Q1 2026",
    "description": "Planning session for Q1",
    "participant_ids": ["user_1", "user_2"]
  }'
```

### Create an Idea
```bash
curl -X POST http://127.0.0.1:8004/api/v1/ideas \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "YOUR_SESSION_ID_HERE",
    "participant_id": "user_1",
    "original_text": "We should add a dashboard feature.",
    "rephrased_text": "Add a dashboard feature.",
    "entities": [{"text": "dashboard", "label": "FEATURE"}],
    "is_approved": true,
    "tags": ["UI"]
  }'
```

### Get All Ideas for a Session
```bash
curl http://127.0.0.1:8004/api/v1/ideas?session_id=YOUR_SESSION_ID
```

### Get Session Statistics
```bash
curl http://127.0.0.1:8004/api/v1/sessions/YOUR_SESSION_ID/statistics
```

## Database Collections

The backend automatically creates these collections:

1. **ideas** - Stores brainstorm ideas with AI enhancements
2. **sessions** - Stores brainstorming session metadata
3. **clusters** - (Future) For idea clustering

## Available Storage Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/sessions` | POST | Create new session |
| `/api/v1/sessions` | GET | List all sessions |
| `/api/v1/sessions/{id}` | GET | Get specific session |
| `/api/v1/sessions/{id}/statistics` | GET | Get session stats |
| `/api/v1/ideas` | POST | Create new idea |
| `/api/v1/ideas` | GET | List ideas (with filters) |
| `/api/v1/ideas/{id}` | GET | Get specific idea |
| `/api/v1/ideas/{id}` | PUT | Update idea |
| `/api/v1/ideas/{id}` | DELETE | Delete idea |

## Troubleshooting

### Connection Refused
- Check if MongoDB Atlas allows connections from your IP
- In Atlas: Network Access → Add IP Address → Allow Access from Anywhere (for testing)

### Authentication Failed
- Verify username and password are correct
- URL encode special characters in password
- Example: `p@ssword` becomes `p%40ssword`

### Database Name
- The database will be created automatically on first use
- Default name: `brainstorm_platform`
- Can be changed in `.env` file

## Security Notes

⚠️ **Never commit `.env` file to version control!**
- `.env` is already in `.gitignore`
- Use `.env.example` as a template
- Share connection strings securely

## Next Steps

After MongoDB is working:
1. ✅ Storage endpoints are ready
2. ⏭️ Implement clustering algorithms (future)
3. ⏭️ Add analytics dashboards (future)
4. ⏭️ Connect frontend to storage APIs
