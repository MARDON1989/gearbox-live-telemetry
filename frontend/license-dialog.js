/**
 * MTEL License Dialog
 * Handles license key entry and validation UI
 */

class LicenseDialog {
    constructor(validator) {
        this.validator = validator;
        this.dialog = null;
    }

    /**
     * Show license activation dialog
     * @param {string} errorMessage - Optional error message to display
     */
    show(errorMessage = null) {
        // Create dialog HTML
        const dialogHtml = `
            <div id="license-dialog" class="license-dialog-overlay">
                <div class="license-dialog">
                    <div class="license-header">
                        <h2>🔑 Activate MTEL Beta</h2>
                        <p>Enter your beta license key to continue</p>
                    </div>
                    
                    ${errorMessage ? `
                        <div class="license-error">
                            <span class="error-icon">⚠️</span>
                            <span>${errorMessage}</span>
                        </div>
                    ` : ''}
                    
                    <div class="license-body">
                        <label for="license-key-input">License Key</label>
                        <input 
                            type="text" 
                            id="license-key-input" 
                            class="license-input"
                            placeholder="MTEL-BETA-XXXX-XXXX-XXXX-XXXX"
                            maxlength="34"
                            autocomplete="off"
                            spellcheck="false"
                        />
                        
                        <button id="activate-btn" class="activate-btn">
                            Activate License
                        </button>
                        
                        <div class="license-help">
                            <p>Don't have a beta key?</p>
                            <a href="https://mardonpc.com/mtel/beta" target="_blank">
                                Apply for Beta Access
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add to page
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
        this.dialog = document.getElementById('license-dialog');

        // Add event listeners
        this.setupEventListeners();

        // Focus input
        document.getElementById('license-key-input').focus();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        const input = document.getElementById('license-key-input');
        const activateBtn = document.getElementById('activate-btn');

        // Auto-format key as user types
        input.addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');

            // Add dashes automatically
            if (value.length > 4) {
                value = value.match(/.{1,4}/g).join('-');
            }

            e.target.value = value;
        });

        // Activate on Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.activate();
            }
        });

        // Activate on button click
        activateBtn.addEventListener('click', () => {
            this.activate();
        });
    }

    /**
     * Attempt to activate license
     */
    activate() {
        const input = document.getElementById('license-key-input');
        const activateBtn = document.getElementById('activate-btn');
        const licenseKey = input.value.trim();

        // Disable button during validation
        activateBtn.disabled = true;
        activateBtn.textContent = 'Validating...';

        // Validate key
        const result = this.validator.validate(licenseKey);

        if (result.valid) {
            // Save license
            this.validator.saveKey(licenseKey);

            // Show success message
            this.showSuccess(result);

            // Close dialog and start app after delay
            setTimeout(() => {
                this.close();
                window.location.reload();
            }, 2000);
        } else {
            // Show error
            activateBtn.disabled = false;
            activateBtn.textContent = 'Activate License';

            // Close and reopen with error
            this.close();
            this.show(result.error);
        }
    }

    /**
     * Show success message
     * @param {Object} result - Validation result
     */
    showSuccess(result) {
        const dialog = document.querySelector('.license-dialog');
        dialog.innerHTML = `
            <div class="license-success">
                <div class="success-icon">✓</div>
                <h2>License Activated!</h2>
                <p>Beta access valid for ${result.daysRemaining} days</p>
                <p class="success-subtext">Starting MTEL...</p>
            </div>
        `;
    }

    /**
     * Close dialog
     */
    close() {
        if (this.dialog) {
            this.dialog.remove();
            this.dialog = null;
        }
    }
}

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LicenseDialog;
}
