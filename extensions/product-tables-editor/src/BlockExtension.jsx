import {
  reactExtension,
  AdminBlock,
  BlockStack,
  Text,
  TextField,
  Select,
  Button,
  useApi,
  useField,
  useForm,
  useBuyerJourney,
} from "@shopify/ui-extensions-react/admin";
import { useState, useEffect } from "react";

const TARGET = "admin.product-details.block.render";

export default reactExtension(TARGET, () => <ProductTableEditor />);

function ProductTableEditor() {
  const { data, applyMetafieldsChange } = useApi(TARGET);
  const product = data?.product;

  const [templates, setTemplates] = useState([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]);
  const [rowsByTableId, setRowsByTableId] = useState({});

  // Fetch templates and assigned tables on mount
  useEffect(() => {
    const templateMetafield = data?.shop?.metafields?.find(
      (m) => m.namespace === "custom" && m.key === "table_templates"
    );

    if (templateMetafield?.value) {
      try {
        const allTemplates = JSON.parse(templateMetafield.value);
        setTemplates(allTemplates);
      } catch (e) {
        console.error("Invalid table_templates metafield JSON");
      }
    }

    const assigned = product?.metafields?.find(
      (m) => m.namespace === "custom" && m.key === "assigned_tables"
    );
    if (assigned?.value) {
      try {
        setSelectedTemplateIds(JSON.parse(assigned.value));
      } catch (e) {
        console.error("Invalid assigned_tables value");
      }
    }

    // Load existing row data for each assigned table
    const rowState = {};
    product?.metafields?.forEach((m) => {
      if (
        m.namespace === "custom" &&
        m.key.startsWith("table_data_") &&
        m.value
      ) {
        try {
          const tableId = m.key.replace("table_data_", "");
          rowState[tableId] = JSON.parse(m.value).rows || [];
        } catch (e) {
          console.error("Bad table_data JSON for", m.key);
        }
      }
    });
    setRowsByTableId(rowState);
  }, [data]);

  // Handle table selection change
  const handleTemplateChange = (value) => {
    const newIds = Array.isArray(value) ? value : [value];
    setSelectedTemplateIds(newIds);
    applyMetafieldsChange({
      type: "update",
      namespace: "custom",
      key: "assigned_tables",
      value: JSON.stringify(newIds),
    });
  };

  const updateCell = (tableId, rowIndex, cellIndex, val) => {
    const rows = [...(rowsByTableId[tableId] || [])];
    rows[rowIndex].cells[cellIndex] = val;
    setRowsByTableId((prev) => ({ ...prev, [tableId]: rows }));
  };

  const addRow = (tableId, colCount) => {
    const row = {
      id: `row_${Date.now()}`,
      cells: Array(colCount).fill(""),
    };
    setRowsByTableId((prev) => ({
      ...prev,
      [tableId]: [...(prev[tableId] || []), row],
    }));
  };

  const deleteRow = (tableId, rowIndex) => {
    const updated = [...rowsByTableId[tableId]];
    updated.splice(rowIndex, 1);
    setRowsByTableId((prev) => ({ ...prev, [tableId]: updated }));
  };

  const saveRows = (tableId) => {
    const rows = rowsByTableId[tableId] || [];
    applyMetafieldsChange({
      type: "update",
      namespace: "custom",
      key: `table_data_${tableId}`,
      value: JSON.stringify({ rows }),
      typeDescriptor: "json",
    });
  };

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: t.name,
  }));

  const selectedTemplates = templates.filter((t) =>
    selectedTemplateIds.includes(t.id)
  );

  return (
    <AdminBlock title="Product Tables">
      <BlockStack spacing="loose">
        <Select
          label="Assign Tables to This Product"
          multiple
          options={templateOptions}
          value={selectedTemplateIds}
          onChange={handleTemplateChange}
        />

        {selectedTemplates.map((table) => (
          <BlockStack spacing="tight" key={table.id}>
            <Text appearance="subdued" emphasis>
              {table.name}
            </Text>

            {(rowsByTableId[table.id] || []).map((row, rIndex) => (
              <BlockStack key={row.id}>
                {row.cells.map((cell, cIndex) => (
                  <TextField
                    key={cIndex}
                    label={`Column ${cIndex + 1}`}
                    value={cell}
                    onChange={(val) =>
                      updateCell(table.id, rIndex, cIndex, val)
                    }
                  />
                ))}
                <Button
                  tone="critical"
                  onPress={() => deleteRow(table.id, rIndex)}
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
              onPress={() => saveRows(table.id)}
            >
              Save Rows
            </Button>
          </BlockStack>
        ))}
      </BlockStack>
    </AdminBlock>
  );
}
