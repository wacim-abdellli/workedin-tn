# ✅ Rename to "workedin" - Action List

## What I've Done For You:
- ✅ Updated `.vercel/project.json` to use "workedin"
- ✅ Confirmed `package.json` already uses "workedin"
- ✅ Created comprehensive rename guide

## What YOU Need to Do:

### 1. Rename Vercel Project (2 minutes)
1. Go to: https://vercel.com/dashboard
2. Click on "khedma-tn" project
3. Click **Settings** → **General**
4. Change **Project Name** from `khedma-tn` to `workedin`
5. Click **Save**

**New URL**: `https://workedin.vercel.app`

---

### 2. Rename Supabase Project (1 minute)
1. Go to: https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd
2. Click **Settings** (gear icon)
3. Go to **General** tab
4. Change **Project Name** to `workedin`
5. Click **Save**

**Note**: The URL `wvgkezmboewtlpnyjnyd.supabase.co` stays the same (that's normal)

---

### 3. Update Supabase Secret (30 seconds)
After renaming Vercel, update the allowed origin:

```powershell
npx supabase secrets set ALLOWED_ORIGIN="https://workedin.vercel.app" --project-ref wvgkezmboewtlpnyjnyd
```

---

### 4. (Optional) Rename GitHub Repo
1. Go to: https://github.com/wacim-abdellli/khedma-tn
2. Click **Settings**
3. Change **Repository name** to `workedin`
4. Click **Rename**

Then update your local git remote:
```powershell
git remote set-url origin https://github.com/wacim-abdellli/workedin.git
```

---

## That's It!

After these steps:
- Vercel project will be "workedin"
- Supabase project will be "workedin"
- GitHub repo will be "workedin" (if you renamed it)
- All code references are already updated

**Total Time**: 5-10 minutes

See `RENAME_PROJECTS_GUIDE.md` for detailed instructions if needed.
