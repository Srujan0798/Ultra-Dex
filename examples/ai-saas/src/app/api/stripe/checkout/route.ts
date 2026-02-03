import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { stripe, createOrRetrieveCustomer, createCheckoutSession, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { planId } = await req.json();

    const plan = PLANS.find((p) => p.id === planId);

    if (!plan || !plan.stripePriceId) {
      return NextResponse.json(
        { success: false, error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const stripeCustomer = await createOrRetrieveCustomer(
      session.user.email,
      session.user.id
    );

    // Update user with Stripe customer ID
    await prisma.user.update({
      where: { id: session.user.id },
      data: { stripeCustomerId: stripeCustomer.id },
    });

    const successUrl = absoluteUrl("/dashboard/billing?success=true");
    const cancelUrl = absoluteUrl("/pricing?canceled=true");

    const checkoutSession = await createCheckoutSession(
      stripeCustomer.id,
      plan.stripePriceId,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      success: true,
      data: { sessionId: checkoutSession.id, url: checkoutSession.url },
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

function absoluteUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${path}`;
}
