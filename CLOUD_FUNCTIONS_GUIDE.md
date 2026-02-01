# Deleting Firebase Auth Users Verification

Currently, when you delete a staff member from the Admin Dashboard, their **User Profile** (Firestore data) is deleted, which immediately **revokes their access** to the application.

However, their **Authentication Record** (email/password login) stays in Firebase. This is a security limitation: a web application cannot delete a user's login account without being logged in as that user (or having their password).

To fix this, you need to set up a **Firebase Cloud Function**. This runs on a secure Google server and has the permission to delete users.

### Step 1: Initialize Cloud Functions (Command Line)
If you haven't set up functions for your project yet:
1. Open your terminal in the project folder.
2. Run: `firebase init functions`
3. Select "JavaScript" or "TypeScript".
4. Choose "Install dependencies with npm" (Yes).

### Step 2: Add the Delete Trigger
Modify `functions/index.js` (or `index.ts`) to include this code:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Trigger: When a document is deleted from the 'users' collection
exports.deleteAuthAccount = functions.firestore
  .document('users/{userID}')
  .onDelete(async (snap, context) => {
    const deletedValue = snap.data();
    const userID = context.params.userID;
    
    try {
      // Delete the user from Firebase Authentication
      await admin.auth().deleteUser(userID);
      console.log(`Successfully deleted auth user: ${userID}`);
    } catch (error) {
      console.error(`Error deleting auth user: ${error}`);
    }
  });
```

### Step 3: Deploy
Run: `firebase deploy --only functions`

Once deployed, whenever you delete a staff member from the dashboard, this function will automatically run in the background and delete their email/login from Firebase Authentication as well.
