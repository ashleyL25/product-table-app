// /app/routes/api/save-tables.jsx
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const body = await request.json();
  const { tables } = body;

  try {
    const result = await admin.graphql(`
      mutation SaveShopMetafield {
        metafieldsSet(metafields: [
          {
            namespace: "custom",
            key: "table_templates",
            type: "json",
            value: ${JSON.stringify(JSON.stringify(tables))}
          }
        ]) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `);

    return json({ success: true, result });
  } catch (err) {
    console.error("Error saving metafield:", err);
    return json({ error: true });
  }
};
