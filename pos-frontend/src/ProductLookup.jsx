export default function ProductLookup({
  open, onClose, onSearch, onAdd, skuValue, setSkuValue,
  product, quantity, setQuantity, price, setPrice,
}) {
  if (!open) return null;
  return (
    <div className="overlay">
      <div className="dialog">
        <div className="dtitle">Add Item to Sale</div>
        <div className="row">
          <input autoFocus placeholder="SKU or name" value={skuValue}
            onChange={(e) => setSkuValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()} />
          <button onClick={onSearch}>Search</button>
        </div>
        {product && (
          <div className="info">
            <b>{product.name}</b><br />
            SKU: {product.sku} · Stock: {product.stockQuantity} · Price: {Number(product.price).toFixed(2)}
          </div>
        )}
        <div className="row"><label>Quantity</label>
          <input type="number" min="1" step="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} /></div>
        <div className="row"><label>Override price</label>
          <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
        <div className="dfoot">
          <button onClick={onClose}>Close</button>
          <button className="primary" disabled={!product} onClick={onAdd}>Add to Cart</button>
        </div>
      </div>
    </div>
  );
}