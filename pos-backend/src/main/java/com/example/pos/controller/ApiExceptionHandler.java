package com.example.pos.controller;

import com.example.pos.service.OrderException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    // Plain-text 400 so the frontend can show the message with res.text()
    @ExceptionHandler(OrderException.class)
    public ResponseEntity<String> handleOrderException(OrderException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }
}
