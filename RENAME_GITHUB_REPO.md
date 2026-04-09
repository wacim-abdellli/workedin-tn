# Rename GitHub Repository to workedin-tn

## Step 1: Rename on GitHub

1. Go to: https://github.com/wacim-abdellli/khedma-tn
2. Click **Settings** tab
3. Scroll to **Repository name**
4. Change to: `workedin-tn`
5. Click **Rename**

## Step 2: Update Local Git Remote

After renaming on GitHub, run this command:

```powershell
git remote set-url origin https://github.com/wacim-abdellli/workedin-tn.git
```

## Step 3: Verify

Check that it worked:

```powershell
git remote -v
```

You should see:
```
origin  https://github.com/wacim-abdellli/workedin-tn.git (fetch)
origin  https://github.com/wacim-abdellli/workedin-tn.git (push)
```

## Done!

Your GitHub repo is now renamed to `workedin-tn` and your local git is updated.
