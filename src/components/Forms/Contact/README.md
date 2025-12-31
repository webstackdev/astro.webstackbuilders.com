# Uppy File Uploads

## Google Drive Picker

A Companion instance is required for the Google Drive Picker plugin to work. Companion downloads the files from Google Drive, and uploads them to the destination. This saves the user bandwidth, especially helpful if they are on a mobile connection.

To sign up for API keys, go to the [Google Developer Console](https://console.developers.google.com/).

Create a project for your app if you don't have one yet.

- On the project's dashboard, enable the [Google Picker API](https://console.cloud.google.com/apis/library/picker.googleapis.com) (for Google Drive).

- Create an API key:
  - Application restrictions: Websites
  - Website restrictions: Add the base URL of the domain name you're hosting the frontend web app on, example: https://example.com. Note that if you're testing locally you need to add `http://localhost:LOCAL_PORT` or similar
  - API restrictions: Restrict key: Tick Google Picker API
  - Click Show key and use it as the `apiKey` argument to Uppy.

- Create an OAuth 2.0 Client ID of type Web application:
  - Authorized JavaScript origins: Add the base URL of the domain name you're hosting the frontend web app on, example: `https://example.com`. Note that if you're testing locally you need to add `http://localhost:LOCAL_PORT` or similar. This will be your clientId in Uppy.

- For how to find appId, see options below.

- Some users reported that the [Google Drive API](https://console.cloud.google.com/marketplace/product/google/drive.googleapis.com?q=search&referrer=search) must be enabled as well, so if you're having problems, please try that.

## OneDrive

To sign up for API keys, go to the [Azure Platform](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade) from Microsoft.

Create a project for your app if you don't have one yet.

The app page has a "Redirect URIs" field. Here, add:

`https://$YOUR_COMPANION_HOST_NAME/onedrive/redirect`

Go to the "`Manifest`" tab, and find the "`signInAudience`" key. Change it to "`signInAudience`": "`AzureADandPersonalMicrosoftAccount`", and click "`Save`".

Go to the "`Overview`" tab. Copy the `Application (client) ID` field - this will be your Oauth client ID.

Go to the "`Certificates & secrets`" tab, and click "`+ New client secret`". Copy the Value field - this will be your OAuth client secret.

Configure the OneDrive key and secret in Companion. With the standalone Companion server, specify environment variables:

```typescript
export COMPANION_ONEDRIVE_KEY="OneDrive Application ID"
export COMPANION_ONEDRIVE_SECRET="OneDrive OAuth client secret value"
```

When using the Companion Node.js API, configure these options:

```typescript
companion.app({
  providerOptions: {
    onedrive: {
      key: 'OneDrive Application ID',
      secret: 'OneDrive OAuth client secret value',
    },
  },
})
```

## Box

You can create a Box App on the [Box Developers](https://app.box.com/developers/console) site.

Things to note:

Choose Custom App and select the User Authentication (OAuth 2.0) app type.
You must enable full write access, or you will get 403 when downloading files
You'll be redirected to the app page. This page lists the client ID (app key) and client secret (app secret), which you should use to configure Companion.

The app page has a "Redirect URIs" field. Here, add:

`https://$YOUR_COMPANION_HOST_NAME/box/redirect`

You can only use the integration with your own account initially. Make sure to apply for production status on the app page before you publish your app, or your users will not be able to sign in!

Configure the Box key and secret. With the standalone Companion server, specify environment variables:

```typescript
export COMPANION_BOX_KEY="Box API key"
export COMPANION_BOX_SECRET="Box API secret"
```

When using the Companion Node.js API, configure these options:

```typescript
companion.app({
  providerOptions: {
    box: {
      key: 'Box API key',
      secret: 'Box API secret',
    },
  },
})
```

## DropBox

You can create a Dropbox App on the [Dropbox Developers](https://www.dropbox.com/developers/apps/create) site.

Things to note:

Choose the "Dropbox API", not the business variant.

Typically you'll want "Full Dropbox" access, unless you are absolutely certain that you need the other one.

Enable the scopes `account_info.read`, `files.metadata.read` and `files.content.read` under "Permissions". If you want to support Team folders / Teams spaces, counterintuitively you must not enable any Team scopes.

You'll be redirected to the app page. This page lists the app key and app secret, which you should use to configure Companion as shown above.

The app page has a "Redirect URIs" field. Here, add:

`https://$YOUR_COMPANION_HOST_NAME/dropbox/redirect`

You can only use the integration with your own account initially. Make sure to apply for production status on the app page before you publish your app, or your users will not be able to sign in!

Configure the Dropbox key and secret. With the standalone Companion server, specify environment variables:

```typescript
export COMPANION_DROPBOX_KEY="Dropbox API key"
export COMPANION_DROPBOX_SECRET="Dropbox API secret"
```

When using the Companion Node.js API, configure these options:

```typescript
companion.app({
  providerOptions: {
    dropbox: {
      key: 'Dropbox API key',
      secret: 'Dropbox API secret',
    },
  },
})
```
