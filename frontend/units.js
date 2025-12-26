/**
 * Unit Conversion Utilities for MTEL
 * Handles conversion between Imperial and Metric units
 */

// Unit conversion functions
const UnitConverter = {
    // Speed conversions
    mphToKph: (mph) => mph * 1.60934,
    kphToMph: (kph) => kph / 1.60934,

    // Fuel conversions
    gallonsToLiters: (gallons) => gallons * 3.78541,
    litersToGallons: (liters) => liters / 3.78541,

    // Pressure conversions
    psiToKpa: (psi) => psi * 6.89476,
    kpaToPsi: (kpa) => kpa / 6.89476,

    // Temperature conversions
    fahrenheitToCelsius: (f) => (f - 32) * 5 / 9,
    celsiusToFahrenheit: (c) => (c * 9 / 5) + 32,

    // Main conversion functions
    convertSpeed: (value, toImperial) => {
        if (toImperial) {
            return UnitConverter.kphToMph(value);
        }
        return UnitConverter.mphToKph(value);
    },

    convertFuel: (value, toImperial) => {
        if (toImperial) {
            return UnitConverter.litersToGallons(value);
        }
        return UnitConverter.gallonsToLiters(value);
    },

    convertPressure: (value, toImperial) => {
        if (toImperial) {
            return UnitConverter.kpaToPsi(value);
        }
        return UnitConverter.psiToKpa(value);
    },

    convertTemperature: (value, toImperial) => {
        if (toImperial) {
            return UnitConverter.celsiusToFahrenheit(value);
        }
        return UnitConverter.fahrenheitToCelsius(value);
    },

    // Format functions with units
    formatSpeed: (value, isImperial) => {
        const unit = isImperial ? 'mph' : 'km/h';
        return `${Math.round(value)} ${unit}`;
    },

    formatFuel: (value, isImperial) => {
        const unit = isImperial ? 'gal' : 'L';
        return `${value.toFixed(2)} ${unit}`;
    },

    formatPressure: (value, isImperial) => {
        const unit = isImperial ? 'PSI' : 'kPa';
        return `${value.toFixed(1)} ${unit}`;
    },

    formatTemperature: (value, isImperial) => {
        const unit = isImperial ? '°F' : '°C';
        return `${Math.round(value)}${unit}`;
    }
};

// Unit preference management
const UnitPreference = {
    STORAGE_KEY: 'mtel-unit-preference',

    // Get current preference (default to Imperial)
    get: () => {
        const stored = localStorage.getItem(UnitPreference.STORAGE_KEY);
        return stored === 'metric' ? false : true; // true = Imperial, false = Metric
    },

    // Set preference
    set: (isImperial) => {
        localStorage.setItem(UnitPreference.STORAGE_KEY, isImperial ? 'imperial' : 'metric');
    },

    // Toggle preference
    toggle: () => {
        const current = UnitPreference.get();
        UnitPreference.set(!current);
        return !current;
    },

    // Get unit labels
    getLabels: (isImperial) => ({
        speed: isImperial ? 'mph' : 'km/h',
        fuel: isImperial ? 'gal' : 'L',
        pressure: isImperial ? 'PSI' : 'kPa',
        temperature: isImperial ? '°F' : '°C'
    })
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UnitConverter, UnitPreference };
}
