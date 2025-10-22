# Profile Enhancements - Implementation TODO

The database is now set up! Here's what we need to implement in the app:

## Phase 1: Edit Profile (Settings Page)

### Task 1: Update Settings Page to Edit Profile Fields
- [ ] Add form fields for:
  - Bio (text input, max 500 chars)
  - Location (text input, max 100 chars)  
  - Instagram Handle (text input, max 30 chars, without @)
- [ ] Add character count indicators
- [ ] Add save button with validation
- [ ] Update the Supabase call to save these fields

**File to modify:** `app/settings.tsx`

### Task 2: Real-time Profile Updates
- [ ] When user saves in settings, profile page should reflect changes
- [ ] Use Supabase realtime or refetch profile data

---

## Phase 2: Follow/Unfollow Functionality

### Task 3: Add Follow Button to Other Users' Profiles
- [ ] Create a "View User Profile" screen (new file)
- [ ] Add Follow/Unfollow button
- [ ] Implement follow/unfollow logic using Supabase
- [ ] Update follower/following counts in real-time

**New file needed:** `app/user-profile.tsx`

### Task 4: Followers/Following Lists
- [ ] Create "Followers List" screen
- [ ] Create "Following List" screen  
- [ ] Make counts on profile tappable to view lists
- [ ] Use the `get_followers()` and `get_following()` functions

**New files needed:**
- `app/followers-list.tsx`
- `app/following-list.tsx`

---

## Phase 3: Instagram Link Functionality

### Task 5: Make Instagram Handle Clickable
- [ ] When tapped, open Instagram app or web browser
- [ ] Format: `https://instagram.com/{handle}`
- [ ] Use `Linking.openURL()` from React Native

**File to modify:** `app/(tabs)/profile.tsx`

---

## Phase 4: Polish & Testing

### Task 6: Empty States & Loading States
- [ ] Show loading spinners while fetching profile data
- [ ] Better empty state messages
- [ ] Error handling for failed updates

### Task 7: Validation
- [ ] Frontend validation for character limits
- [ ] Instagram handle validation (alphanumeric + underscores)
- [ ] Location validation (reasonable length)

---

## Supabase Helper Functions Reference

### Update Profile
```typescript
const { error } = await supabase
  .from('profiles')
  .update({
    bio: 'My new bio',
    location: 'San Francisco',
    instagram_handle: 'myhandle'
  })
  .eq('user_id', userId);
```

### Follow User
```typescript
const { error } = await supabase
  .from('followers')
  .insert({
    follower_id: currentUserId,
    following_id: targetUserId
  });
```

### Unfollow User
```typescript
const { error } = await supabase
  .from('followers')
  .delete()
  .eq('follower_id', currentUserId)
  .eq('following_id', targetUserId);
```

### Check if Following
```typescript
const { data } = await supabase
  .rpc('is_following', {
    p_follower_id: currentUserId,
    p_following_id: targetUserId
  });
```

### Get Followers List
```typescript
const { data } = await supabase
  .rpc('get_followers', {
    p_user_id: userId,
    p_limit: 50,
    p_offset: 0
  });
```

### Get Following List
```typescript
const { data } = await supabase
  .rpc('get_following', {
    p_user_id: userId,
    p_limit: 50,
    p_offset: 0
  });
```

---

## Priority Order (Based on Your Preference)

Given your note about doing things one at a time:

1. **FIRST:** Add bio, location, and Instagram fields to settings page (Task 1)
2. **SECOND:** Make Instagram link clickable (Task 5)
3. **THIRD:** Add follow/unfollow button (Tasks 3-4)
4. **FOURTH:** Polish and validation (Tasks 6-7)

---

## Questions to Consider

1. Do you want users to view other people's profiles? (If yes, we need the user-profile page)
2. Should the Instagram handle open the Instagram app or just copy to clipboard?
3. Do you want to show a "verified" checkmark or badge for certain users?
4. Should there be a character counter for the bio field?

Let me know which task you'd like to start with!

