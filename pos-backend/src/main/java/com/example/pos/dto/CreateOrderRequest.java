package com.example.pos.dto;

import java.util.List;



public class CreateOrderRequest {

    private List<CreateOrderItemRequest> items;

    public CreateOrderRequest() {
    }

    public List<CreateOrderItemRequest> getItems() {
        return items;
    }

    public void setItems(List<CreateOrderItemRequest> items) {
        this.items = items;
    }

    private String customerName;
    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    private Long customerId;
    public Long getCustomerId() { 
        return customerId; 
    }
    
    public void setCustomerId(Long customerId) {
         this.customerId = customerId; 
    }

}
