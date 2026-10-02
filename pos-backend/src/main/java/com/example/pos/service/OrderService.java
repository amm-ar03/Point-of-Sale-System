package com.example.pos.service;

import com.example.pos.dto.CreateOrderItemRequest;
import com.example.pos.dto.CreateOrderRequest;
import com.example.pos.model.Order;
import com.example.pos.model.OrderItem;
import com.example.pos.model.Product;
import com.example.pos.repository.OrderRepository;
import com.example.pos.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final BigDecimal taxRate;

    public OrderService(OrderRepository orderRepository,
                        ProductRepository productRepository,
                        @Value("${pos.tax-rate}") BigDecimal taxRate) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.taxRate = taxRate;
    }

    public BigDecimal getTaxRate() {
        return taxRate;
    }

    /**
     * Creates a paid order atomically: if ANY line fails, the whole transaction rolls back,
     * so stock is never decremented for an order that doesn't exist.
     */
    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new OrderException("Order must contain at least one item");
        }

        // Lock products in a fixed (id) order so two concurrent sales can't deadlock each other
        List<CreateOrderItemRequest> lines = new ArrayList<>(request.getItems());
        lines.sort(Comparator.comparing(CreateOrderItemRequest::getProductId,
                Comparator.nullsFirst(Comparator.naturalOrder())));

        Order order = new Order();
        BigDecimal netTotal = BigDecimal.ZERO;
        BigDecimal taxableTotal = BigDecimal.ZERO;

        for (CreateOrderItemRequest req : lines) {
            if (req.getProductId() == null) {
                throw new OrderException("Each item needs a productId");
            }

            Product product = productRepository.findByIdForUpdate(req.getProductId())
                    .filter(Product::isActive)
                    .orElseThrow(() -> new OrderException("Product not found: id=" + req.getProductId()));

            int quantity = req.getQuantity() == null ? 0 : req.getQuantity();
            if (quantity <= 0) {
                throw new OrderException("Invalid quantity for " + product.getName());
            }

            int stock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
            if (stock < quantity) {
                throw new OrderException("Not enough stock for " + product.getName()
                        + " (on hand: " + stock + ", requested: " + quantity + ")");
            }

            // The catalogue price is used unless the client explicitly overrides it (must be > 0).
            // TODO: once users/roles exist, only allow overrides for managers.
            BigDecimal unitPrice;
            if (req.getUnitPrice() != null) {
                if (req.getUnitPrice().signum() <= 0) {
                    throw new OrderException("Price override must be greater than zero for " + product.getName());
                }
                unitPrice = req.getUnitPrice();
            } else {
                if (product.getPrice() == null) {
                    throw new OrderException("Product has no price: " + product.getName());
                }
                unitPrice = product.getPrice();
            }
            unitPrice = unitPrice.setScale(2, RoundingMode.HALF_UP);

            // Tax-exempt status comes from the product record only, never from the client
            boolean taxExempt = Boolean.TRUE.equals(product.getTaxExempt());

            OrderItem item = new OrderItem(product, quantity, unitPrice, taxExempt);
            order.addItem(item);

            netTotal = netTotal.add(item.getLineTotal());
            if (!taxExempt) {
                taxableTotal = taxableTotal.add(item.getLineTotal());
            }

            // product is a managed entity: this change is written when the transaction commits
            product.setStockQuantity(stock - quantity);
        }

        BigDecimal taxAmount = taxableTotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        order.setNetTotal(netTotal);
        order.setTaxAmount(taxAmount);
        order.setGrandTotal(netTotal.add(taxAmount));

        return orderRepository.save(order);
    }
}
