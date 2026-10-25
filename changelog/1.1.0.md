Mostly fixes, a few new things, and dependency updates.

Back up your database and `data/uploads` before upgrading. The api migrates the email log on first start (recipients, send status, a new index), so you want a way back if something goes wrong. Backup steps are in [OPERATIONS.md](https://github.com/microrealestate/microrealestate/blob/main/documentation/OPERATIONS.md).

### New

- The template editor now shows actual pages. You get page setup, page breaks, font sizes, heading styles and an insert menu.
- You can run MRE behind your own reverse proxy (nginx, Apache, Traefik...) instead of the bundled Caddy. Set `MRE_REVERSE_PROXY=external` and `MRE_URL` in `.env`, then run `./install.sh update`. Details in [OPERATIONS.md](https://github.com/microrealestate/microrealestate/blob/main/documentation/OPERATIONS.md), "Using your own reverse proxy". (#232)
- Emails can go through a local SMTP relay: a container, `host.docker.internal`, or a machine on your LAN. If your relay isn't on 25, 465, 587 or 2525, add its port to `SMTP_ALLOWED_PORTS`.
- The web server settings page was redone.

### Fixes

- A property could show "Vacant" while it had a tenant with a current lease. (#289)
- Wrong landlord name on PDFs and emails. It used the first contact's name; now it's the company name for companies and the organization name for everyone else. The legal form (SARL, LLC...) only shows for companies.
- PDF header didn't list the landlord's contacts properly.
- If you're not a company, saving Settings > Billing made reminder emails call you "undefined Jane Doe" instead of "Jane Doe".
- The Contact field in Settings > Billing was always empty, so the form couldn't be saved.

### Dependencies

- next 15.5.28, mongoose 6.13.12, multer 2.5.0, nodemailer 10.1.7, dompurify 3.4.17 (security fixes)
