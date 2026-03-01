// License initialization function
function initLicense() {
    console.log('Initializing License Check...');

    // Check if license classes are available
    if (typeof BetaLicenseValidator === 'undefined') {
        console.error('BetaLicenseValidator not loaded!');
        return;
    }
    if (typeof LicenseDialog === 'undefined') {
        console.error('LicenseDialog not loaded!');
        return;
    }

    const validator = new BetaLicenseValidator();
    const dialog = new LicenseDialog(validator);
    const result = validator.getStatus();

    console.log('License status:', result);

    if (!result.hasLicense) {
        console.log('No valid license found. Showing dialog.');
        dialog.show();
    } else {
        console.log(`License active: ${result.message}`);
    }
}
