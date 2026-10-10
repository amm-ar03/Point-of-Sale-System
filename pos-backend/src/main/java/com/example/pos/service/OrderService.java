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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

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

    @Transactional
    public Order createOrder(CreateOrderRequest request) {
        Order order = new Order();
        order.setCustomerName(clean(request.getCustomerName()));
        order.setCustomerId(request.getCustomerId());
        fill(order, request, true);
        order.setStatus("PAID");
        return orderRepository.save(order);
    }

    @Transactional
    public Order saveDraft(Long id, CreateOrderRequest request, String username) {
        String name = clean(request.getCustomerName());
        if (name == null) {
            throw new OrderException("Customer name is required for a draft");
        }
        Order order;
        if (id == null) {
            order = new Order();
            order.setStatus("DRAFT");
            order.setCreatedBy(username);
        } else {
            order = findDraft(id);
        }
        order.setCustomerName(name);
        order.setCustomerId(request.getCustomerId());
        fill(order, request, false);
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    @Transactional
    public Order payDraft(Long id) {
        Order order = findDraft(id);

        List<CreateOrderItemRequest> lines = new ArrayList<>();
        for (OrderItem i : order.getItems()) {
            CreateOrderItemRequest l = new CreateOrderItemRequest();
            l.setProductId(i.getProduct().getId());
            l.setQuantity(i.getQuantity());
            l.setUnitPrice(i.getUnitPrice());
            lines.add(l);
        }
        CreateOrderRequest req = new CreateOrderRequest();
        req.setItems(lines);

        fill(order, req, true);
        order.setStatus("PAID");
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    @Transactional
    public void deleteDraft(Long id) {
        orderRepository.delete(findDraft(id));
    }

    private Order findDraft(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderException("Draft not found: id=" + id));
        if (!"DRAFT".equals(order.getStatus())) {
            throw new OrderException("Order #" + id + " is not a draft");
        }
        return order;
    }

    private String clean(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private void fill(Order order, CreateOrderRequest request, boolean deductStock) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new OrderException("Order must contain at least one item");
        }

        List<CreateOrderItemRequest> lines = new ArrayList<>(request.getItems());
        lines.sort(Comparator.comparing(CreateOrderItemRequest::getProductId,
                Comparator.nullsFirst(Comparator.naturalOrder())));

        order.getItems().clear();
        BigDecimal netTotal = BigDecimal.ZERO;
        BigDecimal taxableTotal = BigDecimal.ZERO;

        for (CreateOrderItemRequest req : lines) {
            if (req.getProductId() == null) {
                throw new OrderException("Each item needs a Product ID");
            }

            Optional<Product> found = deductStock
                    ? productRepository.findByIdForUpdate(req.getProductId())
                    : productRepository.findById(req.getProductId());
            Product product = found
                    .filter(Product::isActive)
                    .orElseThrow(() -> new OrderException("Product not found: id=" + req.getProductId()));

            int quantity = req.getQuantity() == null ? 0 : req.getQuantity();
            if (quantity <= 0) {
                throw new OrderException("Invalid quantity for " + product.getName());
            }

            int stock = product.getStockQuantity() == null ? 0 : product.getStockQuantity();
            if (deductStock && stock < quantity) {
                throw new OrderException("Not enough stock for " + product.getName()
                        + " (on hand: " + stock + ", requested: " + quantity + ")");
            }

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

            boolean taxExempt = Boolean.TRUE.equals(product.getTaxExempt());

            OrderItem item = new OrderItem(product, quantity, unitPrice, taxExempt);
            order.addItem(item);

            netTotal = netTotal.add(item.getLineTotal());
            if (!taxExempt) {
                taxableTotal = taxableTotal.add(item.getLineTotal());
            }

            if (deductStock) {
                product.setStockQuantity(stock - quantity);
            }
        }

        BigDecimal taxAmount = taxableTotal.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        order.setNetTotal(netTotal);
        order.setTaxAmount(taxAmount);
        order.setGrandTotal(netTotal.add(taxAmount));
    }
}