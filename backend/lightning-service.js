// backend/lightning-service.js
import { finalizeEvent, getPublicKey } from 'nostr-tools/pure';
import { hexToBytes } from '@noble/hashes/utils';
import { NOSTR_PRIV_KEY } from './config.js';

// Lightning configuration
const LIGHTNING_ADDRESS = process.env.LIGHTNING_ADDRESS || 'nostroracle@getalby.com';
const ZAP_AMOUNT_SATS = parseInt(process.env.ZAP_AMOUNT_SATS) || 1000; // Default 1000 sats

/**
 * Create a NIP-57 zap request event
 * @param {string} recipientPubkey - Public key of the recipient
 * @param {string} eventId - ID of the event being zapped
 * @param {number} amount - Amount in millisats
 * @param {string} comment - Optional comment
 * @returns {Object} Zap request event
 */
export function createZapRequest(recipientPubkey, eventId, amount, comment = '') {
  const sk = typeof NOSTR_PRIV_KEY === 'string' && NOSTR_PRIV_KEY.length === 64 
    ? hexToBytes(NOSTR_PRIV_KEY) 
    : NOSTR_PRIV_KEY;

  const zapRequest = {
    kind: 9734, // NIP-57 zap request
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['p', recipientPubkey], // Recipient
      ['e', eventId], // Event being zapped
      ['amount', String(amount)], // Amount in millisats
      ['relays', 'wss://relay.damus.io', 'wss://nos.lol'], // Relays
    ],
    content: comment,
  };

  return finalizeEvent(zapRequest, sk);
}

/**
 * Create a zap receipt event (kind 9735)
 * @param {string} zapRequestEvent - The original zap request
 * @param {string} bolt11 - Lightning invoice
 * @param {string} preimage - Payment preimage (proof of payment)
 * @returns {Object} Zap receipt event
 */
export function createZapReceipt(zapRequestEvent, bolt11, preimage) {
  const sk = typeof NOSTR_PRIV_KEY === 'string' && NOSTR_PRIV_KEY.length === 64 
    ? hexToBytes(NOSTR_PRIV_KEY) 
    : NOSTR_PRIV_KEY;

  const zapReceipt = {
    kind: 9735, // NIP-57 zap receipt
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['p', zapRequestEvent.tags.find(t => t[0] === 'p')[1]], // Recipient
      ['e', zapRequestEvent.tags.find(t => t[0] === 'e')[1]], // Original event
      ['bolt11', bolt11], // Lightning invoice
      ['description', JSON.stringify(zapRequestEvent)], // Original zap request
    ],
    content: preimage ? `Payment successful. Preimage: ${preimage}` : 'Payment processed',
  };

  return finalizeEvent(zapReceipt, sk);
}

/**
 * Generate Lightning invoice for a zap
 * @param {number} amount - Amount in sats
 * @param {string} description - Invoice description
 * @returns {Promise<Object>} Invoice details
 */
export async function generateLightningInvoice(amount, description) {
  // This is a mock implementation
  // In a real implementation, you would integrate with:
  // - LND (Lightning Network Daemon)
  // - CLN (Core Lightning)
  // - LDK (Lightning Development Kit)
  // - A Lightning service provider like Alby, Strike, etc.
  
  console.log(`Mock: Generating Lightning invoice for ${amount} sats`);
  console.log(`Description: ${description}`);
  
  // Mock invoice data
  const mockInvoice = {
    bolt11: `lnbc${amount}u1p...mock_invoice_${Date.now()}`,
    payment_hash: `mock_hash_${Date.now()}`,
    amount_sats: amount,
    description,
    expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
  };
  
  return mockInvoice;
}

/**
 * Check if a Lightning invoice has been paid
 * @param {string} paymentHash - Payment hash to check
 * @returns {Promise<Object>} Payment status
 */
export async function checkInvoiceStatus(paymentHash) {
  // Mock implementation
  console.log(`Mock: Checking payment status for ${paymentHash}`);
  
  // Simulate random payment success for demo
  const isPaid = Math.random() > 0.5;
  
  return {
    paid: isPaid,
    preimage: isPaid ? `mock_preimage_${Date.now()}` : null,
    amount_paid: isPaid ? ZAP_AMOUNT_SATS : 0,
  };
}

/**
 * Process a zap for high-quality content
 * @param {string} eventId - Event ID to zap
 * @param {string} authorPubkey - Author's public key
 * @param {number} credibilityScore - Credibility score (0-100)
 * @returns {Promise<Object>} Zap processing result
 */
export async function processContentZap(eventId, authorPubkey, credibilityScore) {
  try {
    // Only zap high-quality content (score > 80)
    if (credibilityScore <= 80) {
      return {
        success: false,
        reason: 'Content score too low for zap',
        score: credibilityScore,
        threshold: 80
      };
    }

    // Calculate zap amount based on score
    const zapAmount = Math.floor((credibilityScore / 100) * ZAP_AMOUNT_SATS);
    
    // Generate invoice
    const invoice = await generateLightningInvoice(
      zapAmount, 
      `NostrOracle tip for high-quality content (score: ${credibilityScore})`
    );
    
    // Create zap request
    const zapRequest = createZapRequest(
      authorPubkey, 
      eventId, 
      zapAmount * 1000, // Convert to millisats
      `Automated tip from NostrOracle for credible content (score: ${credibilityScore}/100)`
    );
    
    // In a real implementation, you would:
    // 1. Pay the invoice automatically using your Lightning wallet
    // 2. Wait for payment confirmation
    // 3. Create and publish the zap receipt
    
    console.log(`Zap processed: ${zapAmount} sats for event ${eventId}`);
    
    return {
      success: true,
      amount_sats: zapAmount,
      invoice: invoice.bolt11,
      zap_request: zapRequest,
      message: `Zapped ${zapAmount} sats for high-quality content`
    };
    
  } catch (error) {
    console.error('Failed to process zap:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get Lightning wallet info
 * @returns {Object} Wallet information
 */
export function getLightningWalletInfo() {
  return {
    address: LIGHTNING_ADDRESS,
    default_zap_amount: ZAP_AMOUNT_SATS,
    supported_features: [
      'NIP-57 Zaps',
      'Automated tipping',
      'Quality-based rewards'
    ],
    zap_threshold: 80, // Minimum score for zaps
    status: 'mock_mode' // In production, this would show actual wallet status
  };
}

/**
 * Initialize Lightning service
 */
export async function initializeLightningService() {
  console.log('Lightning service initialized');
  console.log(`Lightning address: ${LIGHTNING_ADDRESS}`);
  console.log(`Default zap amount: ${ZAP_AMOUNT_SATS} sats`);
  console.log('Note: Running in mock mode. Configure real Lightning wallet for production.');
}
