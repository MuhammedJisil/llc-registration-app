// payments.router.js
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { pool } = require('../config/db'); // Adjust path as needed

// Regular JSON parser for standard endpoints
router.use(express.json());

// Initialize payment
router.post('/initialize', async (req, res) => {
  const { registrationId, amount } = req.body;

  try {
    // Create a payment record
    const paymentResult = await pool.query(
      `INSERT INTO payments (registration_id, amount, status)
       VALUES ($1, $2, 'pending')
       RETURNING id`,
      [registrationId, amount]
    );

    const paymentId = paymentResult.rows[0].id;

    // Create a Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        paymentId,
        registrationId
      }
    });

    // Update payment record with Stripe payment ID
    await pool.query(
      `UPDATE payments 
       SET stripe_payment_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [paymentIntent.id, paymentId]
    );

    res.status(200).json({
      paymentId,
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete payment
router.post('/complete', async (req, res) => {
  const { paymentId, stripePaymentId, status } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update payment status
    await client.query(
      `UPDATE payments 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [status, paymentId]
    );

    // If payment was successful, update registration status
    if (status === 'successful') {
      // Get the registration ID from the payment
      const paymentResult = await client.query(
        'SELECT registration_id FROM payments WHERE id = $1',
        [paymentId]
      );
      
      if (paymentResult.rows.length > 0) {
        const registrationId = paymentResult.rows[0].registration_id;
        
        // Update registration status to 'paid'
        await client.query(
          `UPDATE llc_registrations 
           SET status = 'paid', updated_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [registrationId]
        );
      }
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Payment updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error completing payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Special raw body parser middleware specifically for Stripe webhooks
const stripeWebhookHandler = router.post(
  '/stripe-webhook', 
  bodyParser.raw({ type: 'application/json' }), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Extract registration ID from metadata
      const { paymentId, registrationId } = paymentIntent.metadata;
      
      // Update payment status
      await pool.query(
        `UPDATE payments 
         SET status = 'successful', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [paymentId]
      );
      
      // Update registration status
      await pool.query(
        `UPDATE llc_registrations 
         SET status = 'paid', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [registrationId]
      );
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const { paymentId } = paymentIntent.metadata;
      
      // Update payment status
      await pool.query(
        `UPDATE payments 
         SET status = 'failed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [paymentId]
      );
    }

    res.status(200).json({ received: true });
  }
);

module.exports = router;