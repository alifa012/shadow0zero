# Firebase Hosting Deployment Guide

## Your Website
**Live URL:** https://shadowlogsshop.web.app
**Firebase Console:** https://console.firebase.google.com/project/shadowlogsshop/overview

## Deploy Updates
To upload changes to your website:

```bash
firebase deploy --only hosting
```

## Project Structure
- `firebase.json` - Hosting configuration  
- `.firebaserc` - Project settings
- All HTML files are automatically deployed from root directory
- Assets folder contains CSS/JS resources

## Benefits of Firebase Hosting
- ✅ SSL certificate (HTTPS) 
- ✅ Global CDN for fast loading
- ✅ 99.9% uptime guarantee
- ✅ Easy deployment with single command
- ✅ Integrated with your Firebase auth/database

**No more FTP uploads needed!** Just run `firebase deploy` to publish changes.