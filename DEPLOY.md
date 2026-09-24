# GitHub Pages with a Hostinger domain

Website address: **https://aicanfeelweb.com/**

Hostinger manages the domain and DNS. GitHub Pages serves the static portfolio. The editable source is on `main`; the published website is generated into the root of `gh-pages`.

## Publish an update

Use Node 22 LTS and GitHub CLI authenticated with permission to push to Global0809/Portfolio:

```sh
npm ci
npm run typecheck
npm run deploy
```

On Windows with Node 24 installed, run `npx --yes --package=node@22 -- npm run deploy` instead. Commit and push source changes to `main` separately.

GitHub Settings → Pages must use **Deploy from a branch**, branch **gh-pages**, folder **/ (root)**, and custom domain **aicanfeelweb.com**. Enable **Enforce HTTPS** once GitHub provisions the certificate.

## Domain records at Hostinger

Keep Hostinger nameservers and the domain's existing email records. The website DNS records should be:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | global0809.github.io |

Replace any previous website A record for @. Use the provider's default TTL. GitHub's current setup instructions are at https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site .

## Root paths and CNAME

All assets load from the domain root. `app/site-path.ts`, `next.config.ts` and `vite.preview.config.ts` use root paths. The canonical URL is in `app/layout.tsx`.

`public/CNAME` must contain `aicanfeelweb.com`; it is copied into every build so a future deployment does not remove the custom domain. The packaging script validates this before publishing. The Git repository remote remains https://github.com/Global0809/Portfolio.git.

All five MP4s, covers and audio envelopes are included. This deployment is separate from the earlier chatgpt.site preview.
