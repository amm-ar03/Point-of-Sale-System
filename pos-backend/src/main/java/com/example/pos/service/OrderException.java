package com.example.pos.service;

/** Thrown for any rule violation while creating an order. A RuntimeException, so @Transactional rolls everything back. */
public class OrderException extends RuntimeException {
    public OrderException(String message) {
        super(message);
    }
}
