import { useEffect, useState } from "react";
import ProductLookup from "./ProductLookup.jsx";

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
  const [newTaxExempt, setNewTaxExempt] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [dialogSku, setDialogSku] = useState("");
  const [dialogProduct, setDialogProduct] = useState(null);
  const [dialogQuantity, setDialogQuantity] = useState(1);
  const [dialogPrice, setDialogPrice] = useState("");




  const taxRate = 0.07; // 7% sales tax
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
        taxExempt: newTaxExempt,
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
    setNewTaxExempt(false);
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
          taxExempt: product.taxExempt || false,
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

  async function handlePay() {
  if (cartItems.length === 0) {
    alert("Cart is empty");
    return;
  }

  // Build request body from cart
  const items = cartItems.map((item) => ({
    productId: item.id,
    quantity: item.quantity,
    unitPrice: item.price,
    taxExempt: item.taxExempt || false,
  }));

  try {
    const res = await fetch("http://localhost:8080/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });

    if (!res.ok) {
      const text = await res.text();
      alert("Order failed: " + text);
      return;
    }

    const savedOrder = await res.json();
    console.log("Saved order:", savedOrder);

    alert(`Sale completed. Order #${savedOrder.id}, total ${savedOrder.grandTotal.toFixed(2)}`);

    // Clear cart
    setCartItems([]);
  } catch (err) {
    console.error("Pay error:", err);
    alert("Error completing sale");
  }
}

async function loadOrders() {
  try {
    const res = await fetch("http://localhost:8080/api/orders");
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }
    const data = await res.json();
    setOrders(data);
  } catch (err) {
    console.error("Failed to load orders:", err);
  }
}

async function handleDialogSearch() {
  const term = dialogSku.trim();
  if (!term) return;

  try {
    let product = null;

    // Try backend SKU lookup first
    const bySkuRes = await fetch(
      `http://localhost:8080/api/products/sku/${encodeURIComponent(term)}`
    );
    if (bySkuRes.ok) {
      product = await bySkuRes.json();
    } else {
      // Fallback: search in loaded products by name or SKU
      const lower = term.toLowerCase();
      product = products.find(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          (p.sku && p.sku.toLowerCase().includes(lower))
      );
    }

    if (!product) {
      alert("No product found");
      setDialogProduct(null);
      return;
    }

    setDialogProduct(product);
    setDialogPrice(String(product.price ?? ""));
    setDialogQuantity(1);
  } catch (err) {
    console.error("Dialog search error:", err);
    alert("Error searching product");
  }
}

function handleDialogAdd() {
  if (!dialogProduct) return;

  const priceToUse =
    dialogPrice.trim() === ""
      ? dialogProduct.price
      : Number(dialogPrice);

  if (!priceToUse || dialogQuantity <= 0) {
    alert("Invalid quantity or price");
    return;
  }

  const stock = dialogProduct.stockQuantity ?? 0;

  // If product is already in cart, include its existing quantity
  const existingInCart = cartItems.find((i) => i.id === dialogProduct.id);
  const existingQty = existingInCart ? existingInCart.quantity : 0;
  const requestedTotalQty = existingQty + dialogQuantity;

  if (requestedTotalQty > stock) {
    alert(
      `Not enough stock. On hand: ${stock}, requested total in cart: ${requestedTotalQty}`
    );
    return;
  }

  setCartItems((prev) => {
    const existing = prev.find((item) => item.id === dialogProduct.id);
    if (existing) {
      return prev.map((item) =>
        item.id === dialogProduct.id
          ? {
              ...item,
              quantity: item.quantity + dialogQuantity,
              // decide whether to override price when merging
              price: priceToUse,
            }
          : item
      );
    }
    return [
      ...prev,
      {
        id: dialogProduct.id,
        name: dialogProduct.name,
        sku: dialogProduct.sku,
        price: priceToUse,
        quantity: dialogQuantity,
        taxExempt: dialogProduct.taxExempt || false,
      },
    ];
  });

  setShowItemDialog(false);
}

  const netTotal = cartItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
  );

  const taxableTotal = cartItems.reduce(
    (sum, item) => (item.taxExempt ? sum : sum + item.price * item.quantity),
    0
  );

  const taxAmount = taxableTotal * taxRate;
  const grandTotal = netTotal + taxAmount;




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
                        setCartItems((prev) => {
                          // Find current product in products list to know stock
                          const product = products.find((p) => p.id === item.id);
                          const stock = product?.stockQuantity ?? 0;

                          return prev.map((i) => {
                            if (i.id !== item.id) return i;

                            if (i.quantity + 1 > stock) {
                              alert(
                                `Not enough stock for ${i.name}. On hand: ${stock}, requested: ${
                                  i.quantity + 1
                                }`
                              );
                              return i;
                            }

                            return { ...i, quantity: i.quantity + 1 };
                          });
                        })
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

      {/* Totals */}
      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <div>
          <strong>Net Total:</strong> ${netTotal.toFixed(2)}
        </div>
        <div>
          <strong>Tax ({(taxRate * 100).toFixed(0)}%):</strong> ${taxAmount.toFixed(2)}
        </div>
        <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
          <strong>Total:</strong> ${grandTotal.toFixed(2)}
        </div>
          <button onClick={handlePay}>
                      Pay
                    </button>
          <button onClick={() => setCartItems([])}>
                      New Sale
                    </button>
          <button onClick={() => setCartItems([])}>
                      Void
                    </button>
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
        <button
          type="button"
          style={{ marginTop: "0.5rem" }}
          onClick={() => {
            setShowItemDialog(true);
            setDialogSku("");
            setDialogProduct(null);
            setDialogQuantity(1);
            setDialogPrice("");
          }}
        >
          Open Product Lookup
        </button>
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
          <div>
            <label>
              <input
                type="checkbox"
                checked={newTaxExempt}
                onChange={(e) => setNewTaxExempt(e.target.checked)}
              />
              {" "}Tax Exempt
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
            <th>Tax Exempt</th>
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
              <td>{p.taxExempt ? "Yes" : "No"}

              </td>
            </tr>
          ))}
        </tbody>
          </table>
        <h2>Orders</h2>
        <button onClick={loadOrders}>Refresh Orders</button>
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date/Time</th>
              <th>Net</th>
              <th>Tax</th>
              <th>Total</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6}>No orders yet.</td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>{o.id}</td>
                  <td>{o.createdAt}</td>
                  <td>{o.netTotal?.toFixed(2)}</td>
                  <td>{o.taxAmount?.toFixed(2)}</td>
                  <td>{o.grandTotal?.toFixed(2)}</td>
                  <td>{o.items ? o.items.length : 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <ProductLookup
            open={showItemDialog}
            onClose={() => setShowItemDialog(false)}
            onSearch={handleDialogSearch}
            onAdd={handleDialogAdd}
            skuValue={dialogSku}
            setSkuValue={setDialogSku}
            product={dialogProduct}
            quantity={dialogQuantity}
            setQuantity={setDialogQuantity}
            price={dialogPrice}
            setPrice={setDialogPrice}
        />

    </div>
    
  );
}

export default App;
