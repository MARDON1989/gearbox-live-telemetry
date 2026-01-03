/**
 * MTEL Beta License Validator
 * Offline validation for beta testing phase
 * No server required - validates against hardcoded key list
 */

class BetaLicenseValidator {
    constructor() {
        // Beta program dates
        this.betaStartDate = new Date('2026-01-15');
        this.betaEndDate = new Date('2026-04-15'); // 90 days

        // Valid beta keys (generated from generate-beta-keys.py)
        this.betaKeys = [
            'MTEL-BETA-3A53-ZQKZ-XX7V-4E32',
            'MTEL-BETA-3AF8-3MW7-3C23-7842',
            'MTEL-BETA-4488-8M6F-NCNS-9273',
            'MTEL-BETA-4QTC-93UD-ATE7-31ED',
            'MTEL-BETA-5R4Q-B7VS-3B3P-AFCD',
            'MTEL-BETA-6EHT-Q834-74T8-545B',
            'MTEL-BETA-97P8-A8EQ-46ZV-C6D8',
            'MTEL-BETA-ACXR-YTFM-T6KW-5CB2',
            'MTEL-BETA-BGVY-S8VK-CRB7-060E',
            'MTEL-BETA-BKQ5-8F7E-YPRU-BE5A',
            'MTEL-BETA-BUV8-VXVV-HJES-9D8E',
            'MTEL-BETA-CF9T-8EFD-SAFS-DC4D',
            'MTEL-BETA-CKVY-KMUS-CKKV-3FE5',
            'MTEL-BETA-CMES-UGW2-CFDV-22F6',
            'MTEL-BETA-CZ85-VRHN-SDK4-C8C1',
            'MTEL-BETA-EVE7-MSY7-XZ4B-6FB0',
            'MTEL-BETA-EZ5Y-6MRP-CAPQ-0D1C',
            'MTEL-BETA-F3KP-9DPX-BUUZ-472E',
            'MTEL-BETA-FB8W-UYH8-XCQR-CB99',
            'MTEL-BETA-FHGW-RQ5W-P45Q-D38C',
            'MTEL-BETA-FMBX-F7EX-DBJY-D785',
            'MTEL-BETA-G7WH-6FDE-8Z98-C935',
            'MTEL-BETA-GBP4-95YR-KAZW-4C0D',
            'MTEL-BETA-H9WK-M6V2-ECAY-A33E',
            'MTEL-BETA-JYQM-Q9JC-JSUQ-23DB',
            'MTEL-BETA-KPT9-VNTV-D79K-719C',
            'MTEL-BETA-M7BC-DVPW-QNY8-6F0A',
            'MTEL-BETA-MGMT-QSNF-B5KT-467A',
            'MTEL-BETA-MJSC-ZESG-5MS2-32FF',
            'MTEL-BETA-PD3E-G8UC-UMWV-DB6F',
            'MTEL-BETA-PDN3-PGFT-CGF7-348B',
            'MTEL-BETA-QF3W-UP3V-C66X-41EC',
            'MTEL-BETA-QVFU-BJFX-HTEC-9054',
            'MTEL-BETA-R86J-M2ZF-JFX8-FD84',
            'MTEL-BETA-RUSN-NZXT-ZT48-6E1A',
            'MTEL-BETA-S8CX-HR4S-D3U4-3134',
            'MTEL-BETA-TFTF-UKQA-4GBS-8F9F',
            'MTEL-BETA-U7MW-BRKK-SMFF-1892',
            'MTEL-BETA-VFJ9-SVXP-JCA7-12F5',
            'MTEL-BETA-VJSK-9DU4-MHEG-C2F3',
            'MTEL-BETA-VMXA-VKYP-TAWV-64DA',
            'MTEL-BETA-VZPV-Z2FJ-E55R-E7FD',
            'MTEL-BETA-W5B5-JUPK-K3SP-6102',
            'MTEL-BETA-X53B-K9W7-Z4SC-C1D4',
            'MTEL-BETA-XG4C-DBFB-Y2YS-B703',
            'MTEL-BETA-XXFA-F4UW-VXA9-447E',
            'MTEL-BETA-YMC7-35GG-68XC-E068',
            'MTEL-BETA-YSQ6-5ZXA-QCSM-79B2',
            'MTEL-BETA-ZRPD-FBNJ-DFVY-7135',
            'MTEL-BETA-ZUHM-WDHQ-KB9N-B5DE'
        ];
    }

    /**
     * Validate a license key
     * @param {string} licenseKey - The license key to validate
     * @returns {Object} Validation result
     */
    validate(licenseKey) {
        // Normalize key (remove spaces, uppercase)
        const normalizedKey = licenseKey.trim().toUpperCase();

        // Check format
        if (!this.isValidFormat(normalizedKey)) {
            return {
                valid: false,
                error: 'Invalid license key format'
            };
        }

        // Check if key exists in beta list
        if (!this.betaKeys.includes(normalizedKey)) {
            return {
                valid: false,
                error: 'License key not found. Please check your key or contact support.'
            };
        }

        // Check if beta period is active
        const now = new Date();

        if (now < this.betaStartDate) {
            return {
                valid: false,
                error: 'Beta program has not started yet.'
            };
        }

        if (now > this.betaEndDate) {
            return {
                valid: false,
                error: 'Beta period has ended. Please purchase a license at mardonpc.com/mtel'
            };
        }

        // Calculate days remaining
        const daysRemaining = Math.ceil(
            (this.betaEndDate - now) / (1000 * 60 * 60 * 24)
        );

        // Valid!
        return {
            valid: true,
            type: 'BETA',
            expires: this.betaEndDate.toISOString(),
            daysRemaining: daysRemaining,
            message: `Beta access valid for ${daysRemaining} more days`
        };
    }

    /**
     * Check if key matches expected format
     * @param {string} key - License key
     * @returns {boolean}
     */
    isValidFormat(key) {
        // Format: MTEL-BETA-XXXX-XXXX-XXXX-XXXX
        const pattern = /^MTEL-BETA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        return pattern.test(key);
    }

    /**
     * Save license key to local storage
     * @param {string} licenseKey - The license key
     */
    saveKey(licenseKey) {
        localStorage.setItem('mtel_license_key', licenseKey);
        localStorage.setItem('mtel_license_type', 'BETA');
        localStorage.setItem('mtel_license_validated', new Date().toISOString());
    }

    /**
     * Get stored license key
     * @returns {string|null}
     */
    getStoredKey() {
        return localStorage.getItem('mtel_license_key');
    }

    /**
     * Clear stored license
     */
    clearLicense() {
        localStorage.removeItem('mtel_license_key');
        localStorage.removeItem('mtel_license_type');
        localStorage.removeItem('mtel_license_validated');
    }

    /**
     * Get license status
     * @returns {Object}
     */
    getStatus() {
        const key = this.getStoredKey();
        if (!key) {
            return {
                hasLicense: false,
                message: 'No license key found'
            };
        }

        const result = this.validate(key);
        return {
            hasLicense: result.valid,
            key: key,
            ...result
        };
    }
}

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BetaLicenseValidator;
}
