# 📱 Comprehensive Video Posts & Post Details Testing Guide

## 🎯 **Pre-Testing Setup**

### **Required Test Data:**
- [ ] At least 3 user accounts with different usernames
- [ ] At least 5 approved video posts in the database
- [ ] At least 2 restaurants with associated posts
- [ ] Comments on various posts (test the comment fix)
- [ ] Mix of posts with/without restaurant associations

### **Test Environment:**
- [ ] iOS device/simulator
- [ ] Android device/emulator (if available)
- [ ] Good network connection
- [ ] Poor network connection (for testing)

---

## 🎬 **PART 1: Main Video Feed Testing**

### **1.1 Basic Feed Loading**
- [ ] **Open app** → Should load main feed automatically
- [ ] **Check loading state** → Should show loading indicator initially
- [ ] **Verify posts load** → Should display video posts in vertical scroll
- [ ] **Check empty state** → If no posts, should show appropriate message

### **1.2 Video Playback**
- [ ] **Auto-play** → First video should start playing automatically
- [ ] **Single tap** → Should pause/resume video
- [ ] **Double tap** → Should like the video + show heart animation
- [ ] **Volume control** → Test mute/unmute functionality
- [ ] **Background/foreground** → Pause when app goes to background, resume when active

### **1.3 Video Navigation**
- [ ] **Vertical scroll** → Should snap to next/previous video
- [ ] **Smooth transitions** → No lag between video changes
- [ ] **Active video tracking** → Only one video should play at a time
- [ ] **Infinite scroll** → Should load more videos when reaching end

### **1.4 Video Interactions**
- [ ] **Like button** → Tap heart icon, should toggle like state
- [ ] **Like count** → Should update immediately and persist
- [ ] **Comment button** → Should open comment sheet
- [ ] **Save button** → Should toggle save state
- [ ] **Share button** → Should open share options
- [ ] **Report button (...)** → Should show report/block options

### **1.5 Profile & Restaurant Navigation**
- [ ] **Tap username** → Should navigate to user profile
- [ ] **Tap restaurant button** → Should navigate to restaurant page
- [ ] **Avatar tap** → Should navigate to user profile

### **1.6 Performance Testing**
- [ ] **Memory usage** → Monitor for memory leaks during long scrolling
- [ ] **Battery usage** → Check if excessive battery drain
- [ ] **Network efficiency** → Monitor data usage
- [ ] **Smooth scrolling** → No stuttering or frame drops

---

## 💬 **PART 2: Comments System Testing**

### **2.1 Comment Sheet Opening**
- [ ] **Tap comment button** → Should open comment sheet from bottom
- [ ] **Sheet animation** → Should slide up smoothly
- [ ] **Drag to close** → Should close when dragged down
- [ ] **Tap outside** → Should close when tapping overlay
- [ ] **Close button** → Should close when tapping X

### **2.2 Comment Loading**
- [ ] **Load existing comments** → Should display all visible comments
- [ ] **Show usernames** → Should display correct usernames
- [ ] **Show avatars** → Should display profile pictures
- [ ] **Show timestamps** → Should show relative time (1m, 2h, 3d)
- [ ] **Empty state** → Should show "No comments yet" if empty

### **2.3 Comment Posting**
- [ ] **Type comment** → Should show typing preview
- [ ] **Post comment** → Should submit and appear immediately
- [ ] **Character limit** → Should enforce 500 character limit
- [ ] **Profanity filter** → Should block inappropriate content
- [ ] **Spam detection** → Should block spam patterns

### **2.4 Comment Interactions**
- [ ] **Like comments** → Should toggle like state on comments
- [ ] **Reply to comments** → Should show reply indicator
- [ ] **Report comments** → Should show report options
- [ ] **Block users** → Should show block confirmation

### **2.5 Comment Edge Cases**
- [ ] **Network failure** → Should handle posting failures gracefully
- [ ] **Long comments** → Should wrap text properly
- [ ] **Special characters** → Should handle emojis, symbols
- [ ] **Rapid posting** → Should prevent spam/duplicate posts

---

## 📄 **PART 3: Post Details Testing**

### **3.1 Navigation to Post Details**

#### **From Profile Context:**
- [ ] **Go to Profile tab**
- [ ] **Tap any post thumbnail**
- [ ] **Should open post details** with profile context
- [ ] **Should start at clicked post**
- [ ] **Should allow scrolling** through all user's posts
- [ ] **Back button** → Should return to profile

#### **From Restaurant Context:**
- [ ] **Navigate to restaurant page** (from video or search)
- [ ] **Tap any post thumbnail**
- [ ] **Should open post details** with restaurant context
- [ ] **Should start at clicked post**
- [ ] **Should allow scrolling** through all restaurant posts
- [ ] **Back button** → Should return to restaurant page

#### **From User Profile Context:**
- [ ] **Search for a user** → Navigate to their profile
- [ ] **Tap any post thumbnail**
- [ ] **Should open post details** with profile context
- [ ] **Should start at clicked post**
- [ ] **Should allow scrolling** through that user's posts
- [ ] **Back button** → Should return to user profile

#### **From Main Feed Context:**
- [ ] **Open main feed**
- [ ] **Tap on username** → Go to user profile
- [ ] **Tap post thumbnail** → Should open with default context
- [ ] **Should load additional feed posts** after the clicked post
- [ ] **Should support infinite scroll**

### **3.2 Post Details Functionality**
- [ ] **Full screen mode** → Should hide tab bar
- [ ] **Video playback** → Should work same as main feed
- [ ] **All interactions** → Like, comment, save, share should work
- [ ] **Context awareness** → Should load appropriate related posts
- [ ] **Performance** → Should be smooth with large post lists

### **3.3 Navigation Stack Testing**

#### **Simple Navigation:**
- [ ] **Profile → Post Details → Back** → Should return to profile
- [ ] **Restaurant → Post Details → Back** → Should return to restaurant

#### **Deep Navigation Chain:**
- [ ] **Feed → Post Details → Username → User Profile → Post → Back → Back → Back**
- [ ] **Should maintain proper navigation stack**
- [ ] **Each back should go to previous screen**
- [ ] **Should not cause memory issues**

#### **Complex Navigation:**
- [ ] **Feed → Post → Profile → Post → Restaurant → Post → Back chain**
- [ ] **Test multiple context switches**
- [ ] **Verify each context loads correctly**
- [ ] **Test navigation state preservation**

---

## 🔄 **PART 4: Context Switching Testing**

### **4.1 Profile Context Behavior**
- [ ] **Load user's posts** → Should show only that user's content
- [ ] **Scroll through posts** → Should maintain profile context
- [ ] **Post order** → Should be chronological (newest first)
- [ ] **No infinite loading** → Should load all posts upfront

### **4.2 Restaurant Context Behavior**
- [ ] **Load restaurant posts** → Should show only that restaurant's content
- [ ] **Scroll through posts** → Should maintain restaurant context
- [ ] **Post order** → Should be chronological (newest first)
- [ ] **No infinite loading** → Should load all posts upfront

### **4.3 Default Context Behavior**
- [ ] **Load ranked feed** → Should use engagement algorithm
- [ ] **Infinite scroll** → Should load more posts as needed
- [ ] **Mixed content** → Should show posts from various users/restaurants
- [ ] **Personalization** → Should respect user preferences

---

## 🚨 **PART 5: Error Handling & Edge Cases**

### **5.1 Network Issues**
- [ ] **Poor connection** → Should handle slow loading gracefully
- [ ] **No connection** → Should show appropriate error messages
- [ ] **Connection drops** → Should retry failed requests
- [ ] **Timeout handling** → Should not hang indefinitely

### **5.2 Data Issues**
- [ ] **Missing video URLs** → Should show placeholder or error
- [ ] **Corrupted video files** → Should handle playback errors
- [ ] **Missing user data** → Should show "anonymous" or placeholder
- [ ] **Empty feeds** → Should show appropriate empty states

### **5.3 Permission Issues**
- [ ] **Unauthorized access** → Should redirect to login
- [ ] **Blocked content** → Should filter out blocked users
- [ ] **Private content** → Should respect privacy settings
- [ ] **Moderation** → Should only show approved content

### **5.4 Performance Edge Cases**
- [ ] **Large video files** → Should handle without crashes
- [ ] **Many comments** → Should paginate or limit display
- [ ] **Rapid interactions** → Should prevent duplicate actions
- [ ] **Memory pressure** → Should handle low memory gracefully

---

## 🧪 **PART 6: Cross-Platform Testing**

### **6.1 iOS Specific**
- [ ] **Safe area handling** → Should respect notch/home indicator
- [ ] **Haptic feedback** → Should provide appropriate feedback
- [ ] **Action sheets** → Should use native iOS action sheets
- [ ] **Keyboard behavior** → Should handle keyboard properly

### **6.2 Android Specific**
- [ ] **Back button** → Should handle Android back button
- [ ] **Status bar** → Should handle different status bar styles
- [ ] **Keyboard behavior** → Should handle Android keyboard
- [ ] **Permission dialogs** → Should handle Android permissions

### **6.3 Different Screen Sizes**
- [ ] **Small screens** → Should work on smaller devices
- [ ] **Large screens** → Should utilize space effectively
- [ ] **Landscape mode** → Should handle orientation changes
- [ ] **Tablet layouts** → Should adapt to tablet screens

---

## ✅ **PART 7: Regression Testing**

### **7.1 Core Functionality**
- [ ] **Authentication** → Login/logout should work
- [ ] **Upload** → Video upload should work
- [ ] **Search** → User/restaurant search should work
- [ ] **Profile editing** → Should save changes properly

### **7.2 Integration Points**
- [ ] **Moderation system** → Should respect approval status
- [ ] **Analytics** → Should track impressions/engagement
- [ ] **Storage** → Should handle file operations correctly
- [ ] **Database** → Should maintain data consistency

---

## 📊 **Test Results Template**

### **Test Environment:**
- Device: _______________
- OS Version: ___________
- App Version: __________
- Network: _____________

### **Pass/Fail Checklist:**
- [ ] Main Feed Loading: ✅/❌
- [ ] Video Playback: ✅/❌
- [ ] Comments System: ✅/❌
- [ ] Post Details Navigation: ✅/❌
- [ ] Context Switching: ✅/❌
- [ ] Error Handling: ✅/❌
- [ ] Performance: ✅/❌

### **Issues Found:**
1. ________________________
2. ________________________
3. ________________________

### **Critical Bugs:**
- ________________________
- ________________________

### **Performance Notes:**
- Memory usage: ___________
- Load times: ____________
- Scroll performance: _____

---

## 🎯 **Priority Testing Order**

### **Phase 1 (Critical):**
1. Main feed loading and video playback
2. Basic interactions (like, comment, share)
3. Post details navigation from profile
4. Comment system functionality

### **Phase 2 (Important):**
1. Context switching between different sources
2. Navigation stack handling
3. Error handling and edge cases
4. Performance under load

### **Phase 3 (Polish):**
1. Cross-platform differences
2. Different screen sizes
3. Network condition variations
4. Regression testing

This comprehensive testing guide should help you identify any issues with your video posts and post details functionality before launch!
