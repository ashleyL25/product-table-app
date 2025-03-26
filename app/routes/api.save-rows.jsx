import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const { productId, tableId, rows } = await request.json();

  const metafieldKey = `table_data_${tableId}`;

  const result = await admin.graphql(`
    mutation {
      productUpdate(input: {
        id: "${productId}",
        metafields: [{
          namespace: "custom",
          key: "${metafieldKey}",
          type: "json",
          value: ${JSON.stringify(JSON.stringify({ rows }))}
        }]
      }) {
        product {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `);

  return json({ success: true, result });
};
