const sdkPromise = import('./sdk.js');

module.exports = sdkPromise;

if (require.main === module) {
  sdkPromise.catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
