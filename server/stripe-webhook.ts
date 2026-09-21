import type { Request, Response } from "express";
import { bvsbusStripe } from "./stripe-client";
import { handleStripeWebhookEvent } from "./stripe-marketplace";

export async function stripeWebhookHandler(req: Request, res: Response) {
  try {
    const signature = req.headers["stripe-signature"];
    const signatureHeader = Array.isArray(signature) ? signature[0] : signature;
    if (!signatureHeader) {
      return res.status(400).json({ message: "Missing Stripe-Signature header" });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ message: "Stripe webhook requires the raw request body" });
    }

    const event = bvsbusStripe.verifyWebhook(req.body, signatureHeader);
    await handleStripeWebhookEvent(event);
    res.json({ received: true });
  } catch (error: any) {
    res.status(400).json({ message: error?.message || "Stripe webhook handling failed" });
  }
}
