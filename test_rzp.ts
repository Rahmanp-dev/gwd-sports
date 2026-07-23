import Razorpay from 'razorpay';

async function test() {
  const razorpay = new Razorpay({
    key_id: 'rzp_test_TGk4a8OmY6rFxG',
    key_secret: 'V0DEirjg9Zp6rlN4KKoCa8am'
  });

  try {
    const orderOptions = {
      amount: 307500,
      currency: "INR",
      receipt: `receipt_${Date.now()}_12345`,
      notes: {
        userId: "6a615d86d4c8f2d08291551c",
        academyId: "6a5f99c3aab9c215627c23f9",
        description: "Monthly Training & Facilities Fee",
        kitId: "",
        period: "monthly"
      }
    };
    
    console.log("Creating order...");
    const order = await razorpay.orders.create(orderOptions);
    console.log("Order created:", order);
  } catch (err) {
    console.error("Error creating order:", err);
  }
}

test();
