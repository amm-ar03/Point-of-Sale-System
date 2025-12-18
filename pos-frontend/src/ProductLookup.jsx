// src/ProductLookupDialog.jsx
function ProductLookup({
  open,
  onClose,
  onSearch,
  onAdd,
  skuValue,
  setSkuValue,
  product,
  quantity,
  setQuantity,
  price,
  setPrice,
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "#c52121ff",
          padding: "1rem",
          minWidth: "400px",
          borderRadius: "4px",
        }}
      >
        <h3>Add Item to Sale</h3>

        {/* Search by SKU or name */}
        <div style={{ marginBottom: "0.5rem" }}>
          <input
            type="text"
            placeholder="Enter SKU or name"
            value={skuValue}
            onChange={(e) => setSkuValue(e.target.value)}
            style={{ width: "100%", padding: "0.4rem" }}
          />
          <button
            type="button"
            onClick={onSearch}
            style={{ marginTop: "0.5rem" }}
          >
            Search
          </button>
        </div>

        {/* If product found, show info and quantity/price controls */}
        {product && (
          <>
            <div style={{ marginBottom: "0.5rem" }}>
              <strong>{product.name}</strong> (SKU: {product.sku})<br />
              Stock on hand: {product.stockQuantity}<br />
              Default price: {product.price}
            </div>

            <div style={{ marginBottom: "0.5rem" }}>
              <label>
                Quantity:{" "}
                <input
                  type="text"
                  min="0"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Number(e.target.value) || 0)
                  }
                />
              </label>
            </div>

            <div style={{ marginBottom: "0.5rem" }}>
              <label>
                Override price for this sale (optional):{" "}
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
            </div>

            <button type="button" onClick={onAdd}>
              Add to Cart
            </button>
          </>
        )}

        <div style={{ marginTop: "0.5rem" }}>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductLookup;
