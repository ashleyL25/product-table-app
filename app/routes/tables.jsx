// /app/routes/tables.jsx
import { useState } from "react";
import { json } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";

export const loader = async () => {
  // TODO: Replace with real API call or metafield fetch
  return json({
    tables: [],
  });
};

export const action = async ({ request }) => {
  const body = await request.json();
  console.log("Saving tables:", body);

  // TODO: Save to Shopify metafield or DB
  return json({ success: true });
};

export default function TableManager() {
  const [tables, setTables] = useState([]);
  const [newTableName, setNewTableName] = useState("");
  const fetcher = useFetcher();

  const addTable = () => {
    const newTable = {
      id: `table_${Date.now()}`,
      name: newTableName,
      columns: [],
      assignedToProducts: [],
    };
    setTables([...tables, newTable]);
    setNewTableName("");
  };

  const addColumn = (tableId) => {
    setTables(
      tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: [...t.columns, { id: `col_${Date.now()}`, label: "" }],
            }
          : t
      )
    );
  };

  const updateColumn = (tableId, colIndex, label) => {
    setTables(
      tables.map((t) => {
        if (t.id !== tableId) return t;
        const newCols = [...t.columns];
        newCols[colIndex].label = label;
        return { ...t, columns: newCols };
      })
    );
  };

  const saveAll = () => {
    fetch("/api/save-tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tables }),
        }).then((res) => {
        if (res.ok) {
            alert("✅ Table templates saved to Shopify!");
        } else {
            alert("❌ Error saving tables.");
        }
    });

  };

  return (
    <div style={{ padding: 32 }}>
      <h1>Product Table Templates</h1>

      <input
        type="text"
        value={newTableName}
        onChange={(e) => setNewTableName(e.target.value)}
        placeholder="New table name"
      />
      <button onClick={addTable}>Add Table</button>

      {tables.map((table) => (
        <div
          key={table.id}
          style={{ marginTop: 24, padding: 16, border: "1px solid #ccc" }}
        >
          <h3>{table.name}</h3>
          <p>Columns:</p>
          <ul>
            {table.columns.map((col, i) => (
              <li key={col.id}>
                <input
                  type="text"
                  value={col.label}
                  onChange={(e) =>
                    updateColumn(table.id, i, e.target.value)
                  }
                  placeholder={`Column ${i + 1} label`}
                />
              </li>
            ))}
          </ul>
          <p>Assigned to Products (comma-separated IDs):</p>
            <input
            type="text"
            value={table.assignedToProducts.join(",")}
            onChange={(e) => {
                const value = e.target.value
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean);
                setTables(
                tables.map((t) =>
                    t.id === table.id
                    ? { ...t, assignedToProducts: value }
                    : t
                )
                );
            }}
            placeholder="e.g. 812312321, 823321"
            style={{ width: "100%", marginBottom: "1rem" }}
            />

          <button onClick={() => addColumn(table.id)}>Add Column</button>
        </div>
      ))}

      <button
        onClick={saveAll}
        style={{ marginTop: 32, background: "#3f51b5", color: "#fff" }}
      >
        Save All Tables
      </button>

      {fetcher.data?.success && <p>✅ Tables saved!</p>}
    </div>
  );
}
