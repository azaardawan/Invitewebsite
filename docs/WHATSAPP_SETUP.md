# WhatsApp messages to customers

Once an order is paid, the site sends the customer two WhatsApp messages on the number they gave
(`src/server/notify/customer.ts`, run by the scheduler a few seconds after payment):

1. **Their page**: `/r/<token>`, where they find everything they paid for (printable cards, edits, replies, files).
2. **The invitation link** to send their guests (only for designs with an online invitation, once it is live).

Each paid order is sent once (`orders.delivered_at`). Until the settings below are filled in, nothing is sent and
the customer still has their page (the "Save on WhatsApp" button on it, and Admin's "Send on WhatsApp").

WhatsApp only lets a business message customers through the **WhatsApp Business Cloud API** (Meta), with
**templates Meta has approved**. CallMeBot (used for the owner's own alerts) cannot message other people.

## 1. Meta account and number (once)

1. Go to <https://business.facebook.com> and create (or open) the Bahja business account.
2. Go to <https://developers.facebook.com/apps>, then **Create app**, then **Business**, and add the **WhatsApp** product.
3. Under **WhatsApp → API Setup**, add the business phone number. Use a number that is **not** already on the
   WhatsApp app, or delete it from the app first. Verify it by SMS or a call.
4. Copy the **Phone number ID**. It is a long number, not the phone number itself.
5. Under **Business settings → Users → System users**, add a system user with the Admin role.
   Assign it the app, choosing **Full control**.
   Then **Generate token** with the `whatsapp_business_messaging` and `whatsapp_business_management` permissions,
   with **no expiry**. This is the permanent access token.
6. Add a payment method under **WhatsApp Manager → Settings → Payment**, as Meta charges per conversation.

## 2. The two templates

In **WhatsApp Manager → Message templates**, create each template in **Arabic (`ar`)** and **English (`en`)**.
Use the category **Utility** and exactly these names (or change the names in the settings below).
Kurdish invitations use the Arabic one.

**`bahja_customer_page`**: two variables, `{{1}}` is the first name and `{{2}}` is the page link.

- Arabic:
  > مرحباً {{1}} 🌸
  > شكراً لاختيارك بهجة! تم الدفع بنجاح.
  > هذه صفحتك الخاصة، فيها كل ما طلبته: البطاقات للطباعة، التعديل، ردود الضيوف والملفات:
  > {{2}}
  > احتفظ بهذا الرابط، فهو خاص بك.
- English:
  > Hello {{1}} 🌸
  > Thank you for choosing Bahja! Your payment went through.
  > This is your private page, with everything you ordered: printable cards, edits, guest replies and files:
  > {{2}}
  > Keep this link, it is just for you.

**`bahja_invitation_link`**: one variable, `{{1}}` is the invitation link.

- Arabic:
  > وهذا رابط دعوتك لإرساله إلى ضيوفك 💌
  > {{1}}
- English:
  > And here is your invitation link to send to your guests 💌
  > {{1}}

Meta usually approves Utility templates within minutes.

## 3. Railway variables

Set these in Railway → the service → **Variables**, then redeploy:

| Variable | Value |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | the permanent token from step 1.5 |
| `WHATSAPP_PHONE_NUMBER_ID` | the Phone number ID from step 1.4 |
| `WHATSAPP_TEMPLATE_PAGE` | optional, default `bahja_customer_page` |
| `WHATSAPP_TEMPLATE_INVITATION` | optional, default `bahja_invitation_link` |
| `WHATSAPP_API_VERSION` | optional, default `v21.0` |

To test, pay for an order with your own number. If nothing arrives, the server log shows
`[notify] WhatsApp message to customer failed`, followed by Meta's reason.

Orders paid before the settings were added are not sent afterwards. Only orders paid within the last two days catch up.
