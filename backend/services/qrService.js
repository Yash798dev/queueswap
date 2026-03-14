const os = require('os');
const QRCode = require('qrcode');

// Helper to get local IP address
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    let preferredIp = '';

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (non-127.0.0.1) and non-ipv4 addresses
            if ('IPv4' === iface.family && !iface.internal) {
                // Prioritize Wi-Fi or Ethernet interfaces over virtual ones (like vEthernet/WSL)
                const lowerName = name.toLowerCase();
                if (lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('ethernet')) {
                    // If we find a Wi-Fi/Ethernet adapter, return it immediately as it's likely the main one
                    if (!lowerName.includes('vethernet')) { // Exclude virtual ethernet
                        return iface.address;
                    }
                }
                // Store first valid IP as fallback if no specific Wi-Fi/Ethernet is found
                if (!preferredIp) preferredIp = iface.address;
            }
        }
    }
    return preferredIp || 'localhost';
}

/**
 * Generates a QR code data URL for a given business object.
 * @param {Object} business - The business object containing details.
 * @returns {Promise<string>} - A Promise that resolves to the QR code data URL (base64).
 */
exports.generateBusinessQRCode = async (business) => {
    try {
        const ip = getLocalIpAddress();
        // Point to Angular Frontend via ngrok URL
        const ngrokUrl = 'https://electromechanical-weakhanded-elizabet.ngrok-free.dev';
        const qrData = `${ngrokUrl}/queue-join/${business._id}`;

        // Generate QR Code as Data URL
        const qrCodeDataURL = await QRCode.toDataURL(qrData);
        return qrCodeDataURL;
    } catch (error) {
        console.error('Error generating QR code:', error);
        throw error;
    }
};
