# Admin Reset Data Feature Documentation

## Overview
Added comprehensive data reset functionality for admins to completely wipe all auctioneer data while keeping the account active. This gives admins the ability to provide a fresh start for auctioneers without deleting their accounts.

## Feature Details

### What Gets Deleted
1. **Database Records:**
   - All players for the auctioneer
   - All teams for the auctioneer
   - All form configurations
   - Registration tokens (forces new link generation)

2. **Cloudinary Storage:**
   - All player photos
   - All team logos
   - Proper cleanup using public_id extraction

3. **What Remains:**
   - Auctioneer account (active)
   - Account credentials (email/password)
   - Access expiry settings
   - Usage limits (maxPlayers, maxTeams)

## Backend Implementation

### New Endpoint
```
DELETE /api/admin/auctioneers/:id/reset
```

**Access:** Admin only  
**Authentication:** JWT token required

### Process Flow
1. Verify auctioneer exists
2. Fetch all players and teams
3. Delete player photos from Cloudinary (parallel)
4. Delete team logos from Cloudinary (parallel)
5. Delete database records (players, teams, form configs)
6. Reset registration tokens
7. Emit socket event for real-time notification
8. Return deletion statistics

### Response Format
```json
{
  "success": true,
  "data": {
    "auctioneerName": "John Doe",
    "deletedPlayers": 25,
    "deletedTeams": 8,
    "deletedFormConfigs": 3,
    "deletedPlayerPhotos": 23,
    "deletedTeamLogos": 7
  },
  "message": "All data for John Doe has been completely reset"
}
```

### Cloudinary Cleanup
The system properly extracts `public_id` from Cloudinary URLs:
- Player photos: `auction-players/player_P0001_123456789`
- Team logos: `auction-teams/team_T001_123456789`

Ensures no orphaned files remain in storage.

### Error Handling
- Validates auctioneer exists and has correct role
- Catches and logs individual photo deletion failures
- Continues operation even if some photos fail to delete
- Returns detailed error messages

### Logging
```
🗑️ Starting complete data reset for auctioneer: John Doe (john@example.com)
📋 Found 25 players to delete
📋 Found 8 teams to delete
✅ Deleted 23 player photos from Cloudinary
✅ Deleted 7 team logos from Cloudinary
✅ Database cleanup complete:
   - Players deleted: 25
   - Teams deleted: 8
   - Form configs deleted: 3
```

## Frontend Implementation

### Location
Admin Dashboard → Auctioneers Page → Click Auctioneer → Activity & Access Tab → Danger Zone

### UI Components

#### Reset Data Button
- **Color:** Amber (warning level)
- **Icon:** Refresh/reset icon
- **Position:** Top section of Danger Zone
- **Shows:** Player count, team count before deletion

#### Confirmation Dialog
Requires typing "DELETE" to confirm:
```
⚠️ CRITICAL WARNING ⚠️

This will PERMANENTLY DELETE ALL data for John Doe:

✗ 25 Players (with photos)
✗ 8 Teams (with logos)
✗ All form configurations
✗ All Cloudinary images

The auctioneer account will remain, but ALL their data will be GONE FOREVER.

Type "DELETE" to confirm this action.
```

#### Success Message
```
✅ Data reset complete! Deleted: 25 players, 8 teams, 23 photos, 7 logos
```

### User Experience
1. Admin clicks "Reset All Data" button
2. Prompt appears requiring "DELETE" text
3. If canceled or wrong text: operation aborts
4. If confirmed: Loading state shows
5. Success message displays statistics
6. List auto-refreshes showing 0 players/teams
7. Auctioneer account remains active

### Visual Hierarchy
```
┌─ Danger Zone ────────────────────────┐
│                                       │
│ Reset All Data (Amber)                │
│ └─ Keeps account, removes data        │
│                                       │
│ ───────────────────────────────────   │
│                                       │
│ Delete Account (Red)                  │
│ └─ Removes everything permanently     │
│                                       │
└───────────────────────────────────────┘
```

## Use Cases

### Fresh Start
When an auctioneer wants to start over with a clean slate:
- Remove all previous auction data
- Keep their account credentials
- Maintain their access settings
- Reset player/team registrations

### Testing/Demo Reset
For test accounts or demo environments:
- Quick cleanup after demos
- Preserve account for future use
- Remove test data efficiently

### Data Cleanup
When data becomes corrupted or inconsistent:
- Clean slate without account recreation
- Fix database integrity issues
- Remove problematic records

## Safety Features

### Multi-Level Confirmation
1. Button requires intentional click
2. Prompt requires typing "DELETE"
3. Case-sensitive text match
4. No accidental clicks possible

### Clear Communication
- Shows exact counts before deletion
- Warns about permanent nature
- Differentiates from account deletion
- Displays detailed results after

### Audit Trail
- Console logs all operations
- Tracks deletion statistics
- Records timestamps
- Maintains error logs

## Technical Considerations

### Performance
- Parallel Cloudinary deletions (faster)
- Batch database operations
- Non-blocking for individual failures
- Efficient public_id extraction

### Database Integrity
- Cascading deletes not used (explicit control)
- Removes all player references from teams
- Cleans up form configurations
- Resets registration tokens

### Real-Time Updates
Socket.IO event emitted:
```javascript
io.to(`auctioneer_${auctioneerId}`).emit('dataReset', {
  message: 'All your data has been reset by admin'
});
```

Auctioneer receives immediate notification if online.

### Error Recovery
- Continues on individual photo deletion failures
- Logs warnings for failed operations
- Still completes database cleanup
- Returns accurate statistics

## API Testing

### Using cURL
```bash
curl -X DELETE http://localhost:5001/api/admin/auctioneers/AUCTIONEER_ID/reset \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Expected Response
```json
{
  "success": true,
  "data": {
    "auctioneerName": "Test User",
    "deletedPlayers": 10,
    "deletedTeams": 5,
    "deletedFormConfigs": 2,
    "deletedPlayerPhotos": 8,
    "deletedTeamLogos": 4
  },
  "message": "All data for Test User has been completely reset"
}
```

## Monitoring

### What to Watch
- Cloudinary storage usage (should decrease)
- Database record counts
- Error logs for failed photo deletions
- Socket event delivery

### Success Indicators
- Database queries return 0 for that auctioneer
- Cloudinary folder cleaned up
- No broken image links
- Auctioneer can create new data

## Rollback

If issues occur with this feature:

1. **Disable the endpoint:**
```javascript
// Comment out in admin.routes.js
// router.delete('/auctioneers/:id/reset', adminController.resetAuctioneerData);
```

2. **Hide the UI button:**
```javascript
// Comment out in AuctioneerDetailModal.tsx
// The reset data section
```

3. **Revert commit:**
```bash
git revert 3d32fec
cd frontend && npm run build
git push
```

## Future Enhancements

### Potential Additions
1. **Backup before reset:** Export data to JSON before deletion
2. **Scheduled resets:** Allow setting auto-reset dates
3. **Partial resets:** Reset only players or only teams
4. **Restore from backup:** Undo reset within time window
5. **Reset history:** Track all reset operations
6. **Email notification:** Send email to auctioneer after reset
7. **Soft delete:** Move to archive instead of permanent deletion

### Performance Optimizations
1. Background job queue for large resets
2. Progress bar for deletion process
3. Chunked Cloudinary deletion (avoid rate limits)
4. Database transaction for atomicity

## Security Considerations

### Access Control
- Endpoint protected with `isAdmin` middleware
- JWT authentication required
- Role verification in controller
- No auctioneer self-reset possible

### Data Protection
- Irreversible operation (by design)
- Requires explicit confirmation
- Logged for audit purposes
- Admin accountability

### Rate Limiting
Consider adding for production:
```javascript
const rateLimit = require('express-rate-limit');

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 resets per 15 min
  message: 'Too many reset requests'
});

router.delete('/auctioneers/:id/reset', resetLimiter, adminController.resetAuctioneerData);
```

## Documentation Links

- **Backend Controller:** [backend/controllers/admin.controller.js](../backend/controllers/admin.controller.js)
- **API Route:** [backend/routes/admin.routes.js](../backend/routes/admin.routes.js)
- **Frontend Modal:** [frontend/src/components/AuctioneerDetailModal.tsx](../frontend/src/components/AuctioneerDetailModal.tsx)
- **Performance Optimizations:** [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md)

## Support

If you encounter issues:
1. Check backend console logs for errors
2. Verify Cloudinary credentials are valid
3. Ensure admin JWT token is fresh
4. Test with small dataset first
5. Monitor Cloudinary dashboard for deletions

## Changelog

### Version 1.0.0 (January 2, 2026)
- Initial implementation of reset data feature
- Added backend endpoint with Cloudinary cleanup
- Created frontend UI with confirmation dialog
- Implemented real-time socket notifications
- Added comprehensive error handling and logging
