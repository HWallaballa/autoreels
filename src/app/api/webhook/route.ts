import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, PLANS } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";

function getPlanFromPriceId(priceId: string): string {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) return key;
  }
  return "starter";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_email;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : (session.customer as any)?.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as any)?.id;

      if (email) {
        // Get the subscription to determine the plan
        let plan = "starter";
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price?.id;
          if (priceId) plan = getPlanFromPriceId(priceId);
        }

        await supabase
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            subscription_id: subscriptionId,
            plan,
            videos_used_this_month: 0,
            billing_cycle_start: new Date().toISOString(),
          })
          .eq("email", email);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : (subscription.customer as any)?.id;

      if (subscription.status !== "active") {
        await supabase
          .from("profiles")
          .update({ plan: "free" })
          .eq("stripe_customer_id", customerId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const deletedSub = event.data.object as Stripe.Subscription;
      const deletedCustomerId =
        typeof deletedSub.customer === "string"
          ? deletedSub.customer
          : (deletedSub.customer as any)?.id;

      await supabase
        .from("profiles")
        .update({ plan: "free", subscription_id: null })
        .eq("stripe_customer_id", deletedCustomerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
