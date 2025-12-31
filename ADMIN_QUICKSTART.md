# 🚀 Quick Start Guide - Admin System

## Login Credentials

### Admin Account
```
Email: admin@auction.com
Password: admin123
```
→ Redirects to `/admin` - Full platform control

### Auctioneer Account
```
Email: auctioneer@auction.com
Password: auctioneer123
```
→ Redirects to `/auction` - Auction management only

## Admin Features

### 1. Dashboard (`/admin`)
- **View Statistics**: Total, active, inactive, expired auctioneers
- **Quick Actions**: Fast access to common tasks
- **Recent Activity**: Last 5 registered auctioneers

### 2. Manage Auctioneers (`/admin/auctioneers`)

#### Search & Filter
- Search by name or email
- Filter by status: All, Active, Inactive, Expired

#### Actions Available
1. **Edit Limits** (Blue pencil icon)
   - Set max players (empty = unlimited)
   - Set max teams (empty = unlimited)
   - Set max auctions (empty = unlimited)

2. **Grant Access** (Green clock icon)
   - Temporary access (specify days)
   - Unlimited access (check the box)

3. **Toggle Access** (Orange/Green circle icon)
   - Activate inactive account
   - Deactivate active account

4. **Delete** (Red trash icon)
   - Permanently delete auctioneer
   - Cascades to all their players & teams

## How Limits Work

### Setting Limits
1. Go to Auctioneers page
2. Click edit icon on an auctioneer
3. Enter numbers or leave empty
   - Empty = Unlimited
   - Number = Hard limit

### What Happens When Limit Reached?
- Auctioneer sees error: "Player limit reached. Maximum X players allowed."
- Cannot create more until admin increases limit
- Usage is tracked automatically

### Example Scenarios
```
Scenario 1: Free Tier
- maxPlayers: 10
- maxTeams: 4
- maxAuctions: 1

Scenario 2: Pro Tier
- maxPlayers: 50
- maxTeams: 10
- maxAuctions: 5

Scenario 3: Unlimited
- maxPlayers: null
- maxTeams: null
- maxAuctions: null
```

## Access Expiry

### Grant Time-Limited Access
1. Click clock icon on auctioneer
2. Enter number of days (e.g., 30)
3. Access expires automatically after that date

### Grant Unlimited Access
1. Click clock icon
2. Check "Unlimited Access"
3. Never expires

### What Happens When Expired?
- Auctioneer cannot login
- Shows "Access expired" message
- Admin sees "Expired" badge
- Data is NOT deleted (preserved)
- Can be reactivated anytime

## Status Types

| Status | Badge Color | Meaning |
|--------|------------|---------|
| Active | Green | Can login, within expiry |
| Inactive | Gray | Access revoked by admin |
| Expired | Orange | Access expired (date passed) |

## Color Coding

### Admin Theme
- Primary: Red (#DC2626)
- Background: Dark slate
- Sidebar: Collapsible with red accents

### Auctioneer Theme  
- Primary: Amber (#F59E0B)
- Background: Dark slate
- Top navbar

## Navigation

### Admin Routes (Admin Only)
```
/admin              - Dashboard
/admin/auctioneers  - Manage Auctioneers
/admin/analytics    - Analytics (Coming Soon)
/admin/logs         - System Logs (Coming Soon)
/admin/settings     - Settings (Coming Soon)
```

### Auctioneer Routes (Auctioneers Only)
```
/auction            - Main auction page
/teams              - Teams management
/players            - Players management
/unsold             - Unsold players
/results            - Auction results
/form-builder       - Custom forms
```

### Security
- Admin CANNOT access auctioneer routes
- Auctioneer CANNOT access admin routes
- Automatic redirect on wrong route access

## Common Tasks

### Task 1: Add New Auctioneer
1. User registers at `/register`
2. Automatically becomes auctioneer
3. Admin sees them in dashboard
4. Admin sets limits if needed

### Task 2: Set Up Trial Period
1. Go to Auctioneers page
2. Find the user
3. Click clock icon
4. Set 7 days
5. Click "Grant Access"

### Task 3: Upgrade User
1. Click edit icon
2. Increase limits:
   - Players: 10 → 50
   - Teams: 4 → 10
3. Save changes

### Task 4: Deactivate User
1. Click toggle icon (circle)
2. Status changes to "Inactive"
3. User cannot login

### Task 5: Reactivate User
1. Click toggle icon again
2. Or click clock icon to grant new access
3. Status changes to "Active"

### Task 6: Delete Spam Account
1. Click trash icon
2. Confirm deletion
3. All data permanently removed

## Monitoring Usage

### View in Table
- Usage column shows: Players / Teams
- Example: "5 / 2" means 5 players, 2 teams

### Check Against Limits
- Limits column shows maximums
- ∞ symbol means unlimited
- Example: "10 / 4" means max 10 players, 4 teams

### Identify Power Users
1. Sort by usage (if needed)
2. Look for high numbers
3. Consider upgrading their limits

## Best Practices

### For Access Management
✅ Use time limits for trials (7, 14, 30 days)
✅ Use unlimited for paid customers
✅ Revoke instead of delete (preserves data)
✅ Monitor expiring accounts regularly

### For Limits
✅ Start with low limits for new users
✅ Increase based on usage
✅ Use null for unlimited (trusted users)
✅ Track usage to identify needs

### For Security
✅ Keep admin credentials secure
✅ Don't share admin access
✅ Review auctioneer list regularly
✅ Delete only obvious spam accounts

## Troubleshooting

### "Cannot find admin routes"
- Check server.js has `app.use('/api/admin', adminRoutes)`
- Restart backend server

### "Access Denied" on admin page
- Verify user role is 'admin'
- Check JWT token is valid
- Try logging out and back in

### Auctioneer can't create players
- Check their limits in admin panel
- Verify they haven't hit maxPlayers
- Check access hasn't expired

### Stats not showing
- Ensure MongoDB is running
- Check backend connection
- Refresh the page

## Development

### Run Backend
```bash
cd backend
npm install
npm run dev
```

### Run Frontend
```bash
cd frontend
npm install
npm start
```

### Both Together
Backend: http://localhost:5000
Frontend: http://localhost:3000

## Support

Need help? Check these files:
- [ADMIN_SYSTEM_COMPLETE.md](ADMIN_SYSTEM_COMPLETE.md) - Full documentation
- [backend/controllers/admin.controller.js](backend/controllers/admin.controller.js) - Backend logic
- [frontend/src/pages/AuctioneersPage.tsx](frontend/src/pages/AuctioneersPage.tsx) - Frontend UI

---

**Happy Administrating! 🎉**
