# Server Auto-Kick (GitHub Actions)

Runs P Manager's auto-kick on GitHub's servers every 15 minutes —
no phone needed, no battery drain, no background-service kills.

## How it works

1. **Playwright** opens the Ruijie CAS login page, logs in with your
   Ruijie account, captures the SSO session cookies
2. **Cloud Open API** fetches your vouchers (App ID + Secret)
3. Finds spent vouchers: `status == "2"` AND (`usedQuota >= quota` OR `usedTime >= timePeriod`)
4. For each spent voucher, finds its portal auth record and kicks it via
   `/samTransfer/kick/user/offline`

## Setup (one time)

### 1. Put these files in a GitHub repo

Either a new repo or your existing app repo. Needed paths:

```
autokick-server/autokick.py
.github/workflows/autokick.yml
```

### 2. Add secrets

Repo → **Settings → Secrets and variables → Actions** → **New repository secret**:

| Name | Value |
|------|-------|
| `RUIJIE_EMAIL` | Ruijie Cloud login email |
| `RUIJIE_PASSWORD` | Ruijie Cloud login password |
| `RUIJIE_APPID` | Cloud Open API App ID |
| `RUIJIE_SECRET` | Cloud Open API App Secret |
| `RUIJIE_GROUP_ID` | Project/Group ID (e.g. 6752877) |

### 3. Test

Repo → **Actions** → **Server Auto-Kick** → **Run workflow**

Check the run log: you should see `SSO session alive`, voucher count,
and `KICKED` lines.

### 4. Schedule

The workflow runs automatically every 15 minutes via cron.
Change the interval in `.github/workflows/autokick.yml` if needed.
(GitHub minimum: every 5 minutes.)

## Notes

- Public repos get unlimited Actions minutes free
- Each run is isolated: fresh login every time, no session reuse
- If SSO login fails (captcha etc.), the run exits with an error —
  check the Actions log
- The phone app's auto-kick can stay on as backup, or be turned off
