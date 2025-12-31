# Quick Testing Guide - Auctioneer Isolation

## 🧪 How to Verify Complete Isolation

### Setup (5 minutes)
1. **Create Two Auctioneers:**
   - Register `auctioneer1@test.com` (password: test123)
   - Register `auctioneer2@test.com` (password: test123)

2. **Open Two Browser Windows:**
   - Window A: Login as auctioneer1@test.com
   - Window B: Login as auctioneer2@test.com

---

## ✅ Test 1: Team Isolation

### In Window A (Auctioneer 1):
1. Go to Teams page
2. Create team "Mumbai Indians" with 11 slots
3. Create team "Chennai Super Kings" with 11 slots

### In Window B (Auctioneer 2):
1. Go to Teams page
2. **Expected:** Empty teams list (should NOT see Mumbai Indians or Chennai)
3. Create team "Mumbai Indians" with 10 slots ✓ (Same name should work!)
4. **Expected:** Success (different auctioneer, different namespace)

### ✅ Pass Criteria:
- Window A shows 2 teams
- Window B shows 1 team
- No overlap between the two

---

## ✅ Test 2: Player Isolation

### In Window A (Auctioneer 1):
1. Generate registration link
2. Register 3 players:
   - Virat Kohli (100)
   - Rohit Sharma (101)
   - MS Dhoni (102)
3. Go to Players page
4. **Expected:** See all 3 players

### In Window B (Auctioneer 2):
1. Go to Players page
2. **Expected:** Empty list (should NOT see Auctioneer 1's players)
3. Generate registration link
4. Register player: Virat Kohli (100) ✓ (Same reg no should work!)
5. **Expected:** Success (different auctioneer namespace)

### ✅ Pass Criteria:
- Window A: 3 players
- Window B: 1 player
- No visibility across auctioneers

---

## ✅ Test 3: Real-Time Updates Isolation

### Setup:
- Keep both windows open side-by-side
- Window A: Auctioneer 1 on Auction page
- Window B: Auctioneer 2 on Auction page

### In Window A:
1. Start auction (spin wheel)
2. Assign player to Mumbai Indians
3. **Expected:** Window A updates in real-time ✓

### In Window B:
1. **Expected:** NO updates (window stays static)
2. Window B's data should remain unchanged

### ✅ Pass Criteria:
- Window A shows live updates
- Window B shows NO updates from Auctioneer 1
- Socket events are isolated

---

## ✅ Test 4: API Security

### Using Postman or Browser DevTools:

#### Test 4.1: Cross-Access Player
1. Login as Auctioneer 1, copy JWT token
2. Get player ID of Auctioneer 2's player
3. Try to update Auctioneer 2's player with Auctioneer 1's token:
   ```
   PATCH /api/players/{auctioneer2_player_id}
   Authorization: Bearer {auctioneer1_token}
   Body: { "status": "sold" }
   ```
4. **Expected:** 404 "Player not found or access denied"

#### Test 4.2: Cross-Access Team
1. Login as Auctioneer 1
2. Try to get Auctioneer 2's team:
   ```
   GET /api/teams/{auctioneer2_team_id}
   Authorization: Bearer {auctioneer1_token}
   ```
3. **Expected:** 404 "Team not found or access denied"

### ✅ Pass Criteria:
- All cross-auctioneer requests return 404
- No data leakage via API

---

## ✅ Test 5: Delete Isolation

### In Window A (Auctioneer 1):
1. Create 5 teams, register 10 players
2. Go to Auction page, assign 5 players to teams
3. Click "Reset Auction" (delete all)
4. **Expected:** All of Auctioneer 1's data deleted

### In Window B (Auctioneer 2):
1. **Expected:** NO change (data intact)
2. Verify all teams and players still exist
3. Auction should continue normally

### ✅ Pass Criteria:
- Window A: Data cleared
- Window B: Data unchanged
- Delete operation is isolated

---

## ✅ Test 6: Socket Room Verification

### Check Backend Console:
After both auctioneers connect, server console should show:
```
Socket ${id} joined room: auctioneer_${userId1}
Socket ${id} joined room: auctioneer_${userId2}
```

### Open Browser Console (F12):
Should see:
```
✓ Socket connected for auction page
✓ Joined auctioneer room: ${userId}
```

### ✅ Pass Criteria:
- Each auctioneer in separate room
- Room names: `auctioneer_<userId>`
- Events scoped to rooms

---

## ✅ Test 7: Concurrent Auctions

### Window A & B Simultaneously:
1. Both start auction at the same time
2. Both assign players to teams
3. Both mark players as unsold
4. **Expected:** No interference between auctions

### Monitor Real-Time Updates:
- Window A updates should NOT appear in Window B
- Window B updates should NOT appear in Window A
- Each auction runs independently

### ✅ Pass Criteria:
- Both auctions run smoothly
- No cross-contamination
- No errors in console

---

## 🚨 Red Flags (Should NEVER Happen)

### ❌ FAIL Indicators:
1. **Data Leakage:**
   - Seeing another auctioneer's teams/players
   - Real-time updates from another auction

2. **API Security Breach:**
   - Successfully accessing another auctioneer's data
   - 200 response when accessing cross-auctioneer resources

3. **Socket Event Leakage:**
   - Receiving socket events from another auctioneer
   - Updates appearing in wrong browser window

4. **Delete Cross-Impact:**
   - Deleting data affects another auctioneer
   - Reset auction clears wrong data

---

## 📊 Quick Verification Checklist

```
[ ] Create 2 auctioneers
[ ] Login in 2 separate browsers
[ ] Test 1: Team isolation ✓
[ ] Test 2: Player isolation ✓
[ ] Test 3: Real-time isolation ✓
[ ] Test 4: API security ✓
[ ] Test 5: Delete isolation ✓
[ ] Test 6: Socket rooms ✓
[ ] Test 7: Concurrent auctions ✓
[ ] No red flags observed ✓
```

---

## 🎯 Expected Results Summary

| Feature | Auctioneer 1 | Auctioneer 2 | Isolation |
|---------|--------------|--------------|-----------|
| Teams | Own teams only | Own teams only | ✅ |
| Players | Own players only | Own players only | ✅ |
| Real-time | Own updates only | Own updates only | ✅ |
| API Access | Own data only | Own data only | ✅ |
| Socket Room | auctioneer_id1 | auctioneer_id2 | ✅ |
| Delete | Own data only | Own data only | ✅ |

---

## 🔍 Debug Commands

### Check MongoDB Data:
```javascript
// Check player isolation
db.players.aggregate([
  { $group: { _id: "$auctioneer", count: { $sum: 1 } } }
])

// Check team isolation
db.teams.aggregate([
  { $group: { _id: "$auctioneer", count: { $sum: 1 } } }
])
```

### Check Socket Rooms (Backend):
```javascript
// In server.js, add this to a route:
io.of("/").adapter.rooms.forEach((value, key) => {
  console.log(`Room: ${key}, Clients: ${value.size}`);
});
```

---

## ✅ Success Criteria

**ALL of the following must be true:**

1. ✅ Each auctioneer sees ONLY their own data
2. ✅ No cross-auctioneer API access possible
3. ✅ Real-time events isolated to socket rooms
4. ✅ Delete operations affect only owner's data
5. ✅ Same team/player names work across auctioneers
6. ✅ Concurrent auctions run without interference
7. ✅ No errors in browser or server console
8. ✅ Socket rooms properly isolated

**If all tests pass → COMPLETE ISOLATION ACHIEVED! 🎉**
