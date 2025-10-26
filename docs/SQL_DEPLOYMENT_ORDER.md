# 🗄️ SQL Deployment Order & Instructions

## ⚠️ **IMPORTANT: Run in This Exact Order**

### **Step 1: Run `auto_create_profile_trigger.sql` FIRST**
This creates the basic profile creation trigger and RLS policies.

### **Step 2: Run `add_onboarding_column.sql` SECOND**
This adds the onboarding column and updates the trigger function.

---

## 🚀 **Deployment Instructions**

### **1. Open Supabase Dashboard**
- Go to your Supabase project
- Navigate to **SQL Editor**

### **2. Run First Script**
```sql
-- Copy and paste contents of: sql/auto_create_profile_trigger.sql
-- Click "Run" button
```

**What this does:**
- ✅ Creates `handle_new_user()` function
- ✅ Sets up automatic profile creation trigger
- ✅ Establishes RLS policies for security
- ✅ Grants necessary permissions

### **3. Run Second Script**
```sql
-- Copy and paste contents of: sql/add_onboarding_column.sql  
-- Click "Run" button
```

**What this does:**
- ✅ Adds `onboarding_completed` column to profiles table
- ✅ Updates the trigger function to include onboarding tracking
- ✅ Creates performance index
- ✅ Sets default `false` for all users (existing and new)

---

## 🎯 **Expected Results**

### **After Running Both Scripts:**

1. **Existing Users:**
   - Will have `onboarding_completed = false`
   - Will be prompted to complete onboarding on next login
   - Can complete their profiles properly

2. **New Users:**
   - Profile automatically created on signup
   - Will have `onboarding_completed = false`
   - Will go through onboarding flow immediately

3. **Database Structure:**
   ```sql
   profiles table:
   - user_id (uuid)
   - username (text) 
   - displayname (text)
   - bio (text, nullable)
   - avatar_url (text, nullable)
   - onboarding_completed (boolean, default false)
   - created_at (timestamptz)
   ```

---

## 🧪 **Verification Steps**

### **After Running Scripts:**

1. **Check the trigger exists:**
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'on_auth_user_created';
   ```

2. **Check the column was added:**
   ```sql
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'profiles' 
   AND column_name = 'onboarding_completed';
   ```

3. **Check existing profiles:**
   ```sql
   SELECT user_id, username, onboarding_completed 
   FROM profiles 
   LIMIT 5;
   ```

---

## ⚠️ **Important Notes**

### **Why This Order Matters:**
- The first script creates the basic trigger
- The second script **replaces** the trigger with the updated version
- Running in wrong order could cause conflicts

### **What Happens to Existing Users:**
- All existing profiles get `onboarding_completed = false`
- They'll see the onboarding screen on next login
- Their existing data will be pre-populated
- They can quickly complete their profiles

### **Safety Features:**
- Uses `IF NOT EXISTS` to prevent duplicate policies
- `CREATE OR REPLACE` safely updates the function
- RLS policies protect user data
- Proper permissions granted

---

## 🚨 **Troubleshooting**

### **If You Get Errors:**

1. **"Function already exists"**
   - This is normal, the `CREATE OR REPLACE` handles it

2. **"Column already exists"**
   - The `IF NOT EXISTS` prevents this error

3. **"Permission denied"**
   - Make sure you're running as the database owner
   - Check that you're in the correct Supabase project

4. **"Trigger already exists"**
   - The `DROP TRIGGER IF EXISTS` handles this

---

## ✅ **Success Indicators**

You'll know it worked when:
- ✅ No error messages in SQL Editor
- ✅ Existing users see onboarding on next login
- ✅ New signups automatically get profiles
- ✅ Onboarding completion tracking works
- ✅ All users become searchable after onboarding

---

## 🎯 **Ready to Deploy?**

**Run these commands in Supabase SQL Editor:**

1. **First:** `sql/auto_create_profile_trigger.sql`
2. **Second:** `sql/add_onboarding_column.sql`

Then test with both existing and new user accounts!
