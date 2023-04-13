export const initializeMapkit = async () => {
  const tokenID =
    "eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Iko1RlpZMjhRR00ifQ.eyJpc3MiOiI0TVQ5SEZWTjhFIiwiaWF0IjoxNjgxMzI1ODk2LCJleHAiOjE3MTI4ODAwMDB9.CioSplbh1y9kBLZ-WV-krgeEkz9pj40KrNsTXxX-UE3UupzNCNQp4AfqmXeeSFwvoHj8jMfDvGX0nmhwilFOSQ";

  if (!window.mapkit || window.mapkit.loadedLibraries.length === 0) {
    await new Promise((resolve) => {
      window.initMapKit = resolve;
    });
    delete window.initMapKit;

    mapkit.init({
      authorizationCallback: function (done) {
        done(tokenId);
      },
    });
  } else {
    // return new Promise((resolve) => { resolve() });
    return Promise.resolve();
  }
}