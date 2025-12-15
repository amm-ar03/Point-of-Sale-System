import { useEffect, useState } from "react";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [skuInput, setSkuInput] = useState("");
  const [skuSearch, setSkuSearch] = useState("");
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("http://localhost:8080/api/products");
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) {
    return <div style={{ padding: "1rem" }}>Loading products...</div>;
  }

  if (error) {
    return <div style={{ padding: "1rem", color: "red" }}>Error: {error}</div>;
  }

  
  async function handleAddProduct(e) {
  e.preventDefault();
  setSaving(true);

  try {
    const response = await fetch("http://localhost:8080/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        sku: skuInput,
        price: Number(newPrice),
        stockQuantity: Number(newStock),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const created = await response.json();

    // add new product to the list
    setProducts((prev) => [...prev, created]);

    // clear form
    setNewName("");
    setNewPrice("");
    setNewStock("");
    setSkuInput("");
  } catch (err) {
    console.error("Failed to add product:", err);
    setError(err.message || "Failed to add product");
  } finally {
    setSaving(false);
  }
}

  function handleAddToCart(product) {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // increment quantity
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // new cart item
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
        },
      ];
    });
  }

  async function handleDeleteProduct(id) {
  try {
    const response = await fetch(`http://localhost:8080/api/products/${id}`, {
      method: "DELETE",
    });
    if (!response.ok && response.status !== 204) {
      throw new Error(`HTTP error ${response.status}`);
    }

    // remove from state
    setProducts((prev) => prev.filter((p) => p.id !== id));
  } catch (err) {
    console.error("Failed to delete product:", err);
    setError(err.message || "Failed to delete product");
  }
}

  async function handleFindBySku(e) {
    e.preventDefault();

    if (!skuSearch.trim()) return;

    try {
      const res = await fetch(
        `http://localhost:8080/api/products/sku/${encodeURIComponent(skuSearch.trim())}`
      );

      if (!res.ok) {
        alert("Product not found");
        return;
      }

      const product = await res.json();
      // For now just add it to cart (or you can console.log / alert)
      handleAddToCart(product);
      setSkuSearch("");
    } catch (err) {
      console.error("Error finding product by SKU:", err);
      alert("Error finding product");
    }
  }




  return (
    <div style={{ padding: "1rem" }}>
      <h1>Products</h1>

      {error && (
        <div style={{ color: "red", marginBottom: "0.5rem" }}>
          Error: {error}
        </div>
      )}

      {/* Cart */}
      <div style={{ marginBottom: "1rem" }}>
        <h2>Cart</h2>
        {cartItems.length === 0 ? (
          <p>No items in cart.</p>
        ) : (
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>ID</th>
                <th>SKU</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Row total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.quantity}</td>
                  <td>{item.price}</td>
                  <td>{(item.price * item.quantity).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() =>
                        setCartItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id && i.quantity > 1
                              ? { ...i, quantity: i.quantity - 1 }
                              : i
                          )
                        )
                      }
                    >
                      -
                    </button>
                    <button
                      onClick={() =>
                        setCartItems((prev) =>
                          prev.map((i) =>
                            i.id === item.id
                              ? { ...i, quantity: i.quantity + 1 }
                              : i
                          )
                        )
                      }
                    >
                      +
                    </button>
                    <button
                      onClick={() =>
                        setCartItems((prev) =>
                          prev.filter((i) => i.id !== item.id)
                        )
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SKU search */}
      <div style={{ marginBottom: "1rem" }}>
        <h2>Scan / Enter SKU</h2>
        <form onSubmit={handleFindBySku}>
          <input
            type="text"
            placeholder="Enter SKU"
            value={skuSearch}
            onChange={(e) => setSkuSearch(e.target.value)}
            required
          />
          <button type="submit">Find</button>
        </form>
      </div>

      {/* Add product form */}
      <div style={{ marginBottom: "1rem" }}>
        <h2>Add Product</h2>
        <form onSubmit={handleAddProduct}>
          <div>
            <label>
              Name:{" "}
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </label>
          </div>
          <div>
            <label>
              Price:{" "}
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />
            </label>
          </div>
          <div>
            <label>
              SKU:{" "}
              <input
                type="text"
                value={skuInput}
                onChange={(e) => setSkuInput(e.target.value)}
                required
              />
            </label>
          </div>
          <div>
            <label>
              Stock:{" "}
              <input
                type="number"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                required
              />
            </label>
          </div>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add Product"}
          </button>
        </form>
      </div>

      {/* Products table */}
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>SKU</th>
            <th>Price</th>
            <th>Stock Qty</th>
            <th>Delete</th>
            <th>Add to cart</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.name}</td>
              <td>{p.sku}</td>
              <td>{p.price}</td>
              <td>{p.stockQuantity}</td>
              <td>
                <button onClick={() => handleDeleteProduct(p.id)}>
                  Delete
                </button>
              </td>
              <td>
                <button onClick={() => handleAddToCart(p)}>
                  Add to cart
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
