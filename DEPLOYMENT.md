# Vercel Deployment & Configuration Guide

## 1. Environment Variables
For the **Instant Appraisal** feature to work, Vercel needs your secret GoDaddy API keys. These are not committed to GitHub for security.

### How to Add Keys Manually:
1.  **Log in** to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click on your **CrushDomains** project.
3.  Click the **Settings** tab at the top.
4.  Click **Environment Variables** in the left sidebar.
5.  **Add the First Key**:
    *   **Key**: `GODADDY_KEY`
    *   **Value**: `h2K5S5FkpMEi_8DwMDM2AgX4F6kyLixcBEk`
    *   Click **Save**.
6.  **Add the Second Key**:
    *   **Key**: `GODADDY_SECRET`
    *   **Value**: `N5uCyyA2BcXKaiytRqUQ7Q`
    *   Click **Save**.

## 2. Trigger a Redeploy
After adding variables, you usually need to redeploy for them to take effect.
1.  Go to the **Deployments** tab.
2.  Click the **three dots** (...) next to your latest deployment.
3.  Select **Redeploy**.
4.  Wait for the build to finish (green checkmark).

Once deployed, visit your site and the "Instant Appraisal" link should work!
