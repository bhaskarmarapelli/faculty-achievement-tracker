# Achievement Register — Faculty & Student

A shared submission form (Faculty + Student) with a login-protected admin
dashboard, deployable as a free static site on GitHub Pages, backed by a
free Firebase project for real shared data storage and admin login.

## Project structure

```
faculty-achievement-tracker/
├── index.html            ← entry point
├── css/style.css
├── js/
│   ├── app.js              ← app logic (JSX, transformed in-browser by Babel)
│   ├── firebase-config.js  ← YOU fill this in with your Firebase project keys
│   └── vendor/              ← React, ReactDOM, Babel, Firebase — all bundled locally
├── firestore.rules         ← security rules to paste into Firebase Console
└── README.md
```

No `npm install`, no build step. Everything runs directly as static files —
which is exactly what GitHub Pages needs.

---

## Part 1 — Create your free Firebase project (~10 minutes, one-time)

Firebase is what makes this *shared*: every submission goes into one
database that only you (admin) can read, regardless of which device or
browser a faculty/student used to submit.

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
   and sign in with any Google account.
2. Click **Add project** → give it a name (e.g. `csit-achievements`) →
   you can disable Google Analytics (not needed) → **Create project**.
3. In the left sidebar, click **Build → Firestore Database** →
   **Create database** → choose a region close to you (e.g. `asia-south1`
   for India) → start in **Production mode** → **Enable**.
4. In the left sidebar, click **Build → Authentication** → **Get started**
   → under "Sign-in method", enable **Email/Password** → **Save**.
5. Still in **Authentication**, go to the **Users** tab → **Add user** →
   enter your own admin email and a password. **This is your admin login**
   for the app — nobody can self-register, only you (or whoever you add
   here later, e.g. a co-admin) can sign in.
6. Now register a **web app**: click the gear icon (⚙) next to "Project
   Overview" → **Project settings** → scroll to "Your apps" → click the
   **`</>`** (web) icon → give it any nickname → **Register app**.
   Firebase will show you a `firebaseConfig` object like this:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "csit-achievements.firebaseapp.com",
     projectId: "csit-achievements",
     storageBucket: "csit-achievements.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef",
   };
   ```

   Copy these values into **`js/firebase-config.js`** in this project,
   replacing the placeholder values.

7. Apply the security rules: open **`firestore.rules`** in this project,
   copy its contents, then in Firebase Console go to **Firestore Database
   → Rules** tab, paste over the existing rules, and click **Publish**.
   (This is what makes submissions public-write but admin-only-read.)

That's the entire Firebase setup — you won't need to touch the Firebase
Console again unless you want to add a second admin account later.

---

## Part 2 — Test locally with Live Server

1. Open the `faculty-achievement-tracker` folder in VS Code.
2. Make sure `js/firebase-config.js` has your real values (not the
   `YOUR_API_KEY` placeholders).
3. Right-click `index.html` → **Open with Live Server**.
4. Try submitting a test achievement, then click **Admin** in the top
   nav and sign in with the email/password you created in step 5 above.
   You should see your test submission appear.

---

## Part 3 — Deploy to GitHub Pages (free hosting)

1. Create a new repository on GitHub (public or private both work with
   Pages, though private repos need a paid plan for Pages — public is
   simplest for this).
2. Push this project folder's contents to the repo root:
   ```bash
   cd faculty-achievement-tracker
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. On GitHub, go to your repo → **Settings → Pages**.
4. Under "Build and deployment", set **Source: Deploy from a branch**,
   **Branch: main**, folder **/ (root)** → **Save**.
5. Wait a minute, then GitHub will show your live URL, typically:
   `https://YOUR_USERNAME.github.io/YOUR_REPO/`

Share that link with faculty and students for submissions, and use the
**Admin** tab yourself (same link) to sign in and review data.

### A note on the Firebase config being public

`js/firebase-config.js` will be visible to anyone who views your site's
source — **this is normal and expected** for Firebase web apps; these
keys identify your project, they are not secret credentials. What
actually protects your data is the **Firestore security rules** from
Part 1, step 7 (public can write, only signed-in admin can read/delete).
Do not skip that step.

---

## Using the app

- **Submit tab** — faculty or students pick their role at the top of the
  form (this changes the ID field to "Faculty ID" or "Roll Number"), fill
  in the achievement, and optionally paste a Google Drive/OneDrive link
  to proof (a certificate, screenshot, etc.) instead of uploading a file
  directly — this keeps the free database usage light and works at scale
  for a whole department.
- **Admin tab** — sign in with the account from Part 1, step 5. Two views:
  - **All records** — searchable, filterable (by role/category) table of
    every submission, with CSV export and per-record delete.
  - **Monthly summary** — submissions consolidated month-by-month, with
    totals broken down by category and by Faculty vs Student, plus its
    own CSV export for reporting.

## Adding a second admin

Repeat Part 1, step 5 (Authentication → Users → Add user) with another
email/password. No code changes needed.

## Free tier limits (Firebase Spark plan)

Generous for a department: 50,000 document reads/day, 20,000 writes/day,
1 GiB stored data. A CS&IT department doing achievement tracking is very
unlikely to hit these limits.
