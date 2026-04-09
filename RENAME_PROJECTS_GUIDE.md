# 🔄 Rename Projects Guide - khedma-tn → workedin

This guide will help you rename your Vercel and Supabase projects from "khedma-tn" to "workedin".

---

## 1️⃣ Rename Vercel Project

### Option A: Via Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Click on your project "khedma-tn"
3. Go to **Settings** → **General**
4. Scroll to **Project Name**
5. Change from `khedma-tn` to `workedin`
6. Click **Save**

**New URL will be**: `https://workedin.vercel.app`

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# In the Vercel dashboard, rename the project manually
```

**Note**: You cannot rename via CLI directly, must use dashboard.

---

## 2️⃣ Rename Supabase Project

### Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd
2. Click **Settings** (gear icon in sidebar)
3. Go to **General** tab
4. Find **Project Name** section
5. Change from "khedma-tn" to "workedin"
6. Click **Save**

**Note**: The project URL (`wvgkezmboewtlpnyjnyd.supabase.co`) will NOT change - only the display name changes.

---

## 3️⃣ Update GitHub Repository Name

1. Go to: https://github.com/wacim-abdellli/khedma-tn
2. Click **Settings** tab
3. Scroll to **Repository name**
4. Change from `khedma-tn` to `workedin`
5. Click **Rename**

**New URL**: `https://github.com/wacim-abdellli/workedin`

### Update Local Git Remote

After renaming on GitHub, update your local repository:

```bash
git remote set-url origin https://github.com/wacim-abdellli/workedin.git
```

---

## 4️⃣ Update Code References

After renaming the projects, update these files in your code:

### Update .vercel/project.json

```json
{
  "projectId": "prj_yF04JshMnbu20eJJaOvduSKkky4T",
  "orgId": "team_X1vmztgiyTF4V955jPKmnGRK",
  "projectName": "workedin",
  "settings": {
    ...
  }
}
```

### Update package.json

Change the `name` field:

```json
{
  "name": "workedin",
  "version": "1.0.0",
  ...
}
```

### Update README.md

Update any references to "khedma-tn" to "workedin".

---

## 5️⃣ Update Domain/URLs (Optional)

If you want to use a custom domain:

### Vercel Domain Setup

1. Go to Vercel project → **Settings** → **Domains**
2. Add your domain: `workedin.tn`
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5-60 minutes)

### Update Environment Variables

Update `VITE_APP_URL` in your environment:

```bash
# .env.local
VITE_APP_URL=https://workedin.tn
```

Or if using Vercel domain:
```bash
VITE_APP_URL=https://workedin.vercel.app
```

---

## 6️⃣ Update Supabase Secrets

Update the `ALLOWED_ORIGIN` secret to match your new domain:

```bash
npx supabase secrets set ALLOWED_ORIGIN="https://workedin.vercel.app" --project-ref wvgkezmboewtlpnyjnyd
```

Or if using custom domain:
```bash
npx supabase secrets set ALLOWED_ORIGIN="https://workedin.tn" --project-ref wvgkezmboewtlpnyjnyd
```

---

## ✅ Checklist

- [ ] Rename Vercel project to "workedin"
- [ ] Rename Supabase project to "workedin"
- [ ] Rename GitHub repository to "workedin"
- [ ] Update local git remote URL
- [ ] Update `.vercel/project.json`
- [ ] Update `package.json` name
- [ ] Update `README.md` references
- [ ] Update `ALLOWED_ORIGIN` secret in Supabase
- [ ] Update `VITE_APP_URL` in environment variables
- [ ] Test deployment after changes

---

## 🚨 Important Notes

1. **Supabase URL stays the same**: `wvgkezmboewtlpnyjnyd.supabase.co` won't change
2. **Vercel URL will change**: From `khedma-tn.vercel.app` to `workedin.vercel.app`
3. **GitHub URL will change**: From `github.com/.../khedma-tn` to `github.com/.../workedin`
4. **Update all team members**: Tell them to update their git remote URLs

---

## 🔧 After Renaming

1. **Redeploy to Vercel**:
   ```bash
   git add -A
   git commit -m "chore: rename project to workedin"
   git push origin main
   ```

2. **Test everything**:
   - Visit new Vercel URL
   - Test authentication
   - Test payments
   - Check all features work

3. **Update documentation**:
   - Update any docs with old URLs
   - Update team wiki/notes
   - Update client-facing materials

---

**Estimated Time**: 15-30 minutes

**Need Help?** If you get stuck on any step, let me know!
