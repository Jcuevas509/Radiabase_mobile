const appJson = require('./app.json');

const isJosePreview =
  process.env.EAS_BUILD_PROFILE === 'preview-jose' ||
  process.env.RADIOBASE_PERSONAL_BUILD === '1';

const JOSE_EAS_PROJECT_ID = 'c56e34d6-d6dd-41b4-89ba-3c21768f7d9e';

/**
 * Company builds keep VisioT signing and the vantagemedia EAS project.
 * preview-jose is a personal install on Jose's Expo/Apple account.
 */
module.exports = {
  expo: {
    ...appJson.expo,
    name: isJosePreview ? 'Radiabase Jose' : appJson.expo.name,
    slug: isJosePreview ? 'radiabase-jose' : appJson.expo.slug,
    owner: isJosePreview ? 'numix' : appJson.expo.owner,
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: isJosePreview ? 'com.numix.radiabase' : appJson.expo.ios.bundleIdentifier,
      appleTeamId: isJosePreview ? undefined : appJson.expo.ios.appleTeamId,
      infoPlist: {
        ...appJson.expo.ios.infoPlist,
        ...(isJosePreview
          ? {
              NSAppTransportSecurity: {
                NSAllowsLocalNetworking: true,
              },
            }
          : {}),
      },
    },
    android: {
      ...appJson.expo.android,
      package: isJosePreview ? 'com.numix.radiabase' : appJson.expo.android.package,
    },
    extra: {
      ...appJson.expo.extra,
      allowApiUrlOverride: isJosePreview,
      eas: {
        ...appJson.expo.extra?.eas,
        projectId: isJosePreview ? JOSE_EAS_PROJECT_ID : appJson.expo.extra.eas.projectId,
      },
    },
    updates: {
      ...appJson.expo.updates,
      url: isJosePreview
        ? `https://u.expo.dev/${JOSE_EAS_PROJECT_ID}`
        : appJson.expo.updates.url,
    },
  },
};
