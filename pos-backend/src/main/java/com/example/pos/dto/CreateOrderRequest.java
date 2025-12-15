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
}
