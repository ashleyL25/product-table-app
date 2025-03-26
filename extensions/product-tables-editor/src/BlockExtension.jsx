import {
  reactExtension,
  AdminBlock,
  BlockStack,
  Text,
  Button,
  useApi,
  TextField,
} from "@shopify/ui-extensions-react/admin";
import { useState, useEffect } from "react";

const TARGET = "admin.product-details.block.render";

export default reactExtension(TARGET, () => <ProductTablesEditor />);

function ProductTablesEditor() {
  const { data } = useApi(TARGET);
  const product = data?.product;
  const productId = product?.id;

  const [assignedTables, setAssignedTables] = useState([]);
  const [rowsByTableId, setRowsByTableId] = useState({});

  // Load templates from metafield value
  useEffect(() => {
    const templateField = data?.shop?.metafields?.find(
      (mf) => mf.namespace === "custom" && mf.key === "table_templates"
    );

    if (!templateField) return;

    try {
      const templates = JSON.parse(templateField.value);
      const filtered = templates.filter((t) =>
        t.assignedToProducts.includes(product.id.toString())
      );
      setAssignedTables(filtered);

      // Load existing row data from product metafields
      const rowState = {};
      for (const table of filtered) {
        const mf = product.metafields.find(
          (m) =>
            m.namespace === "custom" &&
            m.key === `table_data_${table.id}`
        );
        rowState[table.id] = mf?.value
          ? JSON.parse(mf.value).rows
          : [];
      }
      setRowsByTableId(rowState);
    } catch (err) {
      console.error("Error parsing table_templates:", err);
    }
  }, [data]);

  const updateCell = (tableId, rowIndex, cellIndex, value) => {
    const updatedRows = [...(rowsByTableId[tableId] || [])];
    updatedRows[rowIndex].cells[cellIndex] = value;
    setRowsByTableId((prev) => ({ ...prev, [tableId]: updatedRows }));
  };

  const addRow = (tableId, columnCount) => {
    const newRow = {
      id: `row_${Date.now()}`,
      cells: Array(columnCount).fill(""),
    };
    setRowsByTableId((prev) => ({
      ...prev,
      [tableId]: [...(prev[tableId] || []), newRow],
    }));
  };

  const deleteRow = (tableId, rowIndex) => {
    const updated = [...rowsByTableId[tableId]];
    updated.splice(rowIndex, 1);
    setRowsByTableId((prev) => ({ ...prev, [tableId]: updated }));
  };

  const saveTableRows = async (tableId) => {
    const rows = rowsByTableId[tableId] || [];
    const response = await fetch("/api/save-rows", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
        tableId,
        rows,
      }),
    });

    if (response.ok) {
      alert("✅ Rows saved!");
    } else {
      alert("❌ Error saving rows.");
    }
  };

  return (
    <AdminBlock title="Product Tables Editor">
      <BlockStack spacing="loose">
        {assignedTables.map((table) => (
          <div key={table.id}>
            <Text fontWeight="bold">{table.name}</Text>
            {(rowsByTableId[table.id] || []).map((row, rowIndex) => (
              <BlockStack key={row.id} spacing="tight">
                {row.cells.map((cell, cellIndex) => (
                  <TextField
                    key={cellIndex}
                    value={cell}
                    onChange={(val) =>
                      updateCell(table.id, rowIndex, cellIndex, val)
                    }
                    label={`Column ${cellIndex + 1}`}
                  />
                ))}
                <Button
                  tone="critical"
                  onPress={() => deleteRow(table.id, rowIndex)}
                >
                  Delete Row
                </Button>
              </BlockStack>
            ))}
            <Button
              onPress={() => addRow(table.id, table.columns.length)}
            >
              Add Row
            </Button>
            <Button
              variant="primary"
              onPress={() => saveTableRows(table.id)}
            >
              Save Table Rows
            </Button>
          </div>
        ))}
      </BlockStack>
    </AdminBlock>
  );
}
